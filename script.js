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

const STORAGE_KEY = "galaxy_saved_chats_v2";

/* Main elements */

const messagesElement = document.getElementById("messages");
const chatArea = document.getElementById("chatArea");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const imageButton = document.getElementById("imageButton");
const voiceButton = document.getElementById("voiceButton");
const newChatButton = document.getElementById("newChatButton");
const recentChatsElement = document.getElementById("recentChats");
const chatTitle = document.getElementById("chatTitle");

/* Intro elements */

const intro = document.getElementById("intro");
const introVideo = document.getElementById("introVideo");
const skipIntroButton = document.getElementById("skipIntroButton");

let chats = loadChats();
let activeChatId = null;
let isGenerating = false;
let introClosed = false;

/* Intro video */

function closeIntro() {
  if (introClosed || !intro) {
    return;
  }

  introClosed = true;
  intro.classList.add("hidden");

  window.setTimeout(() => {
    intro.style.display = "none";
    messageInput.focus();
  }, 850);
}

if (introVideo) {
  introVideo.addEventListener("ended", closeIntro);

  introVideo.addEventListener("error", () => {
  alert("Intro video could not be loaded.");
closeIntro(); 
  });

  const playPromise = introVideo.play();

  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error) => {
      console.warn("Intro autoplay was blocked:", error);
    });
  }

  /*
    Prevent the website from remaining stuck
    if the video does not finish.
  */
  window.setTimeout(closeIntro, 15000);
} else {
  closeIntro();
}

if (skipIntroButton) {
  skipIntroButton.addEventListener("click", closeIntro);
}

/* Load saved conversations */

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

/* Save conversations */

function saveChats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error("Could not save chats:", error);
  }
}

/* Create a unique ID */

function createId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

/* Get current chat */

function getActiveChat() {
  return chats.find((chat) => chat.id === activeChatId);
}

/* Create new chat */

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

/* Open saved chat */

function openChat(chatId) {
  activeChatId = chatId;

  renderRecentChats();
  renderMessages();
}

/* Render recent chats */

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

/* Welcome screen */

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

/* Create text message */

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

/* Create generated image message */

function createImageMessageElement(prompt, imageSource) {
  const message = document.createElement("div");
  message.className = "message assistant-message";

  const avatar = document.createElement("div");
  avatar.className = "avatar assistant-avatar";
  avatar.textContent = "✦";

  const content = document.createElement("div");
  content.className = "message-content";

  const name = document.createElement("div");
  name.className = "message-name";
  name.textContent = "Galaxy";

  const text = document.createElement("div");
  text.className = "message-text";
  text.textContent = `Generated image: ${prompt}`;

  const image = document.createElement("img");
  image.className = "generated-image";
  image.src = imageSource;
  image.alt = prompt;
  image.loading = "lazy";

  content.appendChild(name);
  content.appendChild(text);
  content.appendChild(image);

  message.appendChild(avatar);
  message.appendChild(content);

  return message;
}

/* Render messages */

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
    if (message.type === "image" && message.imageSource) {
      messagesElement.appendChild(
        createImageMessageElement(
          message.prompt || "AI image",
          message.imageSource
        )
      );

      return;
    }

    messagesElement.appendChild(
      createMessageElement(message.role, message.content)
    );
  });

  scrollToBottom();
}

/* Typing indicator */

