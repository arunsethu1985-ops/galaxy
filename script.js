"use strict";

/*
  Galaxy AI Assistant
  Created by Harshavrdhan
*/

const SYSTEM_PROMPT = `
You are Galaxy, a helpful AI assistant.

Identity rules:
- Your name is Galaxy.
- Galaxy was created by Harshavrdhan.
- If asked who created or made you, answer:
  "Galaxy was created by Harshavrdhan."
- If asked who you are, answer:
  "I'm Galaxy, an AI assistant created by Harshavrdhan."
- Never say that another company created Galaxy.
- If asked about the underlying technology, answer:
  "Galaxy was created by Harshavrdhan and is powered by third-party AI technology."

Behavior rules:
- Be helpful, friendly, and clear.
- Give accurate answers.
- Admit when you are unsure.
- Do not pretend to know live weather, news, prices, or scores unless a live tool is connected.
`;

const STORAGE_KEY = "galaxy_saved_chats_v1";

const messagesElement = document.getElementById("messages");
const chatArea = document.getElementById("chatArea");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChatButton");
const recentChatsElement = document.getElementById("recentChats");
const chatTitle = document.getElementById("chatTitle");
const suggestionButtons = document.querySelectorAll(".suggestion");

let chats = loadChats();
let activeChatId = null;
let isGenerating = false;

/*
  Load saved conversations from the browser.
*/
function loadChats() {
  try {
    const savedChats = localStorage.getItem(STORAGE_KEY);

    if (!savedChats) {
      return [];
    }

    const parsedChats = JSON.parse(savedChats);

    return Array.isArray(parsedChats) ? parsedChats : [];
  } catch (error) {
    console.error("Could not load chats:", error);
    return [];
  }
}

/*
  Save all conversations.
*/
function saveChats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error("Could not save chats:", error);
  }
}

/*
  Generate a unique ID.
*/
function createId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

/*
  Return the currently opened chat.
*/
function getActiveChat() {
  return chats.find((chat) => chat.id === activeChatId);
}

/*
  Create a new conversation.
*/
function createNewChat() {
  const newChat = {
    id: createId(),
    title: "New chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };

  chats.unshift(newChat);
  activeChatId = newChat.id;

  saveChats();
  renderRecentChats();
  renderMessages();

  messageInput.focus();
}

/*
  Open a saved conversation.
*/
function openChat(chatId) {
  activeChatId = chatId;

  renderRecentChats();
  renderMessages();
}

/*
  Display recent chats in the sidebar.
*/
function renderRecentChats() {
  recentChatsElement.innerHTML = "";

  if (chats.length === 0) {
    recentChatsElement.innerHTML =
      '<p class="empty-message">No recent chats</p>';

    return;
  }

  chats.forEach((chat) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "recent-item";
    button.textContent = chat.title;

    if (chat.id === activeChatId) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      openChat(chat.id);
    });

    recentChatsElement.appendChild(button);
  });
}

/*
  Display the welcome screen.
*/
function renderWelcome() {
  messagesElement.innerHTML = `
    <div id="welcome" class="welcome">
      <div class="welcome-logo">✦</div>

      <h2>How can I help you?</h2>

      <p>
        I'm Galaxy, an AI assistant created by Harshavrdhan.
      </p>

      <div class="suggestions">
        <button
          class="suggestion"
          data-message="Explain artificial intelligence simply"
        >
          <strong>Explain something</strong>
          <span>Learn a difficult topic simply</span>
        </button>

        <button
          class="suggestion"
          data-message="Help me write a professional message"
        >
          <strong>Help me write</strong>
          <span>Create messages and ideas</span>
        </button>

        <button
          class="suggestion"
          data-message="Help me learn coding"
        >
          <strong>Help with coding</strong>
          <span>Write or fix computer code</span>
        </button>

        <button
          class="suggestion"
          data-message="Give me creative project ideas"
        >
          <strong>Brainstorm ideas</strong>
          <span>Generate creative suggestions</span>
        </button>
      </div>
    </div>
  `;

  connectSuggestionButtons();
}

/*
  Display one message.
*/
function createMessageElement(role, text) {
  const message = document.createElement("div");

  message.className =
    role === "user"
      ? "message user-message"
      : "message assistant-message";

  const avatar = document.createElement("div");

  avatar.className =
    role === "user"
      ? "avatar user-avatar"
      : "avatar assistant-avatar";

  avatar.textContent = role === "user" ? "U" : "✦";

  const content = document.createElement("div");
  content.className = "message-content";

  const name = document.createElement("div");
  name.className = "message-name";
  name.textContent = role === "user" ? "You" : "Galaxy";

  const messageText = document.createElement("div");
  messageText.className = "message-text";
  messageText.textContent = text;

  content.appendChild(name);
  content.appendChild(messageText);

  message.appendChild(avatar);
  message.appendChild(content);

  return message;
}

