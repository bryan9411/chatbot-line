const line = require('@line/bot-sdk')
const { generateText } = require('../openai/Openai')
const configs = require('../config')

// 處理 Line Bot 的 Webhook
const handleLineWebhook = async (events) => {
	const lineConfig = {
		channelAccessToken: configs.line.CHANNEL_ACCESS_TOKEN,
		channelSecret: configs.line.CHANNEL_SECRET,
	}
	const client = new line.Client(lineConfig)

	for (const event of events) {
		if (event.type === 'message' && event.message.type === 'text') {
			try {
				const reply = await generateText(event.message.text)
				await client.replyMessage(event.replyToken, {
					type: 'text',
					text: reply,
				})
			} catch (error) {
				console.error(error)
			}
		}
	}
}

module.exports = handleLineWebhook
