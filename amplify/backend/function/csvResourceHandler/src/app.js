const AWS = require('aws-sdk')
const express = require('express')
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const { CognitoJwtVerifier } = require('aws-jwt-verify')
const multer = require('multer')
const csvtojson = require('csvtojson')

AWS.config.update({
  // TODO: use env vars
  accessKeyId: 'AKIAVPIDOE62HGCNL5N2',
  secretAccessKey: '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'
})

const s3 = new AWS.S3()

const sns = new AWS.SNS()

const app = express()

app.use(bodyParser.json())

app.use(awsServerlessExpressMiddleware.eventContext())

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  next()
})

const cognitoJwtVerifier = new CognitoJwtVerifier({
  // TODO: use env vars
  region: 'us-east-2',
  userPoolId: 'us-east-2_aVG8F7xNY'
})

function authorize(allowedGroups) {
  return async (req, res, next) => {
    const [_, token] = req.headers.authorization.split('Bearer ')
    try {
      await cognitoJwtVerifier.verify(token, {
        tokenUse: null,
        clientId: null,
        groups: allowedGroups
      })
      next()
    } catch {
      res.status(401).end()
    }
  }
}

const upload = multer({
  storage: multer.memoryStorage()
})

// TODO: use env var
const S3_BUCKET = 'obada-csv-repo-storage141255-staging'

app.get(
  '/csv/:fileName',
  authorize(['full-access', 'read-write-access', 'read-access']),
  (req, res) => {
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

      const fileContent = data.Body.toString()

      if (req.query.format === 'json') {
        // TODO: maybe get dynamodb table instead of using csvtojson?
        return csvtojson()
          .fromString(fileContent)
          .then((json) => {
            res.attachment(req.params.fileName + '.json')
            res.send(json)
          })
      }

      res.attachment(req.params.fileName)
      res.send(fileContent)
    })
  }
)

app.get('/csv', authorize(['full-access', 'read-write-access', 'read-access']), (req, res) => {
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

app.post(
  '/csv',
  authorize(['full-access', 'read-write-access']),
  upload.single('csv'),
  (req, res) => {
    const fileContent = req.file.buffer.toString()

    const params = {
      Bucket: S3_BUCKET,
      Key: req.file.originalname,
      Body: fileContent
    }

    s3.upload(params, async (err) => {
      if (err) {
        return res.status(400).end()
      }

      const msgParams = {
        Message: params.Key,
        // TODO: use env var
        TopicArn: 'arn:aws:sns:us-east-2:376353728436:upload-csv-file-to-db'
      }
      // TODO: remove callback
      sns.publish(msgParams, (err, data) => {
        if (err) {
          return console.log({ error: err })
        }

        console.log({ data })
      })

      res.end()
    })
  }
)

app.delete('/csv/:fileName', authorize(['full-access']), (req, res) => {
  // TODO: delete from dynamodb table as well

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

app.listen(3000, function () {
  console.log('App started')
})

module.exports = app
