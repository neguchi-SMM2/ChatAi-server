const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const http = require('http'); 
const WebSocket = require('ws'); 

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message（文字列）が必要です。' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI APIエラー:', error);
    res.status(500).json({ error: 'AIの返答取得に失敗しました。' });
  }
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', async (message) => {
    console.log('Received:', message.toString());

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message.toString() }],
      });
      const reply = response.choices[0].message.content;
      ws.send(reply);
    } catch (e) {
      ws.send('エラーが発生しました。');
    }
  });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
