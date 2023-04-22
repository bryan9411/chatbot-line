const line = require('@line/bot-sdk')
const crypto = require('crypto')
const configs = require('../config')
const { generateText } = require('./openai')
const bodyParser = require('body-parser')

const { CHANNEL_ACCESS_TOKEN, CHANNEL_SECRET } = configs.line

const client = new line.Client({
	channelAccessToken: CHANNEL_ACCESS_TOKEN,
	channelSecret: CHANNEL_SECRET,
})

const jsonParser = bodyParser.json({
	verify(req, res, buf, encoding) {
		if (!/application\/json/i.test(req.headers['content-type'])) {
			throw new Error('Invalid content type. Expected application/json')
		}
	},
})

function validateSignature(channelSecret, body, signature) {
	const hmac = crypto.createHmac('sha256', channelSecret)
	hmac.update(body)
	const calculatedSignature = hmac.digest('base64')

	return crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signature))
}

async function handleLineWebhook(req, res) {
	const signature = req.headers['x-line-signature']

	try {
		jsonParser(req, res, () => {})
		const body = req.body
		const rawBody = JSON.stringify(body)
		const isValid = validateSignature(CHANNEL_SECRET, rawBody, signature)

		if (!isValid) {
			return res.status(401).send('Unauthorized')
		}

		const events = body.events

		if (!events.length) {
			console.log('No event found.')
			return res.status(400).send('No event found')
		}

		for (const event of events) {
			if (!event) continue
			switch (event.type) {
				case 'message':
					if (event.message.type === 'text') {
						await handleMessageEvent(event)
					}
					break
				case 'postback':
					await handlePostbackEvent(event)
					break
				default:
					break
			}
		}

		res.sendStatus(200)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}

async function handleMessageEvent(event) {
	const { message, replyToken } = event
	const generatedText = await generateText(message.text)

	const response = { type: 'text', text: generatedText }
	await Promise.all([client.replyMessage(replyToken, response)])
}

async function handlePostbackEvent(event) {
	// handle postback event here
}

module.exports = {
	handleLineWebhook,
}
