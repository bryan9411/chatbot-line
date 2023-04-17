const express = require('express')
const line = require('@line/bot-sdk') // 引入 Line Bot SDK
const { handleLineWebhook } = require('./src/lib/line')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const dotenv = require('dotenv')

// 讀取環境變數
dotenv.config()

const app = express()

// 配置 Express 的 bodyParser 中间件并设置 rawBody 属性
app.use(
	bodyParser.json({
		verify: (req, res, buf) => {
			req.rawBody = buf
		},
	})
)
app.use(
	bodyParser.urlencoded({
		extended: true,
		verify: (req, res, buf) => {
			req.rawBody = buf
		},
	})
)

// 設置 Line Bot 驗證中间件
const lineConfig = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET,
}

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
	try {
		// 驗證 Line Bot SDK 的訊息簽名
		const signature = crypto.createHmac('SHA256', lineConfig.channelSecret).update(req.rawBody).digest('base64')
		const isValid = signature === req.headers['x-line-signature']
		if (!isValid) {
			throw new Error('簽名驗證錯誤')
		}

		// 處理 Line Bot Webhook 請求
		await handleLineWebhook(req, res)
	} catch (err) {
		console.error(err)

		// 如果驗證失敗，返回錯誤消息
		res.status(400).json({
			message: err.message,
		})
	}
})

// 启动 HTTP 服务器
const server = app.listen(process.env.PORT || 3000, () => {
	const { address, port } = server.address()
	console.log(`HTTP 服务器已启动 http://${address}:${port}`)
})
