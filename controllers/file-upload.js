const fs = require("fs");
const AWS = require("aws-sdk");
// Config
const config = require("../utils/config");
const uploadRouter = require("express").Router();
const path = require("path");

// Model
const Upload = require("../models/Upload");
const Profile = require("../models/Profile");

// Middleware
const verify = require("../middleware/verifyToken");

// Create AWS S3 instance
const s3 = new AWS.S3({
  accessKeyId: config.AWS_ID,
  secretAccessKey: config.AWS_SECRET,
});

// FUNCTIONS
// UPLOAD FILES FUNCTION
async function uploadFile(key, fileData, bucket) {
  // Upload file to Bucket/key(folder)/filename
  // Configure upload config
  const params = {
    Bucket: bucket,
    Key: key,
    Body: fileData,
  };
  console.log("uploading...");
  // Upload file
  let res = await s3.upload(params).promise();
  console.log("uploading done");
}

uploadRouter.post("/profile", verify, async (req, res) => {
  console.log("profile section");
  // console.log(req.files);
  // console.log(req.body);
  const profilename = req.body.name;
  const file = req.files.image;

  console.log(profilename);
  console.log(file);

  const id = req.user.id;
  const bucket = "face-watch-profiles";

  if (file === null) {
    return res.status(400).json({
      msg: "No file uploaded!",
    });
  }

  // Save imageUrl to DB
  const saveProfileUploadToDb = async (imgString, profileName, imgName) => {
    // Check if file allready exists in db
    const profileExists = await Profile.findOne({
      profileName: profileName,
    })
      .where("userId")
      .equals(req.user.id);

    console.log("profileExists", profileExists);

    console.log("saving...");
    if (!profileExists) {
      // Image url ex: "https://face-watch.s3.amazonaws.com/5ebc250b315756357b7269a0/Keanu_Reeves_1.jpg"
      const profile = new Profile({
        userId: req.user.id,
        profileName: profileName,
        imageUrl: imgString,
        imageName: imgName,
      });
      console.log(profile);

      await profile.save();
      return profile;
    } else {
      return res.json({
        status: 401,
        msg: "The profile already exists!",
      });
    }
  };

  console.log("Starting...");

  try {
    let filename = file.name;
    let filedata = file.data;

    let fileExt = filename.split(".").pop();
    let newFileName = `${req.user.id.substring(
      0,
      4
    )}-${new Date().getTime()}.${fileExt}`;

    let key = `${req.user.id}/${newFileName}`;
    const imageString = `https://face-watch-profiles.s3.amazonaws.com/${key}`;

    const profile = await saveProfileUploadToDb(
      imageString,
      profilename,
      newFileName
    );
    await uploadFile(key, file.data, bucket);

    return res.json({
      status: 200,
      msg: "success",
      profile: profile,
    });
  } catch (err) {
    res.json({
      status: 400,
      msg: err,
    });
  }
});

uploadRouter.post("/gallery", verify, async (req, res) => {
  const files = req.files;
  const id = req.user.id;
  const bucket = "face-watch";

  console.log("starting");

  // Check if files contains data
  if (files === null) {
    return res.status(400).json({
      msg: "No file uploaded!",
    });
  }

  // Create AWS S3 instance
  // const s3 = new AWS.S3({
  //   accessKeyId: config.AWS_ID,
  //   secretAccessKey: config.AWS_SECRET,
  // });

  // Save imageUrl to DB
  const saveGalleryUploadToDb = async (imgString) => {
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

        await saveGalleryUploadToDb(imageString);
        await uploadFile(key, files.image[i].data, bucket);
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

      await saveGalleryUploadToDb(imageString);
      await uploadFile(key, filedata, bucket);
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