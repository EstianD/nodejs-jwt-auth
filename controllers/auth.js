const usersRouter = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const spawn = require("child_process").spawn;
const axios = require("axios");

// Config
const config = require("../utils/config");
// Middleware
const verify = require("../middleware/verifyToken");

// Models
const User = require("../models/User");
// Validation
const { registerValidation, loginValidation } = require("./validation");

// Register route
// @route POST api/users
// @desc Post registration
// @access Public
usersRouter.post("/register", async (req, res) => {
  const data = {
    username: req.body.signupUsername,
    email: req.body.signupEmail,
    password: req.body.signupPassword,
  };

  // Destructure joi validation object
  const { error } = registerValidation(data);

  if (error) return res.json(error.details[0].message);
  // Check if email exist in db
  const emailExist = await User.findOne({ email: req.body.signupEmail });

  if (emailExist)
    return res.json({ status: false, error: "Email already exists!" });

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.signupPassword, salt);

  const user = new User({
    username: req.body.signupUsername,
    email: req.body.signupEmail,
    password: hashPassword,
  });

  // Save user to DB
  try {
    const savedUser = await user.save();

    if (savedUser) {
      // Create collection to index photos
      const colResponse = await axios.get(
        `https://tvctoiq355.execute-api.eu-west-2.amazonaws.com/test/test?collectionId=${savedUser.id}`
      );

      console.log(colResponse);
      if (colResponse.status === 200) {
        // Collection created successfully
        res.json({ status: true });
      } else {
        res.json({
          status: false,
          error: "Something went wrong on our side. Try again!",
        });
      }
    }
  } catch (err) {
    res.json({ status: false, error: err });
  }
});

// Login route
// @route POST api/users
// @desc Post login
// @access Public
usersRouter.post("/login", async (req, res) => {
  const data = {
    email: req.body.signinEmail,
    password: req.body.signinPassword,
  };
  const { error } = loginValidation(data);

  if (error) return res.json(error.details[0].message);

  // Check if email exist in db
  const user = await User.findOne({ email: req.body.signinEmail });

  // Login credentials incorrect
  if (!user)
    return res.json({
      status: false,
      error: "Email or Password is incorrect!",
    });

  // Correct password
  const validPass = await bcrypt.compare(
    req.body.signinPassword,
    user.password
  );

  if (!validPass)
    return res.json({
      status: false,
      error: "Email or Password is incorrect!",
    });

  // Create and assign jwt
  const token = jwt.sign(
    { id: user.id, username: user.username },
    config.JWT_SECRET,
    {
      expiresIn: 3600,
    }
  );

  res.json({
    status: true,
    user: user,
    jwt: token,
  });
});

// Get User route
// @route get api/users
// @desc Get Logged In User
// @access Private
usersRouter.get("/user", verify, (req, res) => {
  User.findById(req.user.id)
    .select("-password")
    .then((user) => res.json(user));
});

module.exports = usersRouter;
