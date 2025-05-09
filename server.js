const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const HF_API_KEY = process.env.HF_API_KEY;
const HF_API_URL = 'https://api-inference.huggingface.co/models/gpt-2';

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket クライアント接続');

  const chatHistory = [];

  ws.on('message', async (raw) => {
    let parsed;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      ws.send('[エラー] JSON形式で送信してください');
      return;
    }

    const { personality, message } = parsed;
    if (!message) {
      ws.send('[エラー] メッセージが空です');
      return;
    }

    chatHistory.push({ role: 'user', content: message });

    let prompt = personality ? `${personality}\n` : '';
    chatHistory.forEach((msg) => {
      prompt += `${msg.role === 'user' ? 'ユーザー' : 'AI'}: ${msg.content}\n`;
    });
    prompt += 'AI:';

    try {
      const response = await axios.post(
        HF_API_URL,
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
          },
        }
      );

      const reply = response.data.generated_text?.replace(/.*AI:/s, '').trim() || '[AI応答なし]';

      chatHistory.push({ role: 'ai', content: reply });

      ws.send(reply);
    } catch (error) {
      console.error('APIエラー:', error.message);
      ws.send('[エラー] AI応答の取得に失敗しました。');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`サーバー起動中: http://localhost:${PORT}`);
});
