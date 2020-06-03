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
  const uploadFile = (key, fileData) => {
    // Upload file to Bucket/key(folder)/filename
    // Configure upload config
    const params = {
      Bucket: "face-watch",
      Key: key,
      Body: fileData,
    };

    // Upload file
    s3.upload(params, (err, data) => {
      if (err) {
        throw err;
      }
      console.log(`File uploaded successfully, ${data.Location}`);
    });
  };

  // Save imageUrl to DB
  const saveUploadToDb = async (imgString) => {
    // Check if file allready exists in db
    const fileExists = await Upload.findOne({ imageUrl: imgString });

    if (!fileExists) {
      // Image url ex: "https://face-watch.s3.amazonaws.com/5ebc250b315756357b7269a0/Keanu_Reeves_1.jpg"
      const upload = new Upload({
        userId: req.user.id,
        imageUrl: imgString,
      });

      if (await upload.save()) {
        return true;
      }
    }
  };

  // Check how many files are passed to server
  if (files.image.length) {
    files.image.forEach(async (file) => {
      let filename = `${file.name}`;
      let key = `${req.user.id}/${filename}`;
      const imageString = `https://face-watch.s3.amazonaws.com/${key}`;

      const dbUpload = await saveUploadToDb(imageString);

      // Save to DB
      if (dbUpload) {
        console.log("saved successfully to DB!");
        // Upload file to S3
        await uploadFile(key, file.data);
      }
    });

    res.json({
      status: 200,
      msg: "All files uploaded successfully",
    });
  } else {
    // Set image name and image data
    let filename = files.image.name;
    let filedata = files.image.data;

    let key = `${req.user.id}/${filename}`;
    const imageString = `https://face-watch.s3.amazonaws.com/${key}`;

    if (await saveUploadToDb(imageString)) {
      console.log("Saved Successfully to DB");
      await uploadFile(filename, filedata);

      res.json({
        status: 200,
        msg: "Uploaded successfully",
      });
    }
  }
});

module.exports = uploadRouter;
