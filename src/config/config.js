const dotenv = require('dotenv')

// 讀取環境變數
dotenv.config()

// 配置參數
const config = {
	line: {
		channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
		channelSecret: process.env.CHANNEL_SECRET,
	},
	openai: {
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		MODEL_ID: process.env.OPENAI_MODEL_ID || 'gpt-3.5-turbo',
		MODEL_SCALE: process.env.OPENAI_MODEL_SCALE || 'full',
		MODEL_TEMPERATURE: process.env.OPENAI_MODEL_TEMPERATURE || 0.7,
		MAX_TOKENS: process.env.OPENAI_MAX_TOKENS || 512,
		DISABLE_COMPLETION: process.env.DISABLE_COMPLETION || false,
	},
	google: {
		GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
	},
}

// 導出配置參數
module.exports = config
