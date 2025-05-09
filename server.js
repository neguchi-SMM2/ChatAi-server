const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

// OpenAIクライアント初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// HTTP POST /chat エンドポイント（任意）
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

// WebSocketサーバーのセットアップ
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('クライアントが接続しました');

  ws.on('message', async (data) => {
    try {
      // クライアントからJSON文字列を受け取る
      const { message } = JSON.parse(data);

      if (typeof message !== 'string') {
        return ws.send(JSON.stringify({ error: '無効なメッセージ形式です。' }));
      }

      // OpenAI に送信
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      });

      const reply = response.choices[0].message.content;

      // 結果をクライアントにJSONで返す
      ws.send(JSON.stringify({ reply }));
    } catch (error) {
      console.error('WebSocketエラー:', error);
      ws.send(JSON.stringify({ error: 'AIの応答取得に失敗しました。' }));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});
