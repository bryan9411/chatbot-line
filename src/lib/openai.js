const axios = require('axios')
const config = require('../config')

/**
 * 使用 OpenAI API 生成文字描述。
 * @param {string} prompt - 要求生成文字描述的問題或命題。
 * @param {string} modelId - 要使用的模型 ID。
 * @param {string} modelScale - 模型的規模，可以是 small、medium、large 或 full。
 * @param {number} temperature - 模型生成文字的多樣性，範圍從 0（保守）到 1（瘋狂）之間。
 * @param {number} maxTokens - 要生成的最大 tokens 數。每個 token 大約是一個字或一個標點符號。
 * @param {boolean} disableCompletion - 是否禁用自動完成，當輸出達到最大 token 數或遇到停止標記時停止模型輸出。
 * @return {string} 生成的文字描述。
 */
const generateText = async (
	prompt,
	modelId = config.openai.MODEL_ID,
	modelScale = config.openai.MODEL_SCALE,
	temperature = config.openai.MODEL_TEMPERATURE,
	maxTokens = config.openai.MAX_TOKENS,
	disableCompletion = config.openai.DISABLE_COMPLETION
) => {
	try {
		const response = await axios.post(
			'https://api.openai.com/v1/models/' + modelId + '/completions',
			{
				prompt: prompt,
				max_tokens: maxTokens,
				temperature: temperature,
				model: modelScale,
				disable_completion: disableCompletion,
			},
			{
				headers: { Authorization: `Bearer ${config.openai.OPENAI_API_KEY}` },
			}
		)
		const choices = response.data.choices
		if (!choices || choices.length === 0) {
			throw new Error('OpenAI API 返回了空數據。')
		}
		const text = choices[0].text.trim()
		return text.replace(/\n/g, '<br>') // 處理換行問題
	} catch (error) {
		console.error('在使用 OpenAI API 時發生錯誤：', error)
		return '在生成文字描述時發生了錯誤。'
	}
}

module.exports = { generateText }