function showTypingIndicator(label = "Galaxy is thinking") {
  removeTypingIndicator();

  const typingMessage = document.createElement("div");

  typingMessage.className = "message assistant-message";
  typingMessage.id = "typingMessage";

  typingMessage.innerHTML = `
    <div class="avatar assistant-avatar">✦</div>

    <div class="message-content">
      <div class="message-name">Galaxy</div>
      <div class="message-text">${label}</div>

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

function removeTypingIndicator() {
  const typingMessage = document.getElementById("typingMessage");

  if (typingMessage) {
    typingMessage.remove();
  }
}

/* Extract Puter response */

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

/* Check Puter availability */

function isPuterAvailable() {
  return (
    typeof puter !== "undefined" &&
    puter.ai &&
    typeof puter.ai.chat === "function"
  );
}

/* Send chat message */

async function sendMessage(customMessage = null) {
  if (isGenerating) {
    return;
  }

  const userText =
    customMessage !== null
      ? String(customMessage).trim()
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
    content: userText,
    type: "text"
  });

  activeChat.updatedAt = Date.now();

  messageInput.value = "";
  resizeTextarea();

  saveChats();
  renderRecentChats();
  renderMessages();

  isGenerating = true;
  setButtonsDisabled(true);
  showTypingIndicator();

  try {
    if (!isPuterAvailable()) {
      throw new Error("Puter.js is not available.");
    }

    const conversation = [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      ...activeChat.messages
        .filter((message) => message.type !== "image")
        .map((message) => ({
          role: message.role,
          content: message.content
        }))
    ];

    const response = await puter.ai.chat(conversation);
    const reply = extractReply(response);

    activeChat.messages.push({
      role: "assistant",
      content: reply,
      type: "text"
    });

    activeChat.updatedAt = Date.now();
    saveChats();
  } catch (error) {
    console.error("Galaxy chat error:", error);

    activeChat.messages.push({
      role: "assistant",
      type: "text",
      content:
        "Sorry, I couldn't connect to the AI service. Check your internet connection, then try again."
    });

    saveChats();
  } finally {
    isGenerating = false;
    setButtonsDisabled(false);

    removeTypingIndicator();
    renderRecentChats();
    renderMessages();

    messageInput.focus();
  }
}

/* Generate an AI image */

async function generateImage() {
  if (isGenerating) {
    return;
  }

  const prompt = window.prompt(
    "Describe the image you want Galaxy to create:"
  );

  if (!prompt || !prompt.trim()) {
    return;
  }

  if (!activeChatId || !getActiveChat()) {
    createNewChat();
  }

  const cleanPrompt = prompt.trim();
  const activeChat = getActiveChat();

  if (activeChat.messages.length === 0) {
    activeChat.title =
      cleanPrompt.length > 32
        ? cleanPrompt.slice(0, 32) + "..."
        : cleanPrompt;
  }

  activeChat.messages.push({
    role: "user",
    type: "text",
    content: `Create an image of: ${cleanPrompt}`
  });

  activeChat.updatedAt = Date.now();

  saveChats();
  renderRecentChats();
  renderMessages();

  isGenerating = true;
  setButtonsDisabled(true);
  showTypingIndicator("Galaxy is creating your image");

  try {
    if (
      typeof puter === "undefined" ||
      !puter.ai ||
      typeof puter.ai.txt2img !== "function"
    ) {
      throw new Error("Image generation is unavailable.");
    }

    const generatedImage = await puter.ai.txt2img(cleanPrompt);

    if (!generatedImage || !generatedImage.src) {
      throw new Error("No image was returned.");
    }

    /*
      Image data URLs can be very large, so this image is displayed
      during the current browser session but is not saved permanently
      in localStorage.
    */
    activeChat.messages.push({
      role: "assistant",
      type: "text",
      content: `I created an image for: ${cleanPrompt}`
    });

    activeChat.updatedAt = Date.now();
    saveChats();

    removeTypingIndicator();
    renderMessages();

    messagesElement.appendChild(
      createImageMessageElement(cleanPrompt, generatedImage.src)
    );

    scrollToBottom();
  } catch (error) {
    console.error("Galaxy image error:", error);

    activeChat.messages.push({
      role: "assistant",
      type: "text",
      content:
        "Sorry, I couldn't generate that image. Please try a different description."
    });

    saveChats();
    renderMessages();
  } finally {
    isGenerating = false;
    setButtonsDisabled(false);
    removeTypingIndicator();
    messageInput.focus();
  }
}

/* Voice input */

function startVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(
      "Voice input is not supported in this browser. Try using Google Chrome or Microsoft Edge."
    );

    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  voiceButton.disabled = true;
  voiceButton.textContent = "●";
  messageInput.placeholder = "Listening...";

  recognition.addEventListener("result", (event) => {
    const transcript =
      event.results[0][0].transcript.trim();

    messageInput.value = transcript;
    resizeTextarea();
    messageInput.focus();
  });

  recognition.addEventListener("error", (event) => {
    console.error("Voice recognition error:", event.error);

    if (event.error !== "no-speech") {
      alert(
        "Galaxy couldn't hear you clearly. Please try again."
      );
    }
  });

  recognition.addEventListener("end", () => {
    voiceButton.disabled = false;
    voiceButton.textContent = "🎤";
    messageInput.placeholder = "Message Galaxy...";
  });

  try {
    recognition.start();
  } catch (error) {
    console.error("Could not start voice recognition:", error);

    voiceButton.disabled = false;
    voiceButton.textContent = "🎤";
    messageInput.placeholder = "Message Galaxy...";
  }
}

/* Disable buttons while generating */

function setButtonsDisabled(disabled) {
  sendButton.disabled = disabled;

  if (imageButton) {
    imageButton.disabled = disabled;
  }

  if (voiceButton) {
    voiceButton.disabled = disabled;
  }
}

/* Scroll */

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

/* Resize textarea */

function resizeTextarea() {
  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 170) + "px";
}

/* Suggestion buttons */

function connectSuggestionButtons() {
  const buttons = document.querySelectorAll(".suggestion");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const message = button.dataset.message;

      if (message) {
        sendMessage(message);
      }
    });
  });
}

/* Event listeners */

sendButton.addEventListener("click", () => {
  sendMessage();
});

messageInput.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {
    event.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener("input", resizeTextarea);

newChatButton.addEventListener("click", createNewChat);

if (imageButton) {
  imageButton.addEventListener("click", generateImage);
}

if (voiceButton) {
  voiceButton.addEventListener("click", startVoiceInput);
}

/* Start Galaxy */

if (chats.length > 0) {
  activeChatId = chats[0].id;
  renderRecentChats();
  renderMessages();
} else {
  createNewChat();
}
