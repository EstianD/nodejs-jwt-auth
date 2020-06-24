const profileRouter = require("express").Router();
const axios = require("axios");
const Profile = require("../models/Profile");
const Upload = require("../models/Upload");
const AWS = require("aws-sdk");
const config = require("../utils/config");

// Middleware
const verify = require("../middleware/verifyToken");

// Create AWS S3 instance
const s3 = new AWS.S3({
  accessKeyId: config.AWS_ID,
  secretAccessKey: config.AWS_SECRET,
});

// Get profiles route
// @route POST api/profiles
// @desc retrieve profiles for user
// @access Public
profileRouter.get("/profiles", verify, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileArray = [];
    let profileObj = {};

    const profiles = await Profile.find({ userId: userId });

    profiles.map((profile) => {
      profileObj = {
        id: profile.id,
        profileName: profile.profileName,
        image: profile.imageUrl,
      };

      profileArray.push(profileObj);
    });

    res.json({
      profiles: profileArray,
    });
  } catch (err) {
    console.log(err);
  }
});

// Get Facial matches for profiles
// @route GET api/profiles
// @desc Get matches for profiles
// @access Public
profileRouter.get("/getProfileMatches", verify, async (req, res) => {
  const userId = req.user.id;
  // Object with profile with matches
  const profileObject = {};
  let collectionArray = [];
  try {
    const resp = await axios.get(
      `https://cnl6xcx67l.execute-api.eu-west-2.amazonaws.com/live/getprofilematches?collectionId=${userId}`
    );

    const data = resp.data;

    // Get all uploads from user
    // Store uploads imageUrls in array
    uploadsArr = [];
    const uploadsRes = await Upload.find({ userId: userId });

    uploadsRes.forEach((upload) => {
      uploadsArr.push(upload.imageUrl);
    });

    // Loop through profiles
    for (i = 0; i < data["profiles"].length; i++) {
      let matchArr = [];

      let profile = await Profile.findOne({
        imageName: data["profiles"][i]["source"],
      });

      let profileMatches = data["profiles"][i]["matches"];
      for (x = 0; x < profileMatches.length; x++) {
        // Match profile name with corresponding image
        let matchR = uploadsArr.find((res) => res.includes(profileMatches[x]));
        matchArr.push(matchR);
      }

      let profileObj = {
        profileName: profile.profileName,
        matchLength: matchArr.length,
        matches: matchArr,
      };
      collectionArray.push(profileObj);
    }

    res.json(collectionArray);
  } catch (err) {
    console.log(err);
  }
});

// Delete profile route
// @route POST api/profiles
// @desc Delete a specific profile
// @access Public
profileRouter.post("/delete", verify, async (req, res) => {
  const profileId = req.body.id;
  const userId = req.user.id;

  try {
    const profile = await Profile.findOne({ _id: profileId });

    const imageName = profile.imageName;

    // AWS S3 Bucket config
    const params = {
      Bucket: "face-watch-profiles",
      Key: `${userId}/${imageName}`,
    };

    // Remove profile from S3 bucket
    await s3.deleteObject(params).promise();
    await profile.remove();

    res.json({
      status: 200,
      msg: "ok",
    });
  } catch (err) {
    res.json({
      status: 500,
      msg: "Something went wrong!",
    });
  }
});

module.exports = profileRouter;
