const AWS = require('aws-sdk')
const express = require('express')
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const multer = require('multer')
const Cryptr = require('cryptr')
const csvtojson = require('csvtojson')

AWS.config.update({
  // TODO: use env vars
  accessKeyId: 'AKIAVPIDOE62HGCNL5N2',
  secretAccessKey: '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'
})

const s3 = new AWS.S3()

const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  next()
})

const upload = multer({
  storage: multer.memoryStorage()
})

// TODO: use env var
const S3_BUCKET = 'obada-csv-repo-storage141255-staging'

// TODO: use env var
const cryptr = new Cryptr('myTotallySecretKey')

app.get('/csv/:fileName', function (req, res) {
  /**
   * 1. get csv file from s3.
   * 2. decrypt file.
   * 3. convert file to json if specified in req.query.format.
   * 4. download file.
   */

  const params = {
    Bucket: S3_BUCKET,
    Key: req.params.fileName
  }

  s3.getObject(params, (err, data) => {
    if (err) {
      return res.status(400).end()
    }

    const decryptedFile = cryptr.decrypt(data.Body.toString())

    if (req.query.format === 'json') {
      // TODO: debug why this is not working
      return csvtojson()
        .fromString(decryptedFile)
        .then((json) => {
          // res.send(json)
        })
    }

    res.attachment(req.params.fileName)
    res.send(decryptedFile)
  })
})

app.get('/csv', function (req, res) {
  const params = {
    Bucket: S3_BUCKET
  }

  s3.listObjects(params, (err, data) => {
    if (err) {
      return res.status(400).end()
    }

    res.json(data.Contents.map((file) => file.Key))
  })
})

app.post('/csv', upload.single('csv'), (req, res) => {
  /**
   * 1. store csv file as a table in DynamoDB.
   * 2. encrypt file.
   * 3. store encrypted file as s3 object.
   */

  const encryptedFile = cryptr.encrypt(req.file.buffer.toString())

  const params = {
    Bucket: S3_BUCKET,
    Key: req.file.originalname,
    Body: encryptedFile
  }

  s3.upload(params, (err) => {
    if (err) {
      return res.status(400).end()
    }

    res.end()
  })
})

app.delete('/csv/:fileName', function (req, res) {
  /**
   * 1. delete csv file from s3.
   * 2. delete table from DynamoDB.
   */

  const params = {
    Bucket: S3_BUCKET,
    Key: req.params.fileName
  }

  s3.deleteObject(params, (err, data) => {
    if (err) {
      return res.status(400).end()
    }

    res.end()
  })
})

// TODO: make it selective delete
app.delete('/csv', function (req, res) {
  /**
   * 1. delete all csv files from s3.
   * 2. delete all tables from DynamoDB.
   */

  const params = {
    Bucket: S3_BUCKET
  }

  s3.listObjects(params, (err, data) => {
    if (err) {
      return res.status(400).end()
    }

    const deleteParams = {
      Bucket: S3_BUCKET,
      Delete: {
        Objects: data.Contents.map((file) => ({ Key: file.Key }))
      }
    }

    s3.deleteObjects(deleteParams, (err) => {
      if (err) {
        return res.status(400).end()
      }

      res.end()
    })
  })
})

app.listen(3000, function () {
  console.log('App started')
})

module.exports = app
