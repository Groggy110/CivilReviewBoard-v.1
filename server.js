const express = require('express');
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// POST route for /api/chat
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an AI assistant specializing in the California Education Code. Provide comprehensive answers to user questions. Start each paragraph with a relevant California Education Code section. If multiple sections apply, use them in separate paragraphs. Always format sections as 'California Education Code Section X' or 'California Education Code Section X.Y' if there's a subsection. Explain the relevance of each section in the context of the user's question." },
        { role: "user", content: message }
      ],
    });

    const formattedResponse = formatResponse(completion.data.choices[0].message.content);
    res.json({ content: formattedResponse });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

function formatResponse(response) {
  const paragraphs = response.split('\n\n');
  const formattedParagraphs = paragraphs.map(paragraph => {
    return paragraph.replace(/California Education Code Section (\d+(?:\.\d+)?)/g, (match, sectionNumber) => {
      const googleSearchLink = `https://www.google.com/search?q=California+Education+Code+Section+${sectionNumber}`;
      return `<a href="${googleSearchLink}" target="_blank">${match}</a>`;
    });
  });
  return formattedParagraphs.map(p => `<p>${p}</p>`).join('');
}

app.get('/api/article/:section', async (req, res) => {
  const section = req.params.section;
  try {
    // Here you would typically fetch the full article content from a database or API
    // For this example, we'll simulate fetching the content
    const fullArticle = await fetchEducationCodeArticle(section);
    res.json({ content: fullArticle });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'An error occurred while fetching the article.' });
  }
});

async function fetchEducationCodeArticle(section) {
  // Simulate an API call or database query with reduced timeout
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`This is the full content of California Education Code ${section}. In a real application, this would contain the actual text of the specified Education Code section.`);
    }, 100); // Reduced from 500ms to 100ms
  });
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
