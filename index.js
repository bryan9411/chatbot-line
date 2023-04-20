const express = require('express')
const line = require('@line/bot-sdk')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const { generateText } = require('./src/lib/openai')

// 讀取環境變數
dotenv.config()

const app = express()

// 配置 Express 的 bodyParser 中间件并设置 rawBody 属性
app.use(
	bodyParser.json({
		verify: (req, res, buf) => {
			req.rawBody = buf.toString('utf8')
		},
	})
)
app.use(
	bodyParser.urlencoded({
		extended: true,
		verify: (req, res, buf) => {
			req.rawBody = buf.toString('utf8')
		},
	})
)

// CORS 配置
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
	res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE, OPTIONS')
	next()
})

// 設置 Line Bot 驗證中間件
const lineConfig = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET,
}

// 創建 LineBot 客戶端實例
const bot = new line.Client(lineConfig)

// 定義處理 Line Bot Webhook 的函數
const handleLineWebhook = async (req, res) => {
	const body = req.body
	const events = body.events

	// 遍歷所有 Line Bot 的消息事件
	for (const event of events) {
		console.log('event.message.text', event.message.text)
		if (event.type === 'message' && event.message.type === 'text') {
			try {
				// 為用戶生成智能回答
				const replyText = await generateText(event.message.text)
				console.log('replyText', replyText)
				// 使用 LineBot 發送回答
				const message = {
					type: 'text',
					text: replyText,
				}
				await bot.replyMessage(event.replyToken, message)
			} catch (error) {
				await bot.replyMessage(event.replyToken, {
					type: 'text',
					text: '出現了一些問題，無法生成回答。',
				})
				console.log(error.message)
			}
		}
	}

	res.status(200).end()
}

// 設置 Webhook 路由
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
	try {
		// 驗證 Line Bot SDK 的訊息簽名
		if (!line.validateSignature(req.rawBody, lineConfig.channelSecret, req.headers['x-line-signature'])) {
			throw new Error('簽名驗證錯誤')
		}

		// 處理 Line Bot Webhook 請求
		await handleLineWebhook(req, res)
	} catch (err) {
		console.error(err.message)

		// 如果驗證失敗，返回錯誤消息
		res.status(400).json({
			message: err.message,
		})
	}
})

// 開啟 HTTP 服務器監聽端口
const server = app.listen(process.env.PORT || 3000, () => {
	console.log(`Express app listening on port ${server.address().port}...`)
})
