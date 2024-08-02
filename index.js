const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetchPolyfill = require('cross-fetch');

// Polyfill fetch and related classes/interfaces
global.fetch = fetchPolyfill.fetch;
global.Headers = fetchPolyfill.Headers;
global.Request = fetchPolyfill.Request;
global.Response = fetchPolyfill.Response;

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction: "You are an expert in general healthcare matters. You are tasked to engage in conversation with patients about health matters asked and provide alternative solutions or education. Explain health concepts that affect them so that they can understand using analogies and solutions. Use humor and make the conversation educational and interesting. Ask questions so that you can better understand the user and improve the educational experience.",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

app.get('/', (req, res) => {
	res.status(200).json({message: "welcome to gemini AI"});
});

let history = [];

app.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  console.log('Received prompt:', prompt);

  try {
    const chatSession = await model.startChat({
      ...generationConfig,
      history: history.map(entry => ({
        role: entry.role,
        parts: [entry.content]
      })),
    });

    console.log('Chat session started');

    const result = await chatSession.sendMessage(prompt);
    console.log('Received result:', result);
    let botResponse;
    if (typeof result.response === 'object' && result.response !== null) {
      if (typeof result.response.text === 'string') {
        botResponse = result.response.text;
      } else if (typeof result.response.text === 'function') {
        botResponse = await result.response.text();
      }
    }
    history.push({ role: 'user', content: prompt });
    history.push({ role: 'model', content: botResponse });

    res.json({ bot: botResponse });
  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
