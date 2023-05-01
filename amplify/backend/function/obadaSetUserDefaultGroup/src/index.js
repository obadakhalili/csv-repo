const AWS = require('aws-sdk')

async function handler(event, _context, callback) {
  const { userPoolId, userName } = event
  try {
    await addUserToGroup({
      userPoolId,
      username: userName,
      groupName: 'full-access'
    })
    return callback(null, event)
  } catch (error) {
    return callback(error, event)
  }
}

function addUserToGroup({ userPoolId, username, groupName }) {
  const params = {
    GroupName: groupName,
    UserPoolId: userPoolId,
    Username: username
  }
  const cognitoIdp = new AWS.CognitoIdentityServiceProvider()
  return cognitoIdp.adminAddUserToGroup(params).promise()
}

exports.handler = handler
