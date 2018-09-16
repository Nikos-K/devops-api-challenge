console.log('Staring the execution of the helloWorld Lambda Function.')

const AWS = require('aws-sdk')
const ddb = new AWS.DynamoDB.DocumentClient()

exports.handler = function (event, context, callback) {
  switch (event.httpmethod) {
    case 'PUT':
      console.log('Executing a PUT HTTP Method')
      var insertParams = {
        Item: {
          'name': event.name,
          'dateOfBirth': event.dateOfBirth
        },
        TableName: process.env.DYNAMODB_TABLE
      }
      ddb.put(insertParams, function (err, data) {
        callback(err, data)
      })
      break
    case 'GET':
      console.log('Executing a GET HTTP Method')
      var dynamo = new AWS.DynamoDB({
        region: 'eu-west-1',
        maxRetries: 0
      })
      var nameToGet = event.name
      var params = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          'name': {
            'S': nameToGet
          }
        },
        AttributesToGet: [
          'name', 'dateOfBirth'
        ],
        ConsistentRead: true
      }
      console.log('Will run the getItem dynamo call on key: ' + nameToGet)
      dynamo.getItem(params, function (err, data) {
        console.log('Pre-processing - data view:  ', data)
        if (err) {
          console.log(err, err.stack) // an error occurred
          context.done(err)
        } else {
          var date = new Date()
          var getFullYear = date.getFullYear()
          var originalDateOfBirth = data.Item.dateOfBirth.S
          var strippeddate = originalDateOfBirth.toString().split('-')
          var originalDateOfBirthFormated = strippeddate[1].replace(/(^|-)0+/g, '$1') + '-' + strippeddate[2].replace(/(^|-)0+/g, '$1')
          var currentDate = date.getMonth() + 1 + '-' + date.getUTCDate()
          console.log('Comparing Users Birthday: ' + originalDateOfBirthFormated + ' & Current: ' + currentDate)
          var oneDay = 24 * 60 * 60 * 1000 // h*m*s*ms
          var originalDateOfBirthFormatedN = new Date(getFullYear + '-' + originalDateOfBirthFormated)
          var currentDateN = new Date(getFullYear + '-' + currentDate)

          console.log('Comparing FULL DATE Original Birthday: ' + originalDateOfBirthFormatedN + ' & Current Date: ' + currentDateN)
          var daysUntilBday = Math.round(Math.abs(currentDateN.getTime() - originalDateOfBirthFormatedN.getTime()) / (oneDay))
          console.log('How many Days until the users birthday? ' + daysUntilBday)

          if (daysUntilBday === 0) {
            data = 'Hello, ' + nameToGet + '! Happy Birthday!'
          } else if (daysUntilBday === 5) {
            data = 'Hello, ' + nameToGet + '! Your Birthday is in ' + daysUntilBday + ' days'
          }

          console.log(data) // Successful response
          context.succeed(data) // Terminate the function and return
        }
      })
  }
}
