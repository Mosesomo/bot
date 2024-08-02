const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

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
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction: "ou are an expert in genaral healthcare matters, you are tasked to engage in conversation with patients about health matters asked and provide alternative solution or education. Explain health concepts that affects them so that they can understand using anologies and solutions. use humor and make the conversation educational and interesting. Ask questions so that you can better understand the user and improve educational experience",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function generateResponse(userInput) {
  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [
          { text: userInput },
        ],
      },
    ],
  });

  const result = await chatSession.sendMessage("");
  return result.response.text();
}

app.get('/', (req, res) => {
	res.status(200).json({message: "Welcome to our health care assitant AI!!"});
});

app.post('/chat', async (req, res) => {
  const userInput = req.body.userInput;
  if (!userInput) {
    return res.status(400).send('Missing "userInput" in request body');
  }

  try {
    const response = await generateResponse(userInput);
    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
