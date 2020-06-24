const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const fileUpload = require("express-fileupload");

const config = require("./utils/config");

// ROUTERS
const authRouter = require("./controllers/auth");
const uploadRouter = require("./controllers/file-upload");
const profileRouter = require("./controllers/profile");

const app = express();

// MIDDLEWARE
app.use(express.static(__dirname + "/public"));

// BODY PARSER
app.use(express.urlencoded({ extended: false }));

// CONNECT
mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB", error.message);
  });

app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

// DEFINE ROUTES
app.use("/api/users", authRouter);
app.use("/api/file-upload", uploadRouter);
app.use("/api/profiles", profileRouter);

module.exports = app;
