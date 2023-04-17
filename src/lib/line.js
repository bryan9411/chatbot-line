const line = require('@line/bot-sdk')
const crypto = require('crypto')
const config = require('../config')
const { generateText } = require('./openai')

// 初始化 line bot
const client = new line.Client({
	channelAccessToken: config.line.CHANNEL_ACCESS_TOKEN,
	channelSecret: config.line.CHANNEL_SECRET,
})

// 驗證 LINE Bot Webhook 簽名的密鑰
// 這個函式將用於驗證經過 LINE Server 簽名的請求是否有效，驗證成功會返回 true，否則返回 false。
function validateSignature(channelSecret, body, signature) {
	const hmac = crypto.createHmac('sha256', channelSecret)
	hmac.update(JSON.stringify(body))
	const calculatedSignature = hmac.digest('base64')
	return calculatedSignature === signature
}

// 處理 LINE Bot Webhook 請求的函式
// 這個函式將處理 LINE Server 發送的請求，讀取並解析請求體，並根據請求中包含的事件對其進行處理。
async function handleLineWebhook(req, res) {
	// 從請求頭中取得簽名，以驗證是否為 LINE Bot 發送的請求
	const signature = req.headers['x-line-signature']

	try {
		// 解析 JSON 格式請求體
		const body = req.body

		// 驗證 HTTP 請求簽名是否有效，如果簽名驗證失敗，回傳 "401 Unauthorized" 状態碼。
		const isValid = validateSignature(config.line.channelSecret, body, signature)
		if (!isValid) {
			return res.status(401).send('Unauthorized')
		}

		// 取得用戶事件
		const events = body.events

		// 確認是否有有效事件，如果沒有，回傳 "400 Bad Request" 狀態碼。
		if (events.length === 0) {
			console.log('No event found.')
			return res.status(400).send('No event found')
		}

		// 進行事件處理
		for (let event of events) {
			// 確認 event 不為 undefined 或 null，如果為 undefined 或 null，直接跳過，處理下一個 event。
			if (!event) {
				continue
			}
			await handleEvent(event)
		}

		// 回傳 "200 OK" 狀態碼表示已處理完成請求
		res.sendStatus(200)
	} catch (err) {
		console.error(err)
		// 回傳 "500 Internal Server Error" 狀態碼表示處理發生錯誤
		res.status(500).send('Server error')
	}
}

// 處理 LINE Bot 事件
// 這個函式將以事件類型分配至不同的處理函式中進行處理。
async function handleEvent(event) {
	// 確認事件為訊息事件
	if (event.type === 'message' && event.message.type === 'text') {
		await handleMessageEvent(event)
	} else if (event.type === 'postback') {
		await handlePostbackEvent(event)
	}
}

// 處理用戶傳送的訊息事件
// 這個函式將根據從用戶收到的訊息，利用 OpenAI 的模型生成一段文字描述，並回傳該描述給用戶。
async function handleMessageEvent(event) {
	const message = event.message
	const replyToken = event.replyToken

	// 輸入用戶訊息，獲得 OpenAI 返回的模型生成文字描述
	const prompt = message.text
	const generatedText = await generateText(prompt)

	// 準備回傳給用戶的訊息
	const response = {
		type: 'text',
		text: generatedText,
	}

	// 回傳用戶訊息
	await client.replyMessage(replyToken, response)
}

// 處理用戶回應的 postback 事件 // 在此處理用戶從 LINE Bot 收到的 postback 事件 async function handlePostbackEvent(event) { // 在此處理 postback 事件邏輯 }

module.exports = { handleLineWebhook, handleMessageEvent }
