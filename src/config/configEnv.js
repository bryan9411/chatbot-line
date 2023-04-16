const dotenv = require('dotenv')

// 讀取環境變數
dotenv.config()

// 配置參數
const configEnv = {
	line: {
		accessToken: process.env.LINE_ACCESS_TOKEN,
		channelSecret: process.env.LINE_CHANNEL_SECRET,
	},
	openai: {
		apiKey: process.env.OPENAI_API_KEY,
		models: {
			foodDescriber: process.env.OPENAI_FOOD_DESCRIBER_MODEL_ID,
		},
	},
	google: {
		apiKey: process.env.GOOGLE_API_KEY,
	},
}

// 導出配置參數
module.exports = configEnv
