const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;
const MODEL = 'microsoft/DialoGPT-medium';
const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

// HTTP POST エンドポイント（REST API用）
app.post('/chat', async (req, res) => {
  const { message, personality } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message（文字列）が必要です。' });
  }

  try {
    const reply = await generateReply(message, personality);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message || 'AIの返答取得に失敗しました。' });
  }
});

// WebSocket サーバー構築
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🟢 WebSocket connected');

  ws.on('message', async (data) => {
    try {
      const parsed = JSON.parse(data);
      const message = parsed.message;
      const personality = parsed.personality || '';

      if (!message || typeof message !== 'string') {
        return ws.send(JSON.stringify({ error: 'message（文字列）が必要です。' }));
      }

      const reply = await generateReply(message, personality);
      ws.send(JSON.stringify({ reply }));

    } catch (err) {
      console.error('WebSocketエラー:', err);
      ws.send(JSON.stringify({ error: 'AIとの通信中にエラーが発生しました。' }));
    }
  });
});

async function generateReply(message, personality = '') {
  const prompt = `${personality}\nユーザー: ${message}\nAI:`;

  try {
    const response = await axios.post(
      API_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const generated = response.data.generated_text || response.data[0]?.generated_text;
    if (!generated) throw new Error('返答が取得できませんでした');

    return generated.split('AI:')[1]?.trim() || generated.trim();

  } catch (error) {
    if (error.response) {
      console.error('Hugging Face APIエラー:', error.response.status, error.response.data);
      throw new Error(error.response.data.error || 'Hugging Face APIエラーが発生しました。');
    } else if (error.request) {
      console.error('APIリクエストエラー:', error.request);
      throw new Error('AIサーバーが応答しませんでした。');
    } else {
      console.error('不明なエラー:', error.message);
      throw new Error('サーバーエラーが発生しました。');
    }
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