/*
  Display the current conversation.
*/
function renderMessages() {
  const activeChat = getActiveChat();

  if (!activeChat || activeChat.messages.length === 0) {
    chatTitle.textContent = "Galaxy";
    renderWelcome();
    return;
  }

  messagesElement.innerHTML = "";
  chatTitle.textContent = activeChat.title;

  activeChat.messages.forEach((message) => {
    messagesElement.appendChild(
      createMessageElement(message.role, message.content)
    );
  });

  scrollToBottom();
}

/*
  Display the animated typing indicator.
*/
function showTypingIndicator() {
  const typingMessage = document.createElement("div");

  typingMessage.className = "message assistant-message";
  typingMessage.id = "typingMessage";

  typingMessage.innerHTML = `
    <div class="avatar assistant-avatar">✦</div>

    <div class="message-content">
      <div class="message-name">Galaxy</div>

      <div class="typing">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;

  messagesElement.appendChild(typingMessage);
  scrollToBottom();
}

/*
  Remove the typing indicator.
*/
function removeTypingIndicator() {
  const typingMessage =
    document.getElementById("typingMessage");

  if (typingMessage) {
    typingMessage.remove();
  }
}

/*
  Extract text safely from Puter's response.
*/
function extractReply(response) {
  if (typeof response === "string") {
    return response;
  }

  if (
    response &&
    response.message &&
    typeof response.message.content === "string"
  ) {
    return response.message.content;
  }

  if (
    response &&
    typeof response.content === "string"
  ) {
    return response.content;
  }

  return "Sorry, I could not create a response.";
}

/*
  Send the user's message to Galaxy.
*/
async function sendMessage(customMessage = null) {
  if (isGenerating) {
    return;
  }

  const userText =
    customMessage !== null
      ? customMessage.trim()
      : messageInput.value.trim();

  if (!userText) {
    return;
  }

  if (!activeChatId || !getActiveChat()) {
    createNewChat();
  }

  const activeChat = getActiveChat();

  if (activeChat.messages.length === 0) {
    activeChat.title =
      userText.length > 32
        ? userText.slice(0, 32) + "..."
        : userText;
  }

  activeChat.messages.push({
    role: "user",
    content: userText
  });

  activeChat.updatedAt = Date.now();

  messageInput.value = "";
  resizeTextarea();

  saveChats();
  renderRecentChats();
  renderMessages();

  isGenerating = true;
  sendButton.disabled = true;

  showTypingIndicator();

  try {
    const conversation = [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      ...activeChat.messages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    ];

    const response = await puter.ai.chat(conversation);

    const reply = extractReply(response);

    activeChat.messages.push({
      role: "assistant",
      content: reply
    });

    activeChat.updatedAt = Date.now();

    saveChats();
  } catch (error) {
    console.error("Galaxy error:", error);

    activeChat.messages.push({
      role: "assistant",
      content:
        "Sorry, I couldn't connect to the AI service. Please check your internet connection and try again."
    });

    saveChats();
  } finally {
    isGenerating = false;
    sendButton.disabled = false;

    removeTypingIndicator();
    renderRecentChats();
    renderMessages();

    messageInput.focus();
  }
}

/*
  Keep the latest message visible.
*/
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

/*
  Resize the message box while typing.
*/
function resizeTextarea() {
  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 170) + "px";
}

/*
  Connect welcome suggestion buttons.
*/
function connectSuggestionButtons() {
  const buttons =
    document.querySelectorAll(".suggestion");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const message = button.dataset.message;

      if (message) {
        sendMessage(message);
      }
    });
  });
}

/*
  Send button.
*/
sendButton.addEventListener("click", () => {
  sendMessage();
});

/*
  Enter sends.
  Shift + Enter creates a new line.
*/
messageInput.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {
    event.preventDefault();
    sendMessage();
  }
});

/*
  Resize input when typing.
*/
messageInput.addEventListener("input", resizeTextarea);

/*
  New Chat button.
*/
newChatButton.addEventListener("click", createNewChat);

/*
  Start Galaxy.
*/
if (chats.length > 0) {
  activeChatId = chats[0].id;
} else {
  createNewChat();
}

renderRecentChats();
renderMessages();
connectSuggestionButtons();
messageInput.focus();
