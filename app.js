const path = require('path')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const express = require('express')
// const cookieSession = require('cookie-session')

const config = require('./utils/config')
// const auth = require('./utils/auth')

// ROUTERS
// const Router = require('./controllers/index')
const authRouter = require('./controllers/auth')

const app = express()

// MIDDLEWARE

app.use(express.static(__dirname + '/public'));

// BODY PARSER
app.use(express.urlencoded({ extended: false }))


// CONNECT
mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true,
useUnifiedTopology: true })
   .then(() => {
      console.log('connected to MongoDB')
   })
   .catch((error) => {
      console.log('error connecting to MongoDB', error.message)
   })


app.use(cors())
app.use(bodyParser.json())

// DEFINE ROUTES
app.use('/api/users', authRouter)


module.exports = app
