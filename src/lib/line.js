const { Client } = require('@line/bot-sdk')
const config = require('../config/configEnv')

// 初始化 Line Bot 用戶端
const client = new Client(config.line)

// 設置 Webhook 路徑，由 Line Server 主動推送訊息到該路徑
async function handleLineWebhook(req, res) {
	// 確定請求來自 Line 平台
	const channelSecret = config.line.channelSecret
	const signature = req.headers['x-line-signature']
	if (!Client.validateSignature(req.rawBody, channelSecret, signature)) {
		return res.status(400).send('Invalid signature')
	}

	// 處理訊息、事件
	const body = req.body
	const events = body.events
	for (const event of events) {
		if (event.type === 'message') {
			await handleMessageEvent(event)
		} else if (event.type === 'postback') {
			await handlePostbackEvent(event)
		}
	}

	// 回傳 HTTP 200 OK 表示已收到訊息
	res.sendStatus(200)
}

// 處理用戶發送的聊天訊息
async function handleMessageEvent(event) {
	const message = event.message
	const replyToken = event.replyToken
	const userId = event.source.userId

	// 在這裡實現聊天機器人的回答邏輯
	// ...

	// 回覆訊息
	const response = [
		{ type: 'text', text: '回覆訊息 1' },
		{ type: 'text', text: '回覆訊息 2' },
	]
	await client.replyMessage(replyToken, response)
}

// 處理用戶回復的 Postback 事件
async function handlePostbackEvent(event) {
	const postback = event.postback
	const replyToken = event.replyToken
	const userId = event.source.userId

	// 在這裡實現聊天機器人的回答邏輯
	// ...

	// 回覆訊息
	const response = [
		{ type: 'text', text: '回覆訊息 1' },
		{ type: 'text', text: '回覆訊息 2' },
	]
	await client.replyMessage(replyToken, response)
}

module.exports = { handleLineWebhook }
