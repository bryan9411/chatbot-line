const express = require('express')
const line = require('@line/bot-sdk') // 引入 Line Bot SDK
const { handleLineWebhook } = require('./src/lib/line')
const dotenv = require('dotenv')

// 讀取環境變數
dotenv.config()

const app = express()

// 配置 Express 应用程序
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/', function (req, res) {
	// 您可以在此添加欢迎信息或其他 Web 服务路由
	res.send('Welcome to My LINE Chatbot!')
})

// 处理 LINE Bot Webhook 请求
app.post(
	'/webhook',
	line.middleware({
		channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
		channelSecret: process.env.CHANNEL_SECRET,
	}),
	async (req, res) => {
		try {
			await handleLineWebhook(req, res)
		} catch (err) {
			console.log('err', err)
			res.status(500).send(err)
		}
	}
)

// 启动 HTTP 服务器
const server = app.listen(process.env.PORT || 3000, () => {
	const { address, port } = server.address()
	console.log(`HTTP 服务器已启动 http://${address}:${port}`)
})
