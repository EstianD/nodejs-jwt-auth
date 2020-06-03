const fs = require("fs");
const AWS = require("aws-sdk");
// Config
const config = require("../utils/config");
const uploadRouter = require("express").Router();
const path = require("path");

// Model
const Upload = require("../models/Upload");

// Middleware
const verify = require("../middleware/verifyToken");

// const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: "./files",
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage }).single("file");

uploadRouter.post("/profile", verify, (req, res) => {
  console.log(req.files);
  console.log(req.body);

  if (req.files === null) {
    return res.status(400).json({ msg: "No file uploaded!" });
  }

  const file = req.files.file;

  // Store file in /uploads folder
  file.mv(`${process.cwd()}/uploads/${file.name}`, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }

    res.json({ filename: file.name, filePath: `/uploads/${file.name}` });
  });
});

uploadRouter.post("/gallery", verify, async (req, res) => {
  const files = req.files;
  const id = req.user.id;
  console.log("starting");

  // Check if files contains data
  if (files === null) {
    return res.status(400).json({
      msg: "No file uploaded!",
    });
  }

  // Create AWS S3 instance
  const s3 = new AWS.S3({
    accessKeyId: config.AWS_ID,
    secretAccessKey: config.AWS_SECRET,
  });

  // FUNCTIONS
  // UPLOAD FILES FUNCTION
  async function uploadFile(key, fileData) {
    // Upload file to Bucket/key(folder)/filename
    // Configure upload config
    const params = {
      Bucket: "face-watch",
      Key: key,
      Body: fileData,
    };
    console.log("uploading...");
    // Upload file
    let res = await s3.upload(params).promise();
    console.log("uploading done");
  }

  // Save imageUrl to DB
  const saveUploadToDb = async (imgString) => {
    // Check if file allready exists in db
    const fileExists = await Upload.findOne({ imageUrl: imgString });

    console.log("saving...");
    if (!fileExists) {
      // Image url ex: "https://face-watch.s3.amazonaws.com/5ebc250b315756357b7269a0/Keanu_Reeves_1.jpg"
      const upload = new Upload({
        userId: req.user.id,
        imageUrl: imgString,
      });

      await upload.save();
    }
    console.log("saved");
  };

  try {
    // Check how many files are passed to server
    if (files.image.length) {
      for (i = 0; files.image.length > i; i++) {
        console.log(i);

        // console.log(files.image[i].name.substring(0, 4));
        // console.log(new Date().getTime());

        let filename = `${files.image[i].name}`;

        let fileExt = filename.split(".").pop();
        let newFileName = `${req.user.id.substring(
          0,
          4
        )}-${new Date().getTime()}.${fileExt}`;

        console.log(newFileName);
        let key = `${req.user.id}/${newFileName}`;
        const imageString = `https://face-watch.s3.amazonaws.com/${key}`;

        await saveUploadToDb(imageString);
        await uploadFile(key, files.image[i].data);
      }
    } else {
      // Set image name and image data
      let filename = files.image.name;
      let filedata = files.image.data;

      let fileExt = filename.split(".").pop();
      let newFileName = `${req.user.id.substring(
        0,
        4
      )}-${new Date().getTime()}.${fileExt}`;

      // console.log(filename.split(".").pop());
      // console.log(req.user.id.substring(0, 4));
      // console.log(new Date().getTime());
      console.log(newFileName);

      let key = `${req.user.id}/${newFileName}`;
      const imageString = `https://face-watch.s3.amazonaws.com/${key}`;
      console.log("single");

      await saveUploadToDb(imageString);
      await uploadFile(key, filedata);
    }
    console.log("done");
    res.json({
      status: 200,
      msg: "success",
    });
  } catch (err) {
    console.log("error:", err);
    res.json({
      status: 400,
      msg: "failed",
    });
  }
});

module.exports = uploadRouter;
