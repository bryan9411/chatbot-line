const express = require('express')
const app = express()

// 設置 Web 伺服器，開始監聽來自用戶端的請求
const port = process.env.PORT || 3000

app.listen(port, () => {
	console.log(`Express server is running on http://localhost:${port}`)
})

app.get('/callback', (req, res) => {
	res.send('Hello World!')
})
