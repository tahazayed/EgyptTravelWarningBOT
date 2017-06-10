'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const router = express.Router();
const config = require('./config');
const dateFormat = require('dateformat');
const travelwarningsDB = require('./model-mongodb-travelwarnings');

app.set('port', (process.env.PORT || 5000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())
app.set('trust proxy', true);
app.use('/static', express.static('public'))

// index
app.get('/', function (req, res) {
	res.send('hello world i am a secret bot')
})
// index

app.get('/terms/', function (req, res) {
	res.send('The Dept of State has issued a Travel Warning to all US citizens contemplating a trip to Egypt., and This is a bot for alerting.');
})

// for facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge'])
	} else {
		res.send('Error, wrong token')
	}
})

// to post data
app.post('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id
		if (event.message && event.message.text) {
			let text = event.message.text
			if (text === 'Generic'){ 
				console.log("welcome to chatbot")
				//sendGenericMessage(sender)
				continue
			}
			
			travelwarningsDB.list(1, (err, entities, cursor) => {
                 if (err) {next(err);return;}
					 text=entities;
					 sendGenericMessage(sender, text[0])
                     });
					 var currentDate=new Date()
			travelwarningsDB.createUser({user:sender,last_updated: currentDate.now()}, (err, item) => {
                 if (err) {next(err);return;}
					 console.log(item)
                     });
			
		}
		if (event.postback) {
			let text = JSON.stringify(event.postback)
			sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
			continue
		}
	}
	res.sendStatus(200)
})


// recommended to inject access tokens as environmental variables, e.g.
// const token = process.env.FB_PAGE_ACCESS_TOKEN
const token = process.env.FB_PAGE_ACCESS_TOKEN

function sendTextMessage(sender, text) {
	let messageData = { text:text }
	
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

function sendGenericMessage(sender, text) {


	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [{
					"title": text.title,
					"subtitle": dateFormat(new Date(text.date), "dddd, mmmm dS, yyyy"),
					"image_url": "https://egypttravelwarningbot.herokuapp.com/static/img/red-warning-sign2.jpg",
					"buttons": [{
						"type": "web_url",
						"url": text.url,
						"title": "View"
					}]
				}]
			}
		}
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  };
  next(err);
});
// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})