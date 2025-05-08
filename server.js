const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// OpenAIクライアント初期化（Renderの環境変数を使用）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /chat にJSONでメッセージを送信 → AIの返答をJSONで返す
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
    res.json({ reply }); // JSON形式で返答
  } catch (error) {
    console.error('OpenAI APIエラー:', error);
    res.status(500).json({ error: 'AIの返答取得に失敗しました。' });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
