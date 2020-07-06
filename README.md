## Description

This is the backend code for the face-watch app. Refer to the [face-watch-frontend](https://github.com/EstianD/face-watch-react) repo for a better description of the project.

## Scripts

In the project directory:

### `npm run dev`

Runs the app in the development mode.<br />
Open [http://localhost:{PORT}](http://localhost:{PORT}) to view it in the browser.

### `npm run start`

Runs the problem in production mode.

## .env File Config

For this API to work a few things is needed. An AWS ID aswell as an AWS SECRET key is required. The API makes use of AWS S3, AWS LAMBDA, AWS Gateway API and AWS REKOGNITION. When creating a IAM user on AWS, that user needs to have permissions configured to access all of these services.

A .env file needs to be added with the following variables.

MONGODB_URI=
JWT_SECRET=
PORT=
AWS_ID=
AWS_SECRET=
