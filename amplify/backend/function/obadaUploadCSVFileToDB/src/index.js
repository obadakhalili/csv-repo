const AWS = require('aws-sdk')

AWS.config.update({
  // TODO: use env vars
  accessKeyId: 'AKIAVPIDOE62HGCNL5N2',
  secretAccessKey: '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'
})

const s3 = new AWS.S3()

// TODO: use env var
const S3_BUCKET = 'obada-csv-repo-storage141255-staging'

exports.handler = async (event) => {
  const s3ObjectKeys = event.Records.map((record) => {
    const s3ObjectKey = JSON.parse(record.body).Message
    return s3ObjectKey
  })

  const s3Objects = await Promise.all(
    s3ObjectKeys.map(async (s3ObjectKey) => {
      const object = await s3
        .getObject({
          Bucket: S3_BUCKET,
          Key: s3ObjectKey
        })
        .promise()

      return {
        key: s3ObjectKey,
        content: object.Body.toString()
      }
    })
  )

  console.log({ s3Objects })

  // upload each file as a table to dynamoDB

  return { statusCode: 200 }
}
