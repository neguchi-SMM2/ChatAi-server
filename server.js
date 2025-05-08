const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const PORT = 3000;

// OpenAI APIキーをここに設定（安全な方法で管理しましょう）
const configuration = new Configuration({
  apiKey: "sk-あなたのAPIキー"
});
const openai = new OpenAIApi(configuration);

app.use(cors());
app.use(bodyParser.json());

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4", // gpt-3.5-turbo でもOK
      messages: [
        { role: "system", content: "あなたは明るく元気な女の子のキャラです。" },
        { role: "user", content: message }
      ]
    });

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI API error:", error.response?.data || error.message);
    res.status(500).json({ error: "APIリクエストに失敗しました。" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
