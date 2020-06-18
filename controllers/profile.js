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

profileRouter.get("/profiles", verify, async (req, res) => {
  try {
    console.log("profiles");
    const userId = req.user.id;
    const profileArray = [];
    let profileObj = {};
    // console.log("hello");
    console.log(userId);
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

profileRouter.get("/getProfileMatches", verify, async (req, res) => {
  console.log("matches");
  const userId = req.user.id;
  // Object with profile with matches
  const profileObject = {};
  let collectionArray = [];
  try {
    const resp = await axios.get(
      `https://cnl6xcx67l.execute-api.eu-west-2.amazonaws.com/live/getprofilematches?collectionId=${userId}`
    );

    const data = resp.data;
    console.log(data);

    // Get all uploads from user
    // Store uploads imageUrls in array
    uploadsArr = [];
    const uploadsRes = await Upload.find({ userId: userId });

    uploadsRes.forEach((upload) => {
      uploadsArr.push(upload.imageUrl);
    });

    // console.log("data: " + data["profiles"].length);
    for (i = 0; i < data["profiles"].length; i++) {
      let matchArr = [];

      let profile = await Profile.findOne({
        imageName: data["profiles"][i]["source"],
      });

      // console.log("source: " + data["profiles"][i]["source"]);
      let profileMatches = data["profiles"][i]["matches"];
      for (x = 0; x < profileMatches.length; x++) {
        // console.log("match: " + profileMatches[x]);
        let matchR = uploadsArr.find((res) => res.includes(profileMatches[x]));
        matchArr.push(matchR);
        // console.log("Match: " + matchR);
      }

      let profileObj = {
        profileName: profile.profileName,
        matchLength: matchArr.length,
        matches: matchArr,
      };
      collectionArray.push(profileObj);

      // console.log(data["profiles"][i]["matches"]);
    }
    // console.log(collectionArray);

    res.json(collectionArray);
  } catch (err) {
    console.log(err);
  }
  // res.json({
  //   msg: "profile test",
  // });
});

// Delete Router
profileRouter.post("/delete", verify, async (req, res) => {
  const profileId = req.body.id;
  const userId = req.user.id;

  console.log("user: " + userId);
  console.log("profile: " + profileId);
  try {
    const profile = await Profile.findOne({ _id: profileId });
    console.log(profile);

    const imageName = profile.imageName;

    // AWS S3 Bucket config
    const params = {
      Bucket: "face-watch-profiles",
      Key: `${userId}/${imageName}`,
    };

    await s3.deleteObject(params).promise();
    await profile.remove();

    res.json({
      status: 200,
      msg: "ok",
    });
    console.log(res);
    console.log("done");

    // Delete object from DB

    // console.log(imageName);
  } catch (err) {
    console.log(err);
    res.json({
      status: 500,
      msg: "Something went wrong!",
    });
  }
});

module.exports = profileRouter;
