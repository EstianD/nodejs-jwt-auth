require("dotenv").config();

let PORT = process.env.PORT;
let MONGODB_URI = process.env.MONGODB_URI;
let JWT_SECRET = process.env.JWT_SECRET;
let AWS_ID = process.env.AWS_ID;
let AWS_SECRET = process.env.AWS_SECRET;

if (process.env.NODE_ENV === "test") {
  MONGODB_URI = process.env.TEST_MONGODB_URI;
}

module.exports = {
  MONGODB_URI,
  PORT,
  JWT_SECRET,
  AWS_ID,
  AWS_SECRET,
};
