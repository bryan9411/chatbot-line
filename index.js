// 引入需要的模塊
const express = require('express')
const line = require('@line/bot-sdk')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const { handleLineWebhook } = require('./src/line/webhook')
const { BotMessageManager } = require('./src/utils/lineMessageManager')

// 讀取環境變數
dotenv.config()

// 建立 Express app 實例
const app = express()

// 設定 bodyParser
app.use(
	bodyParser.json({
		verify: (req, res, buf) => {
			req.rawBody = buf.toString()
		},
	})
)
app.use(bodyParser.urlencoded({ extended: true }))

// 設定 CORS 頭
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
	next()
})

// Line Bot 設定
const lineConfig = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET,
}

// 設置 Line Bot Webhook 路由，進行驗證、設置 Webhooks 設定等操作
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
	// 創建 Line Bot 客戶端實例
	const bot = new line.Client(lineConfig)

	try {
		// 驗證 Line Bot 的簽名
		if (!line.validateSignature(req.rawBody, lineConfig.channelSecret, req.headers['x-line-signature'])) {
			throw new Error('簽名驗證錯誤')
		}

		// 解析事件數據
		const { events } = req.body

		// 檢查事件數組是否為空
		if (!events || events.length == 0) {
			console.log('沒有事件資料')
			return res.status(200).send('OK')
		}

		// 構造訊息管理器 BotMessageManager
		const botMessageManager = new BotMessageManager(bot, events[0].replyToken)

		// 檢查 replyToken 是否為 undefined
		if (!botMessageManager.replyToken) {
			console.log('replyToken is undefined')
			return res.status(200).send('OK')
		}

		// 處理事件
		await handleLineWebhook(events)

		// 回覆成功
		res.status(200).send('OK')
	} catch (error) {
		console.error(error)
		res.status(500).send(error.message)
	}
})

// 設置 Web 服務器監聽端口
const port = process.env.PORT || 3000

// 開啟 HTTP 服務器監聽端口
app.listen(port, () => {
	console.log(`Line Bot app listening on port ${port}!`)
})
