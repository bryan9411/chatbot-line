const { Configuration, OpenAIApi } = require('openai')
const configs = require('../config')

const apiKey = configs.openAi.OPENAI_API_KEY
const configuration = new Configuration({ apiKey })
const OpenAIGenerator = new OpenAIApi(configuration)

/**
 * 使用 OpenAI API 生成文本。
 *
 * @param {string} prompt - 要求文本生成的问题或命題。
 * @param {string} model - 要使用的模型名稱。
 * @param {number | undefined} temperature - 模型輸出文本的隨機多樣性，值範圍為 0（保守）到 1（瘋狂）之間。預設為 configs 配置中的值。
 * @param {number | undefined} max_tokens - 要生成的最大 tokens 数量。每個 tokens 大約等於一個詞或一個標點符號。默認為 configs 配置中的值。
 * @returns {Promise<string>} 生成的文本。
 */
const generateText = async (
	prompt,
	model = configs.openAi.MODEL_ID,
	temperature = configs.openAi.MODEL_TEMPERATURE,
	max_tokens = configs.openAi.MAX_TOKENS
) => {
	try {
		const messages = [{ role: 'user', content: prompt }]
		const [choices] = (await OpenAIGenerator.createChatCompletion({ model, max_tokens, temperature, messages })).data
			.choices
		const message =
			(choices && choices.message && choices.message.content && choices.message.content.trim()) ||
			'抱歉，我沒有話可說了。'
		let text = message.trim()

		if (text) {
			const paragraphs = text.split(/\n\s*\n/)
			text = paragraphs
				.map((paragraph) => {
					if (!/^#{1,6}\s/.test(paragraph)) {
						paragraph = `\n ${paragraph.replace(/\n+/g, ' ').trim()} \n`
					}
					paragraph = paragraph.replace(/\n- /g, '\n\n- ')

					return paragraph.trim()
				})
				.join('\n')

			text = text.replace(/(```\s*\n[\s\S]+?\n```)/g, '\n$1\n')
			text = text.endsWith('```') ? `${text.slice(0, -3).trim()}\n\`\`\`\n` : `${text.trim()} `

			text = text.replace(/(\n+)/g, '\n\n')
		}

		return text
	} catch (error) {
		console.error(`OpenAI API 在生成文本時發生錯誤：${error.message}`)
		return `在生成文本時發生錯誤: ${error.message}`
	}
}

/**
 * 將使用者輸入的文本轉換為 line bot 回覆的文本
 * 如果输入的文本是 /code，则會 return 具有 Markdown 格式的字串。
 *
 * @param {string} input - 使用者輸入。
 * @returns {Promise<string>} line bot 回覆。
 */
const generateResponse = async (input) => {
	if (input.trim().toLowerCase() === '/code') {
		return '\n以下是您的程式碼区块：\n\n```\n'
	} else {
		const response = await generateText(input)
		return response
			.replace(/```(\s*)\n/g, '\n```\n')
			.replace(/```(\s*)/g, '')
			.replace(/\n\n/g, '\n')
	}
}

module.exports = { generateText, generateResponse }
