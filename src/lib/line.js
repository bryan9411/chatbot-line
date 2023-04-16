const { Client } = require('@line/bot-sdk')
const config = require('../config')
const { generateText } = require('./openai')

// 初始化 Line Bot 用戶端
const client = new Client(config.line)

// 設置 Webhook 路徑，由 Line Server 主動推送訊息到該路徑
const handleLineWebhook = async (req, res) => {
	// 確定請求來自 Line 平台
	const channelSecret = config.line.LINE_CHANNEL_SECRET
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

	// 將用戶的輸入傳遞給 OpenAI，獲取生成的文字描述
	const prompt = message.text
	const generatedText = await generateText(prompt)

	// 將生成的文字描述回傳給用戶
	const response = {
		type: 'text',
		text: generatedText.replace(/\n/g, '\\n'), // 處理換行問題，將換行符號轉換為字面的`\n`
	}
	await client.replyMessage(replyToken, response)
}

// 處理用戶回復的 Postback 事件
const handlePostbackEvent = async (event) => {
	const postback = event.postback
	const replyToken = event.replyToken
	const userId = event.source.userId

	// 在這裡處理輸入指令邏輯
	// ...

	// 回覆訊息
	const response = [
		{ type: 'text', text: '回覆訊息 1' },
		{ type: 'text', text: '回覆訊息 2' },
	]
	await client.replyMessage(replyToken, response)
}

module.exports = { handleLineWebhook }
