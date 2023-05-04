const AWS = require('aws-sdk')
const { parse } = require('csv-parse')

AWS.config.update({
  // TODO: use env vars
  accessKeyId: 'AKIAVPIDOE62HGCNL5N2',
  secretAccessKey: '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'
})

const s3 = new AWS.S3()

// TODO: use env var
const S3_BUCKET = 'obada-csv-repo-storage141255-staging'

const dynamoDB = new AWS.DynamoDB()

exports.handler = async (event) => {
  try {
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

    for (const s3Object of s3Objects) {
      const tableName = `obada_csv_repo.${s3Object.key.replace(/[^a-zA-Z0-9_.-]/g, '_')}`

      const tables = await dynamoDB.listTables().promise()
      const tableExists = tables.TableNames.includes(tableName)

      if (tableExists) {
        await dynamoDB
          .deleteTable({
            TableName: tableName
          })
          .promise()
        await dynamoDB.waitFor('tableNotExists', { TableName: tableName }).promise()
      }

      const tableParams = {
        TableName: tableName,
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }

      await dynamoDB.createTable(tableParams).promise()
      await dynamoDB.waitFor('tableExists', { TableName: tableName }).promise()

      const csvRecords = await new Promise((resolve) => {
        parse(s3Object.content, { columns: true }, (err, records) => {
          if (records) {
            resolve(records)
          }
        })
      })

      for (const [index, record] of csvRecords.entries()) {
        await dynamoDB
          .putItem({
            TableName: tableName,
            Item: AWS.DynamoDB.Converter.marshall({
              id: index.toString(),
              ...record
            })
          })
          .promise()
      }
    }
  } catch (error) {
    // NOTE: this is here because the queue contains old messages with old filenames that don't exist anymore for some reason
    // resulting an error when referencing the file, and aws keeps triggering the lambda that throws an error
    console.error({
      error: error
    })
  }

  return null
}
