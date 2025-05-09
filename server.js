const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// OpenAI クライアント初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ← Renderに設定済みか確認
});

// POST /chat エンドポイント
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message（文字列）が必要です。' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    });

    const reply = completion.choices[0]?.message?.content || '返答が見つかりませんでした。';
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API エラー:', error);
    res.status(500).json({ error: error.message || 'AIの返答取得に失敗しました。' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
