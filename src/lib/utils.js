const LINE_MAX_REPLY_LENGTH = 2000

/**
 * 使用 Line Bot 回覆訊息 (純文字)，並自動拆分超過限制的字串。
 * @param {Object} bot - Line Bot 實體。
 * @param {String} replyToken - Line Bot 回覆 Token。
 * @param {String|Array.<String>} messages - 要回覆給 Line Bot 用戶的文字或文字陣列。
 * @param {Object} [botMessageManager] - Bot Message 管理器，用於發送和記錄已經發送的訊息。
 */
const replyText = async (bot, replyToken, messages, botMessageManager = null) => {
	if (!Array.isArray(messages)) {
		messages = [messages]
	}

	let chunks = []
	let accumulatedLength = 0

	// 將訊息拆分成若干塊，每塊約2000字以內
	for (let message of messages) {
		if (message.length > LINE_MAX_REPLY_LENGTH) {
			const splitMessages = splitMessage(message)
			chunks.push(...splitMessages)
			accumulatedLength += message.length
		} else if (accumulatedLength + message.length <= LINE_MAX_REPLY_LENGTH) {
			// 在上一個訊息塊中接續當前訊息
			if (chunks.length > 0) {
				const previousMessage = chunks[chunks.length - 1]
				previousMessage.text += `\n${message}`
				accumulatedLength += message.length + 1
			} else {
				chunks.push({
					type: 'text',
					text: message,
				})
				accumulatedLength += message.length
			}
		} else {
			// 發送上一個訊息塊，重新開始為新訊息建立訊息塊
			if (botMessageManager) {
				botMessageManager.add(chunks)
			} else {
				await bot.replyMessage(replyToken, { messages: chunks })
			}

			chunks = [
				{
					type: 'text',
					text: message,
				},
			]
			accumulatedLength = message.length
		}
	}

	// 發送剩餘的訊息塊
	if (botMessageManager) {
		botMessageManager.add(chunks)
	} else if (chunks.length > 0) {
		await bot.replyMessage(replyToken, { messages: chunks })
	}
}

/**
 * 將字串拆成多個訊息 (約2000字以內)。
 * @param {String} message - 要拆分的字串。
 * @return {Array.<Object>} - 拆分後的訊息陣列。
 */
const splitMessage = (message) => {
	const chunks = []
	let startIndex = 0
	let endIndex
	while (startIndex < message.length) {
		endIndex = message.lastIndexOf('\n', startIndex + LINE_MAX_REPLY_LENGTH)
		if (endIndex === -1) {
			// 取得最後一個分句
			const sentences = message
				.split(/[。！？]/g)
				.filter(Boolean)
				.reverse()
			for (const sentence of sentences) {
				if (startIndex + sentence.length > LINE_MAX_REPLY_LENGTH) {
					continue
				}
				endIndex = endIndex - sentence.length - 1
				break
			}
			if (endIndex === -1) {
				chunks.push({
					type: 'text',
					text: message.slice(startIndex),
				})
				startIndex = message.length
			}
		}
		if (endIndex !== -1) {
			chunks.push({
				type: 'text',
				text: message.slice(startIndex, endIndex),
			})
			startIndex = endIndex + 1
		}
	}
	return chunks
}

/**
 * Bot Message 管理器，用於當發送大量訊息時，控制消息發送速度，避免被 Line Ban。
 */
class BotMessageManager {
	/**
	 * 創建 Bot Message 管理器。
	 * @param {Object} bot - Line Bot 實體。
	 * @param {String} replyToken - Line Bot 回覆 Token。
	 * @param {Object} [options] - 管理器選
	 */
	constructor(bot, replyToken, options) {
		this.bot = bot
		this.replyToken = replyToken
		this.options = Object.assign({ interval: 100 }, options) // 預設每100毫秒發送一個訊息
		this.chunks = [] // 訊息塊隊列
		this.sentChunks = [] // 已發送訊息塊隊列
		this.intervalId = null // 定時器 ID
		this.isSending = false // 是否正在發送訊息中
	}

	/**
	 * 將訊息塊加入隊列，並開始執行訊息發送。
	 * @param {Array.<Object>} chunks - 要發送的訊息塊陣列。
	 */
	add(chunks) {
		this.chunks.push(...chunks)

		if (!this.isSending) {
			this.isSending = true
			// 建立定時器，每過一段時間就嘗試發送一個訊息
			this.intervalId = setInterval(() => this.sendMessages(), this.options.interval)
		}
	}

	/**
	 * 發送下一個訊息塊。
	 */
	async sendMessages() {
		if (this.chunks.length === 0) {
			// 隊列中已沒有訊息，清除定時器
			clearInterval(this.intervalId)
			return
		}

		const nextChunk = this.chunks.shift()
		this.sentChunks.push(nextChunk)
		await this.bot.replyMessage(this.replyToken, { messages: [nextChunk] })
	}
}

module.exports = {
	replyText,
	BotMessageManager,
}
