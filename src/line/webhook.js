const line = require('@line/bot-sdk')
const { generateText } = require('../openai/OpenAi')
const langMap = require('./langMap')
const configs = require('../config')
const translateTemplate = require('../templates/translateTemplate')

// 是否為翻譯模式
let isTranslationMode = false
// 記錄當前的語言
let currLang = langMap['繁體中文']

// 回覆訊息
const replyMessage = async (client, replyToken, message) => {
	try {
		await client.replyMessage(replyToken, message)
	} catch (error) {
		console.log('回覆訊息錯誤：', error.message)
	}
}

// 回覆文字訊息
const replyWithText = async (client, replyToken, text) => {
	const message = {
		type: 'text',
		text,
	}
	await replyMessage(client, replyToken, message)
}

// 回覆圖文選單
const replyWithTemplate = async (client, replyToken, template) => {
	await replyMessage(client, replyToken, template)
}

// 翻譯文字
const translateText = async (text, targetLang) => {
	try {
		// ...
		return translatedText
	} catch (error) {
		console.log('翻譯文字錯誤：', error.message)
		return '翻譯失敗，請稍後再試。'
	}
}

// 處理 Message 事件
exports.handleMessageEvent = async (event, client) => {
	try {
		if (event.message.type === 'text') {
			if (isTranslationMode) {
				// 口譯模式
				const translatedText = await translateText(event.message.text, currLang)
				await replyWithText(client, event.replyToken, translatedText)
			} else {
				// 一般模式
				const replyText = await generateText(event.message.text)
				await replyWithText(client, event.replyToken, replyText)
			}
		}
	} catch (error) {
		console.log('處理 Message 事件錯誤：', error.message)
	}
}

// 處理 Postback 事件
exports.handlePostbackEvent = async (event, client) => {
	try {
		const postbackData = event.postback.data
		if (postbackData in langMap) {
			// 根據不同的按鈕設定語言模式
			isTranslationMode = true
			currLang = langMap[postbackData]
			// 回覆語言模式設定完成的訊息
			const replyText = `您選擇了 ${postbackData} 語言，語言模式已切換。現在您可以輸入文字進行翻譯喔。`
			await replyWithText(client, event.replyToken, replyText)
		} else if (postbackData === 'menu') {
			// 回復圖文選單
			await replyWithTemplate(client, event.replyToken, translateTemplate)
		}
	} catch (error) {
		console.log('處理 Postback 事件錯誤：', error.message)
	}
}

// 處理 Line Bot 的 Webhook
exports.handleLineWebhook = async (events) => {
	try {
		const lineConfig = {
			channelAccessToken: configs.line.CHANNEL_ACCESS_TOKEN,
			channelSecret: configs.line.CHANNEL_SECRET,
		}
		const client = new line.Client(lineConfig)

		for (const event of events) {
			switch (event.type) {
				case 'message':
					await exports.handleMessageEvent(event, client)
					break
				case 'postback':
					await exports.handlePostbackEvent(event, client)
					break
				default:
					console.log(`Ignoring event type: ${event.type}`)
			}
		}
	} catch (error) {
		console.log('處理 Line Bot Webhook 錯誤：', error.message)
	}
}
