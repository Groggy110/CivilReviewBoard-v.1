const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const toggleExamples = document.getElementById('toggle-examples');
const questionBubbles = document.querySelector('.question-bubbles');

chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const message = userInput.value.trim();
    if (message) {
        addMessage('user', message);
        processMessage(message);
        userInput.value = '';
    }
});

function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    if (sender === 'bot') {
        messageElement.innerHTML = message;
    } else {
        messageElement.textContent = message;
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function processMessage(message) {
    try {
        document.getElementById('spinner').style.display = 'flex';
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
            signal: controller.signal,
            cache: 'no-store'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        addMessage('bot', data.content);
    } catch (error) {
        console.error('Error:', error);
        addMessage('bot', 'Sorry, there was an error processing your request.');
    } finally {
        document.getElementById('spinner').style.display = 'none';
    }
}

async function formatResponse(response) {
    const sections = response.match(/Education Code Section \d+/g) || [];
    const uniqueSections = [...new Set(sections)];
    if (uniqueSections.length === 0) {
        return response;
    }
    const articleReferences = await Promise.all(uniqueSections.map(async (section) => {
        const sectionNumber = section.match(/\d+/)[0];
        const fullArticle = await fetchFullArticle(sectionNumber);
        return `<details class="article-reference">
            <summary>${section}</summary>
            <div class="full-article">${fullArticle}</div>
        </details>`;
    }));
    return `${response}<div class="reference-box"><h3>Referenced Education Code Sections:</h3>${articleReferences.join('')}</div>`;
}

async function fetchFullArticle(section) {
    try {
        const response = await fetch(`/api/article/${section}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.content;
    } catch (error) {
        console.error('Error fetching full article:', error);
        return 'Error loading article content.';
    }
}

toggleExamples.addEventListener('click', function() {
    questionBubbles.style.display = questionBubbles.style.display === 'none' ? 'flex' : 'none';
    this.textContent = questionBubbles.style.display === 'none' ? 'Show Example Questions' : 'Hide Example Questions';
});

const exampleQuestions = document.querySelectorAll('.question-bubble');
exampleQuestions.forEach(bubble => {
    bubble.addEventListener('click', function() {
        const question = this.textContent;
        if (question) {
            addMessage('user', question);
            processMessage(question);
            questionBubbles.style.display = 'none';
            toggleExamples.textContent = 'Show Example Questions';
        }
    });
});

function initializeChat() {
    const welcomeMessage = 'Hello! I\'m an AI assistant created by the Civil Review Board, specializing in the California Education Code. How can I assist you today?';
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot');
    messageElement.textContent = welcomeMessage;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

initializeChat();
