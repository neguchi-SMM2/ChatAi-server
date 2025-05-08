const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// ミドルウェア設定
app.use(cors());
app.use(express.json());

// OpenAIクライアントを初期化（APIキーはRenderの環境変数で設定）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 雑談エンドポイント
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'メッセージが必要です。' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMessage }],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('OpenAIエラー:', error);
    res.status(500).json({ error: 'OpenAIとの通信に失敗しました。' });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
