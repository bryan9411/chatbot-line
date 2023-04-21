const line = require('@line/bot-sdk')
const { generateText } = require('../lib/openai')
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
				const reply = await handleCommand(event.message.text)
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

// 處理不同指令
const handleCommand = async (text) => {
	const firstSpaceIndex = text.indexOf(' ')
	const command = firstSpaceIndex < 0 ? text.trim() : text.slice(0, firstSpaceIndex).trim()
	const args = firstSpaceIndex < 0 ? '' : text.slice(firstSpaceIndex + 1).trim()

	const commandHandler = commands[command]

	// 非指令消息，交由 OpenAI 进行处理
	if (!commandHandler) {
		const reply = await generateText(text)
		return reply
	}

	// 调用相应命令的处理函数
	return await commandHandler(args)
}

// 查看指令
const handleCommandHelp = async () => {
	return '这里是查看指令的帮助信息'
}

// 翻译助理
const handleCommandTranslate = async (args) => {
	// 实现翻译指令的处理逻辑
}

// 幫畫
const handleCommandPaint = async (args) => {
	// 实现帮画指令的处理逻辑
}

// 天氣
const handleCommandWeather = async (args) => {
	// 实现天气指令的处理逻辑
}

// 记账助理
const handleCommandAccounting = async (args) => {
	// 实现记账指令的处理逻辑
}

// 退出
const handleCommandQuit = async () => {
	return '已退出指令模式，可以继续聊天了'
}

// 定義處理不同指令的函数
const commands = {
	[configs.command.CHECK_COMMAND]: handleCommandHelp,
	[configs.command.TRANSLATE_ASSISTANT]: handleCommandTranslate,
	[configs.command.DRAW]: handleCommandPaint,
	[configs.command.WEATHER_INQUIRE]: handleCommandWeather,
	[configs.command.ACCOUNT_ASSISTANT]: handleCommandAccounting,
	[configs.command.EXIT]: handleCommandQuit,
}

module.exports = handleLineWebhook
