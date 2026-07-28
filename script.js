"use strict";

/* =========================================================
   GALAXY AI ASSISTANT
   Complete script.js

   Requires:
   <script src="https://js.puter.com/v2/"></script>

   Main features:
   - Puter AI chat
   - Streaming responses
   - Automatic image/video intent detection
   - Text-to-image
   - Text-to-video
   - Photo-to-video using pasted/dropped images
   - Live local clock and greeting
   - Live location-based weather
   - Voice recognition and wake word
   - Spoken answers
   - Recent conversations
   - Daily media limits
   - Dynamic topic backgrounds
   - Easter eggs
   ========================================================= */


/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const CONFIG = {
  appName: "Galaxy",
  creator: "Harshavrdhan",

  chatModel: "gpt-5.4-nano",

  image: {
    provider: "openai-image-generation",
    model: "gpt-image-2",
    quality: "high",
    ratio: {
      w: 16,
      h: 9
    }
  },

  video: {
    model: "veo-3.1-generate-preview",
    seconds: 8,
    size: "1920x1080",
    negativePrompt:
      "blurry, low quality, flickering, unstable motion, distorted faces, warped hands, duplicate subjects, artifacts, text, subtitles, logo, watermark"
  },

  limits: {
    imagesPerDay: 15,
    videosPerDay: 15,
    maximumAttachments: 3,
    maximumAttachmentSizeMB: 12
  },

  storageKeys: {
    chats: "galaxy_chats_v1",
    activeChat: "galaxy_active_chat_v1",
    settings: "galaxy_settings_v1",
    mediaUsage: "galaxy_media_usage_v1",
    introSeen: "galaxy_intro_seen_v1"
  },

  maximumStoredChats: 30,
  maximumContextMessages: 20
};


/* =========================================================
   2. DOM ELEMENTS
   ========================================================= */

const elements = {
  body: document.body,

  introScreen: document.getElementById("introScreen"),
  enterGalaxyButton: document.getElementById("enterGalaxyButton"),
  skipIntroButton: document.getElementById("skipIntroButton"),
  galaxyApp: document.getElementById("galaxyApp"),

  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  openSidebarButton: document.getElementById("openSidebarButton"),
  closeSidebarButton: document.getElementById("closeSidebarButton"),

  newChatButton: document.getElementById("newChatButton"),
  clearChatsButton: document.getElementById("clearChatsButton"),
  recentChats: document.getElementById("recentChats"),

  settingsButton: document.getElementById("settingsButton"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettingsButton: document.getElementById("closeSettingsButton"),
  modalBackdrop: document.querySelector(".modal-backdrop"),

  speechToggle: document.getElementById("speechToggle"),
  wakeWordToggle: document.getElementById("wakeWordToggle"),
  effectsToggle: document.getElementById("effectsToggle"),
  enableWeatherButton: document.getElementById("enableWeatherButton"),
  deleteHistoryButton: document.getElementById("deleteHistoryButton"),

  voiceOrb: document.getElementById("voiceOrb"),
  statusDot: document.getElementById("statusDot"),
  galaxyStatus: document.getElementById("galaxyStatus"),
  chatTitle: document.getElementById("chatTitle"),

  liveTime: document.getElementById("liveTime"),
  liveDate: document.getElementById("liveDate"),
  greetingText: document.getElementById("greetingText"),

  weatherCard: document.getElementById("weatherCard"),
  weatherIcon: document.getElementById("weatherIcon"),
  weatherTemperature: document.getElementById("weatherTemperature"),
  weatherDescription: document.getElementById("weatherDescription"),
  weatherEffects: document.getElementById("weatherEffects"),

  chatArea: document.getElementById("chatArea"),
  messages: document.getElementById("messages"),

  messageInput: document.getElementById("messageInput"),
  sendButton: document.getElementById("sendButton"),
  composerShell: document.querySelector(".composer-shell"),
  composerSection: document.querySelector(".composer-section"),

  voiceNotice: document.getElementById("voiceNotice"),
  voiceNoticeText: document.getElementById("voiceNoticeText"),

  backgroundCanvas: document.getElementById("backgroundCanvas"),
  topicEffects: document.getElementById("topicEffects"),

  chickenCharacter: document.getElementById("chickenCharacter"),
  astronautCharacter: document.getElementById("astronautCharacter"),
  dinosaurCharacter: document.getElementById("dinosaurCharacter")
};


/* =========================================================
   3. APPLICATION STATE
   ========================================================= */

const state = {
  chats: [],
  activeChatId: null,

  settings: {
    speechEnabled: true,
    wakeWordEnabled: false,
    effectsEnabled: true,
    weatherEnabled: false
  },

  isGenerating: false,
  isListening: false,
  awaitingVoiceCommand: false,

  recognition: null,
  recognitionRestartTimer: null,

  speechVoice: null,

  attachments: [],
  attachmentTray: null,
  hiddenFileInput: null,

  weather: null,
  currentTheme: "space",

  particles: [],
  animationFrameId: null,

  easterEggRunning: false
};


/* =========================================================
   4. BASIC HELPERS
   ========================================================= */

function createId(prefix = "id") {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}


function safeJSONParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}


function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatMessageText(value = "") {
  const escaped = escapeHTML(value);

  return escaped
    .replace(
      /```([\s\S]*?)```/g,
      "<pre><code>$1</code></pre>"
    )
    .replace(
      /`([^`\n]+)`/g,
      "<code>$1</code>"
    )
    .replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    )
    .replace(
      /\*(.*?)\*/g,
      "<em>$1</em>"
    )
    .replace(/\n/g, "<br>");
}


function getTodayKey() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}


function scrollMessagesToBottom(smooth = true) {
  requestAnimationFrame(() => {
    elements.chatArea?.scrollTo({
      top: elements.chatArea.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  });
}


function autoResizeTextarea() {
  const textarea = elements.messageInput;

  if (!textarea) {
    return;
  }

  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
}


function removeWelcomeScreen() {
  const welcome = elements.messages?.querySelector(".welcome-screen");

  if (welcome) {
    welcome.remove();
  }
}


function setAppStatus(status, text = "") {
  const statusText = text || {
    ready: "Ready",
    listening: "Listening",
    thinking: "Thinking",
    speaking: "Speaking",
    generating: "Creating",
    error: "Something went wrong"
  }[status] || "Ready";

  elements.galaxyStatus.textContent = statusText;

  elements.statusDot.className = `status-dot status-${status}`;
  elements.voiceOrb.className = `voice-orb orb-${status}`;
  elements.body.dataset.galaxyState = status;
}


function showToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("galaxyToastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "galaxyToastContainer";
    container.className = "galaxy-toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `galaxy-toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  window.setTimeout(() => {
    toast.classList.remove("visible");

    window.setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}


/* =========================================================
   5. STORAGE AND SETTINGS
   ========================================================= */

function loadStoredState() {
  const storedChats = safeJSONParse(
    localStorage.getItem(CONFIG.storageKeys.chats),
    []
  );

  const storedSettings = safeJSONParse(
    localStorage.getItem(CONFIG.storageKeys.settings),
    {}
  );

  state.chats = Array.isArray(storedChats)
    ? storedChats
    : [];

  state.settings = {
    ...state.settings,
    ...storedSettings
  };

  const savedActiveChat =
    localStorage.getItem(CONFIG.storageKeys.activeChat);

  if (
    savedActiveChat &&
    state.chats.some(chat => chat.id === savedActiveChat)
  ) {
    state.activeChatId = savedActiveChat;
  } else if (state.chats.length > 0) {
    state.activeChatId = state.chats[0].id;
  }

  elements.speechToggle.checked =
    Boolean(state.settings.speechEnabled);

  elements.wakeWordToggle.checked =
    Boolean(state.settings.wakeWordEnabled);

  elements.effectsToggle.checked =
    Boolean(state.settings.effectsEnabled);
}


function saveSettings() {
  localStorage.setItem(
    CONFIG.storageKeys.settings,
    JSON.stringify(state.settings)
  );
}


function saveChats() {
  state.chats = state.chats
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, CONFIG.maximumStoredChats);

  localStorage.setItem(
    CONFIG.storageKeys.chats,
    JSON.stringify(state.chats)
  );

  if (state.activeChatId) {
    localStorage.setItem(
      CONFIG.storageKeys.activeChat,
      state.activeChatId
    );
  }
}


function createNewChat(render = true) {
  const chat = {
    id: createId("chat"),
    title: "New conversation",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };

  state.chats.unshift(chat);
  state.activeChatId = chat.id;

  saveChats();
  renderRecentChats();

  if (render) {
    renderActiveChat();
  }

  closeSidebar();

  return chat;
}


function getActiveChat() {
  let chat = state.chats.find(
    item => item.id === state.activeChatId
  );

  if (!chat) {
    chat = createNewChat(false);
  }

  return chat;
}


function generateChatTitle(text) {
  const cleaned = String(text)
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "New conversation";
  }

  return cleaned.length > 42
    ? `${cleaned.slice(0, 42)}…`
    : cleaned;
}


function addMessageToActiveChat(message) {
  const chat = getActiveChat();

  chat.messages.push({
    id: message.id || createId("message"),
    role: message.role,
    type: message.type || "text",
    content: message.content || "",
    createdAt: message.createdAt || Date.now()
  });

  if (
    chat.title === "New conversation" &&
    message.role === "user"
  ) {
    chat.title = generateChatTitle(message.content);
  }

  chat.updatedAt = Date.now();

  saveChats();
  renderRecentChats();
}


function deleteChat(chatId) {
  state.chats = state.chats.filter(
    chat => chat.id !== chatId
  );

  if (state.activeChatId === chatId) {
    state.activeChatId =
      state.chats[0]?.id || null;
  }

  if (!state.activeChatId) {
    createNewChat(false);
  }

  saveChats();
  renderRecentChats();
  renderActiveChat();
}


function clearAllChats() {
  const confirmed = window.confirm(
    "Delete all saved Galaxy conversations?"
  );

  if (!confirmed) {
    return;
  }

  state.chats = [];
  state.activeChatId = null;

  localStorage.removeItem(CONFIG.storageKeys.chats);
  localStorage.removeItem(CONFIG.storageKeys.activeChat);

  createNewChat(false);
  renderRecentChats();
  renderActiveChat();

  showToast("Chat history deleted.", "success");
}


/* =========================================================
   6. RECENT CHAT SIDEBAR
   ========================================================= */

function renderRecentChats() {
  if (!elements.recentChats) {
    return;
  }

  elements.recentChats.innerHTML = "";

  const chats = [...state.chats]
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (chats.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-recent-chats";
    empty.textContent = "No conversations yet.";
    elements.recentChats.appendChild(empty);
    return;
  }

  for (const chat of chats) {
    const item = document.createElement("div");
    item.className = "recent-chat-item";

    if (chat.id === state.activeChatId) {
      item.classList.add("active");
    }

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "recent-chat-open";
    openButton.title = chat.title;

    const icon = document.createElement("span");
    icon.className = "recent-chat-icon";
    icon.textContent = "◌";

    const title = document.createElement("span");
    title.className = "recent-chat-title";
    title.textContent = chat.title;

    openButton.append(icon, title);

    openButton.addEventListener("click", () => {
      state.activeChatId = chat.id;
      saveChats();
      renderRecentChats();
      renderActiveChat();
      closeSidebar();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "recent-chat-delete";
    deleteButton.title = "Delete conversation";
    deleteButton.setAttribute(
      "aria-label",
      `Delete ${chat.title}`
    );
    deleteButton.textContent = "×";

    deleteButton.addEventListener("click", event => {
      event.stopPropagation();

      const confirmed = window.confirm(
        `Delete “${chat.title}”?`
      );

      if (confirmed) {
        deleteChat(chat.id);
      }
    });

    item.append(openButton, deleteButton);
    elements.recentChats.appendChild(item);
  }
}


/* =========================================================
   7. MESSAGE RENDERING
   ========================================================= */

function createMessageElement({
  role,
  content = "",
  type = "text",
  loading = false
}) {
  const wrapper = document.createElement("article");
  wrapper.className = `message message-${role}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";

  if (role === "assistant") {
    const logo = document.createElement("img");
    logo.src =
      "space-galaxy-stars-260nw-2537371667.webp.png";
    logo.alt = "";
    logo.className = "message-avatar-logo spinning-logo";
    avatar.appendChild(logo);
  } else {
    avatar.textContent = "You";
  }

  const body = document.createElement("div");
  body.className = "message-body";

  const name = document.createElement("div");
  name.className = "message-name";
  name.textContent =
    role === "assistant" ? "Galaxy" : "You";

  const contentElement = document.createElement("div");
  contentElement.className = "message-content";

  if (loading) {
    contentElement.innerHTML = `
      <div class="typing-indicator" aria-label="Galaxy is thinking">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  } else if (type === "text") {
    contentElement.innerHTML = formatMessageText(content);
  }

  body.append(name, contentElement);
  wrapper.append(avatar, body);

  return {
    wrapper,
    body,
    contentElement
  };
}


function renderActiveChat() {
  const chat = getActiveChat();

  elements.messages.innerHTML = "";
  elements.chatTitle.textContent = chat.title;

  if (chat.messages.length === 0) {
    renderWelcomeScreen();
    return;
  }

  for (const message of chat.messages) {
    const rendered = createMessageElement({
      role: message.role,
      content: message.content,
      type: message.type
    });

    elements.messages.appendChild(rendered.wrapper);
  }

  scrollMessagesToBottom(false);
}


function renderWelcomeScreen() {
  elements.messages.innerHTML = `
    <section class="welcome-screen">
      <p id="greetingText" class="greeting-text">
        ${escapeHTML(getGreeting())}
      </p>

      <h2>How can I help you?</h2>

      <p class="welcome-description">
        Type a message or say
        <strong>“Galaxy”</strong>
        to start speaking.
      </p>

      <div class="suggestion-grid">
        <button
          class="suggestion-card space-card"
          type="button"
          data-prompt="Tell me something fascinating about space"
        >
          <span class="suggestion-icon">🪐</span>
          <span class="suggestion-text">
            <strong>Explore space</strong>
            <small>Stars, planets and galaxies</small>
          </span>
        </button>

        <button
          class="suggestion-card weather-suggestion-card"
          type="button"
          data-prompt="What is the live weather right now?"
        >
          <span class="suggestion-icon">🌧️</span>
          <span class="suggestion-text">
            <strong>Check weather</strong>
            <small>Live conditions and atmosphere</small>
          </span>
        </button>

        <button
          class="suggestion-card ai-card"
          type="button"
          data-prompt="Explain artificial intelligence simply"
        >
          <span class="suggestion-icon">🤖</span>
          <span class="suggestion-text">
            <strong>Learn about AI</strong>
            <small>Simple and useful explanations</small>
          </span>
        </button>

        <button
          class="suggestion-card story-card"
          type="button"
          data-prompt="Tell me a creative story"
        >
          <span class="suggestion-icon">✨</span>
          <span class="suggestion-text">
            <strong>Create a story</strong>
            <small>Enter a new world</small>
          </span>
        </button>
      </div>
    </section>
  `;

  bindSuggestionCards();
}


function appendTextMessage(role, content, save = true) {
  removeWelcomeScreen();

  const rendered = createMessageElement({
    role,
    content,
    type: "text"
  });

  elements.messages.appendChild(rendered.wrapper);

  if (save) {
    addMessageToActiveChat({
      role,
      type: "text",
      content
    });
  }

  scrollMessagesToBottom();

  return rendered;
}


function appendLoadingMessage(label = "") {
  removeWelcomeScreen();

  const rendered = createMessageElement({
    role: "assistant",
    loading: true
  });

  if (label) {
    const labelElement = document.createElement("p");
    labelElement.className = "generation-status-label";
    labelElement.textContent = label;
    rendered.contentElement.appendChild(labelElement);
  }

  elements.messages.appendChild(rendered.wrapper);
  scrollMessagesToBottom();

  return rendered;
}


function appendImageMessage(imageElement, prompt) {
  removeWelcomeScreen();

  const rendered = createMessageElement({
    role: "assistant",
    type: "media"
  });

  const mediaCard = document.createElement("figure");
  mediaCard.className = "generated-media generated-image-card";

  imageElement.classList.add("generated-image");
  imageElement.alt = prompt;

  const caption = document.createElement("figcaption");
  caption.textContent = `Generated from: ${prompt}`;

  const actions = createMediaActions(
    imageElement.src,
    "galaxy-image.png",
    "image"
  );

  mediaCard.append(imageElement, caption, actions);
  rendered.contentElement.appendChild(mediaCard);

  elements.messages.appendChild(rendered.wrapper);

  addMessageToActiveChat({
    role: "assistant",
    type: "text",
    content:
      "I generated an image for your request. Generated media is not stored in browser chat history."
  });

  scrollMessagesToBottom();
}


function appendVideoMessage(videoElement, prompt) {
  removeWelcomeScreen();

  const rendered = createMessageElement({
    role: "assistant",
    type: "media"
  });

  const mediaCard = document.createElement("figure");
  mediaCard.className = "generated-media generated-video-card";

  videoElement.classList.add("generated-video");
  videoElement.controls = true;
  videoElement.playsInline = true;
  videoElement.preload = "metadata";

  const caption = document.createElement("figcaption");
  caption.textContent = `Generated from: ${prompt}`;

  const actions = createMediaActions(
    videoElement.currentSrc || videoElement.src,
    "galaxy-video.mp4",
    "video"
  );

  mediaCard.append(videoElement, caption, actions);
  rendered.contentElement.appendChild(mediaCard);

  elements.messages.appendChild(rendered.wrapper);

  addMessageToActiveChat({
    role: "assistant",
    type: "text",
    content:
      "I generated a video for your request. Generated media is not stored in browser chat history."
  });

  scrollMessagesToBottom();

  videoElement.play().catch(() => {
    // Autoplay may be blocked. Controls remain available.
  });
}


function createMediaActions(source, filename, mediaType) {
  const actions = document.createElement("div");
  actions.className = "media-actions";

  const download = document.createElement("a");
  download.className = "media-action-button";
  download.href = source;
  download.download = filename;
  download.target = "_blank";
  download.rel = "noopener";
  download.textContent =
    mediaType === "video" ? "Save video" : "Save image";

  actions.appendChild(download);

  return actions;
}


/* =========================================================
   8. CLOCK, DATE AND GREETING
   ========================================================= */

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  if (hour < 21) {
    return "Good evening";
  }

  return "Good night";
}


function updateClock() {
  const now = new Date();

  elements.liveTime.textContent =
    new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(now);

  elements.liveDate.textContent =
    new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(now);

  const currentGreeting =
    document.getElementById("greetingText");

  if (currentGreeting) {
    currentGreeting.textContent = getGreeting();
  }
}


/* =========================================================
   9. WEATHER
   ========================================================= */

const weatherCodeMap = {
  0: {
    description: "Clear sky",
    icon: "☀️",
    theme: "sunny"
  },
  1: {
    description: "Mostly clear",
    icon: "🌤️",
    theme: "sunny"
  },
  2: {
    description: "Partly cloudy",
    icon: "⛅",
    theme: "cloudy"
  },
  3: {
    description: "Overcast",
    icon: "☁️",
    theme: "cloudy"
  },
  45: {
    description: "Foggy",
    icon: "🌫️",
    theme: "fog"
  },
  48: {
    description: "Icy fog",
    icon: "🌫️",
    theme: "fog"
  },
  51: {
    description: "Light drizzle",
    icon: "🌦️",
    theme: "rain"
  },
  53: {
    description: "Drizzle",
    icon: "🌦️",
    theme: "rain"
  },
  55: {
    description: "Heavy drizzle",
    icon: "🌧️",
    theme: "rain"
  },
  61: {
    description: "Light rain",
    icon: "🌧️",
    theme: "rain"
  },
  63: {
    description: "Rain",
    icon: "🌧️",
    theme: "rain"
  },
  65: {
    description: "Heavy rain",
    icon: "🌧️",
    theme: "rain"
  },
  71: {
    description: "Light snow",
    icon: "🌨️",
    theme: "snow"
  },
  73: {
    description: "Snow",
    icon: "❄️",
    theme: "snow"
  },
  75: {
    description: "Heavy snow",
    icon: "❄️",
    theme: "snow"
  },
  77: {
    description: "Snow grains",
    icon: "❄️",
    theme: "snow"
  },
  80: {
    description: "Rain showers",
    icon: "🌦️",
    theme: "rain"
  },
  81: {
    description: "Rain showers",
    icon: "🌧️",
    theme: "rain"
  },
  82: {
    description: "Heavy showers",
    icon: "⛈️",
    theme: "storm"
  },
  85: {
    description: "Snow showers",
    icon: "🌨️",
    theme: "snow"
  },
  86: {
    description: "Heavy snow showers",
    icon: "❄️",
    theme: "snow"
  },
  95: {
    description: "Thunderstorm",
    icon: "⛈️",
    theme: "storm"
  },
  96: {
    description: "Thunderstorm with hail",
    icon: "⛈️",
    theme: "storm"
  },
  99: {
    description: "Severe thunderstorm",
    icon: "⛈️",
    theme: "storm"
  }
};


function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          "Location is not supported by this browser."
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10 * 60 * 1000
      }
    );
  });
}


async function enableWeather() {
  elements.enableWeatherButton.disabled = true;
  elements.enableWeatherButton.textContent = "Locating...";

  try {
    const position = await requestCurrentPosition();

    state.settings.weatherEnabled = true;
    saveSettings();

    await fetchWeather(
      position.coords.latitude,
      position.coords.longitude
    );

    elements.enableWeatherButton.textContent = "Enabled";
    showToast("Live weather enabled.", "success");
  } catch (error) {
    console.error(error);

    state.settings.weatherEnabled = false;
    saveSettings();

    elements.enableWeatherButton.textContent = "Enable";
    showToast(
      "Location permission was not available.",
      "error"
    );
  } finally {
    elements.enableWeatherButton.disabled = false;
  }
}


async function fetchWeather(latitude, longitude) {
  const parameters = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    timezone: "auto"
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${parameters}`
  );

  if (!response.ok) {
    throw new Error(
      `Weather request failed with status ${response.status}.`
    );
  }

  const data = await response.json();
  const current = data.current;

  if (!current) {
    throw new Error("Weather information was unavailable.");
  }

  const details =
    weatherCodeMap[current.weather_code] ||
    {
      description: "Current conditions",
      icon: "🌡️",
      theme: "space"
    };

  state.weather = {
    temperature: Math.round(current.temperature_2m),
    apparentTemperature:
      Math.round(current.apparent_temperature),
    windSpeed: Math.round(current.wind_speed_10m),
    description: details.description,
    icon: details.icon,
    theme: details.theme,
    isDay: Boolean(current.is_day)
  };

  elements.weatherIcon.textContent = details.icon;
  elements.weatherTemperature.textContent =
    `${state.weather.temperature}°C`;

  elements.weatherDescription.textContent =
    `${details.description} · Feels ${state.weather.apparentTemperature}°`;

  renderWeatherEffects(details.theme);
}


async function restoreWeatherIfEnabled() {
  if (!state.settings.weatherEnabled) {
    return;
  }

  try {
    elements.enableWeatherButton.textContent = "Enabled";

    const position = await requestCurrentPosition();

    await fetchWeather(
      position.coords.latitude,
      position.coords.longitude
    );
  } catch (error) {
    console.warn(
      "Could not restore live weather:",
      error
    );

    elements.weatherDescription.textContent =
      "Select Enable in settings";
  }
}


function renderWeatherEffects(theme) {
  if (!state.settings.effectsEnabled) {
    elements.weatherEffects.innerHTML = "";
    return;
  }

  elements.weatherEffects.innerHTML = "";
  elements.weatherEffects.className =
    `weather-effects weather-${theme}`;

  if (theme === "rain" || theme === "storm") {
    for (let index = 0; index < 80; index += 1) {
      const drop = document.createElement("span");
      drop.className = "rain-drop";
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDelay =
        `${Math.random() * -2}s`;
      drop.style.animationDuration =
        `${0.6 + Math.random() * 0.7}s`;

      elements.weatherEffects.appendChild(drop);
    }
  }

  if (theme === "snow") {
    for (let index = 0; index < 55; index += 1) {
      const flake = document.createElement("span");
      flake.className = "snow-flake";
      flake.textContent = "❄";
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.fontSize =
        `${7 + Math.random() * 13}px`;
      flake.style.animationDelay =
        `${Math.random() * -10}s`;
      flake.style.animationDuration =
        `${5 + Math.random() * 8}s`;

      elements.weatherEffects.appendChild(flake);
    }
  }

  if (theme === "fog") {
    for (let index = 0; index < 5; index += 1) {
      const fog = document.createElement("span");
      fog.className = "fog-layer";
      fog.style.top = `${15 + index * 15}%`;
      fog.style.animationDelay = `${index * -3}s`;

      elements.weatherEffects.appendChild(fog);
    }
  }

  if (theme === "storm") {
    const lightning = document.createElement("span");
    lightning.className = "lightning-flash";
    elements.weatherEffects.appendChild(lightning);
  }
}


/* =========================================================
   10. MEDIA USAGE LIMITS
   ========================================================= */

function getMediaUsage() {
  const stored = safeJSONParse(
    localStorage.getItem(CONFIG.storageKeys.mediaUsage),
    null
  );

  const today = getTodayKey();

  if (!stored || stored.date !== today) {
    const newUsage = {
      date: today,
      images: 0,
      videos: 0
    };

    localStorage.setItem(
      CONFIG.storageKeys.mediaUsage,
      JSON.stringify(newUsage)
    );

    return newUsage;
  }

  return stored;
}


function saveMediaUsage(usage) {
  localStorage.setItem(
    CONFIG.storageKeys.mediaUsage,
    JSON.stringify(usage)
  );
}


function canGenerateMedia(type) {
  const usage = getMediaUsage();

  if (
    type === "image" &&
    usage.images >= CONFIG.limits.imagesPerDay
  ) {
    return {
      allowed: false,
      remaining: 0
    };
  }

  if (
    type === "video" &&
    usage.videos >= CONFIG.limits.videosPerDay
  ) {
    return {
      allowed: false,
      remaining: 0
    };
  }

  const limit =
    type === "image"
      ? CONFIG.limits.imagesPerDay
      : CONFIG.limits.videosPerDay;

  const used =
    type === "image"
      ? usage.images
      : usage.videos;

  return {
    allowed: true,
    remaining: limit - used
  };
}


function recordMediaGeneration(type) {
  const usage = getMediaUsage();

  if (type === "image") {
    usage.images += 1;
  }

  if (type === "video") {
    usage.videos += 1;
  }

  saveMediaUsage(usage);
}


/* =========================================================
   11. ATTACHMENTS: PASTE AND DRAG-AND-DROP
   ========================================================= */

function setupAttachmentSystem() {
  const fileInput = document.createElement("input");

  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.multiple = true;
  fileInput.hidden = true;
  fileInput.id = "galaxyHiddenFileInput";

  fileInput.addEventListener("change", async event => {
    await addAttachmentFiles(
      Array.from(event.target.files || [])
    );

    fileInput.value = "";
  });

  document.body.appendChild(fileInput);
  state.hiddenFileInput = fileInput;

  const tray = document.createElement("div");
  tray.id = "attachmentTray";
  tray.className = "attachment-tray hidden";

  elements.composerShell.parentElement.insertBefore(
    tray,
    elements.composerShell
  );

  state.attachmentTray = tray;

  elements.composerShell.addEventListener(
    "dragover",
    event => {
      event.preventDefault();
      elements.composerShell.classList.add("drag-active");
    }
  );

  elements.composerShell.addEventListener(
    "dragleave",
    event => {
      if (
        !elements.composerShell.contains(
          event.relatedTarget
        )
      ) {
        elements.composerShell.classList.remove(
          "drag-active"
        );
      }
    }
  );

  elements.composerShell.addEventListener(
    "drop",
    async event => {
      event.preventDefault();

      elements.composerShell.classList.remove(
        "drag-active"
      );

      const files = Array.from(
        event.dataTransfer?.files || []
      ).filter(file =>
        file.type.startsWith("image/")
      );

      await addAttachmentFiles(files);
    }
  );

  elements.messageInput.addEventListener(
    "paste",
    async event => {
      const files = Array.from(
        event.clipboardData?.items || []
      )
        .filter(item => item.type.startsWith("image/"))
        .map(item => item.getAsFile())
        .filter(Boolean);

      if (files.length > 0) {
        event.preventDefault();
        await addAttachmentFiles(files);
      }
    }
  );
}


async function addAttachmentFiles(files) {
  if (!files.length) {
    return;
  }

  const availableSlots =
    CONFIG.limits.maximumAttachments -
    state.attachments.length;

  if (availableSlots <= 0) {
    showToast(
      `You can attach up to ${CONFIG.limits.maximumAttachments} images.`,
      "error"
    );
    return;
  }

  for (const file of files.slice(0, availableSlots)) {
    if (!file.type.startsWith("image/")) {
      continue;
    }

    const maximumBytes =
      CONFIG.limits.maximumAttachmentSizeMB *
      1024 *
      1024;

    if (file.size > maximumBytes) {
      showToast(
        `${file.name} is larger than ${CONFIG.limits.maximumAttachmentSizeMB} MB.`,
        "error"
      );
      continue;
    }

    const dataUrl = await fileToDataURL(file);

    state.attachments.push({
      id: createId("attachment"),
      file,
      name: file.name || "pasted-image.png",
      dataUrl
    });
  }

  renderAttachmentTray();

  showToast(
    "Image attached. Type what Galaxy should create.",
    "success"
  );
}


function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("Could not read the image."));

    reader.readAsDataURL(file);
  });
}


function dataURLToRawBase64(dataUrl) {
  return String(dataUrl).split(",")[1] || dataUrl;
}


function renderAttachmentTray() {
  const tray = state.attachmentTray;

  if (!tray) {
    return;
  }

  tray.innerHTML = "";

  if (state.attachments.length === 0) {
    tray.classList.add("hidden");
    return;
  }

  tray.classList.remove("hidden");

  for (const attachment of state.attachments) {
    const preview = document.createElement("div");
    preview.className = "attachment-preview";

    const image = document.createElement("img");
    image.src = attachment.dataUrl;
    image.alt = attachment.name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-attachment";
    remove.setAttribute(
      "aria-label",
      `Remove ${attachment.name}`
    );
    remove.textContent = "×";

    remove.addEventListener("click", () => {
      state.attachments =
        state.attachments.filter(
          item => item.id !== attachment.id
        );

      renderAttachmentTray();
    });

    preview.append(image, remove);
    tray.appendChild(preview);
  }

  const instruction = document.createElement("p");
  instruction.className = "attachment-instruction";
  instruction.textContent =
    "Images attached — type “animate these photos…” or an image-editing request.";

  tray.appendChild(instruction);
}


function clearAttachments() {
  state.attachments = [];
  renderAttachmentTray();
}


/* =========================================================
   12. INTENT DETECTION
   ========================================================= */

const videoIntentPatterns = [
  /\bcreate\s+(?:a\s+)?video\b/i,
  /\bgenerate\s+(?:a\s+)?video\b/i,
  /\bmake\s+(?:a\s+)?video\b/i,
  /\bproduce\s+(?:a\s+)?video\b/i,
  /\btext[\s-]*to[\s-]*video\b/i,
  /\bimage[\s-]*to[\s-]*video\b/i,
  /\bphoto[\s-]*to[\s-]*video\b/i,
  /\banimate\s+(?:this|these|the|my)\s+(?:image|images|photo|photos|picture|pictures)\b/i,
  /\bturn\s+(?:this|these|the|my)\s+(?:image|images|photo|photos|picture|pictures)\s+into\s+(?:a\s+)?video\b/i,
  /\bvideo\s+of\b/i,
  /\bcinematic\s+clip\b/i
];


const imageIntentPatterns = [
  /\bcreate\s+(?:an?\s+)?image\b/i,
  /\bgenerate\s+(?:an?\s+)?image\b/i,
  /\bmake\s+(?:an?\s+)?image\b/i,
  /\bcreate\s+(?:a\s+)?picture\b/i,
  /\bgenerate\s+(?:a\s+)?picture\b/i,
  /\bmake\s+(?:a\s+)?picture\b/i,
  /\bcreate\s+(?:a\s+)?photo\b/i,
  /\bgenerate\s+(?:a\s+)?photo\b/i,
  /\bdraw\s+(?:an?\s+)?\b/i,
  /\bdesign\s+(?:an?\s+)?image\b/i,
  /\bedit\s+(?:this|these|the|my)\s+(?:image|images|photo|photos|picture|pictures)\b/i,
  /\bchange\s+(?:this|these|the|my)\s+(?:image|images|photo|photos|picture|pictures)\b/i
];


function detectIntent(prompt) {
  if (
    videoIntentPatterns.some(pattern =>
      pattern.test(prompt)
    )
  ) {
    return "video";
  }

  if (
    imageIntentPatterns.some(pattern =>
      pattern.test(prompt)
    )
  ) {
    return "image";
  }

  return "chat";
}


/* =========================================================
   13. AI CHAT
   ========================================================= */

function buildChatContext(prompt) {
  const chat = getActiveChat();

  const previousMessages = chat.messages
    .filter(message => message.type === "text")
    .slice(-CONFIG.maximumContextMessages)
    .map(message => ({
      role:
        message.role === "assistant"
          ? "assistant"
          : "user",
      content: message.content
    }));

  const weatherContext = state.weather
    ? `Current live weather shown in the interface: ${state.weather.temperature}°C, ${state.weather.description}, feels like ${state.weather.apparentTemperature}°C, wind ${state.weather.windSpeed} km/h.`
    : "Live weather is not currently available.";

  return [
    {
      role: "system",
      content: `
You are Galaxy, a futuristic, friendly and highly capable AI assistant created by Harshavrdhan.

Behavior:
- Answer clearly and naturally.
- Be useful rather than overly verbose.
- Never claim a generated image or video has been created unless the interface actually created it.
- The application has separate automatic image and video generation systems.
- The user's local date and time are available from their browser.
- ${weatherContext}
- When the user requests current live information that you cannot verify, state that limitation honestly.
      `.trim()
    },
    ...previousMessages,
    {
      role: "user",
      content: prompt
    }
  ];
}


function extractResponseText(response) {
  if (typeof response === "string") {
    return response;
  }

  if (typeof response?.text === "string") {
    return response.text;
  }

  if (typeof response?.message?.content === "string") {
    return response.message.content;
  }

  if (Array.isArray(response?.message?.content)) {
    return response.message.content
      .map(item => {
        if (typeof item === "string") {
          return item;
        }

        return item?.text || "";
      })
      .join("");
  }

  if (typeof response?.content === "string") {
    return response.content;
  }

  return "";
}


function extractStreamChunkText(chunk) {
  if (typeof chunk === "string") {
    return chunk;
  }

  return (
    chunk?.text ||
    chunk?.delta?.text ||
    chunk?.message?.content ||
    chunk?.choices?.[0]?.delta?.content ||
    ""
  );
}


async function generateChatResponse(prompt) {
  const loading = appendLoadingMessage();

  setAppStatus("thinking");

  try {
    const context = buildChatContext(prompt);

    const response = await puter.ai.chat(context, {
      model: CONFIG.chatModel,
      stream: true
    });

    loading.contentElement.innerHTML = "";
    loading.contentElement.classList.add(
      "streaming-response"
    );

    let fullText = "";

    if (
      response &&
      typeof response[Symbol.asyncIterator] === "function"
    ) {
      for await (const chunk of response) {
        const text = extractStreamChunkText(chunk);

        if (!text) {
          continue;
        }

        fullText += text;

        loading.contentElement.innerHTML =
          formatMessageText(fullText);

        scrollMessagesToBottom(false);
      }
    } else {
      fullText = extractResponseText(response);

      loading.contentElement.innerHTML =
        formatMessageText(fullText);
    }

    if (!fullText.trim()) {
      throw new Error(
        "Galaxy received an empty response."
      );
    }

    addMessageToActiveChat({
      role: "assistant",
      type: "text",
      content: fullText
    });

    applyThemeFromText(`${prompt} ${fullText}`);
    triggerPossibleEasterEgg(`${prompt} ${fullText}`);

    if (state.settings.speechEnabled) {
      speakText(fullText);
    } else {
      setAppStatus("ready");
    }
  } catch (error) {
    console.error("Chat generation error:", error);

    loading.wrapper.remove();

    const message = getFriendlyErrorMessage(
      error,
      "I couldn't complete that response."
    );

    appendTextMessage("assistant", message);
    setAppStatus("error");

    window.setTimeout(() => {
      setAppStatus("ready");
    }, 2500);
  }
}


/* =========================================================
   14. IMAGE GENERATION
   ========================================================= */

async function generateImage(prompt) {
  const permission = canGenerateMedia("image");

  if (!permission.allowed) {
    appendTextMessage(
      "assistant",
      `You have reached Galaxy’s browser limit of ${CONFIG.limits.imagesPerDay} images for today. The limit resets on your next local calendar day.`
    );

    return;
  }

  const loading = appendLoadingMessage(
    "Creating a high-quality image…"
  );

  setAppStatus("generating", "Creating image");

  try {
    const options = {
      provider: CONFIG.image.provider,
      model: CONFIG.image.model,
      quality: CONFIG.image.quality,
      ratio: CONFIG.image.ratio
    };

    if (state.attachments.length > 0) {
      options.input_images =
        state.attachments.map(
          attachment => attachment.dataUrl
        );
    }

    const generatedImage =
      await puter.ai.txt2img(prompt, options);

    loading.wrapper.remove();

    if (!(generatedImage instanceof HTMLImageElement)) {
      throw new Error(
        "The image service returned an unexpected result."
      );
    }

    recordMediaGeneration("image");
    appendImageMessage(generatedImage, prompt);

    clearAttachments();
    applyThemeFromText(prompt);
    setAppStatus("ready");
  } catch (error) {
    console.error("Image generation error:", error);

    loading.wrapper.remove();

    appendTextMessage(
      "assistant",
      getFriendlyErrorMessage(
        error,
        "I couldn't generate that image."
      )
    );

    setAppStatus("error");

    window.setTimeout(() => {
      setAppStatus("ready");
    }, 2500);
  }
}


/* =========================================================
   15. VIDEO GENERATION
   ========================================================= */

async function generateVideo(prompt) {
  const permission = canGenerateMedia("video");

  if (!permission.allowed) {
    appendTextMessage(
      "assistant",
      `You have reached Galaxy’s browser limit of ${CONFIG.limits.videosPerDay} videos for today. The limit resets on your next local calendar day.`
    );

    return;
  }

  const loading = appendLoadingMessage(
    "Creating your cinematic video. This can take several minutes, so keep this page open…"
  );

  setAppStatus("generating", "Creating video");

  try {
    const options = {
      model: CONFIG.video.model,
      seconds: CONFIG.video.seconds,
      size: CONFIG.video.size,
      negative_prompt: CONFIG.video.negativePrompt
    };

    if (state.attachments.length === 1) {
      options.input_reference =
        dataURLToRawBase64(
          state.attachments[0].dataUrl
        );
    }

    if (state.attachments.length > 1) {
      options.reference_images =
        state.attachments
          .slice(0, 3)
          .map(attachment =>
            dataURLToRawBase64(attachment.dataUrl)
          );
    }

    const generatedVideo =
      await puter.ai.txt2vid(prompt, options);

    loading.wrapper.remove();

    if (!(generatedVideo instanceof HTMLVideoElement)) {
      throw new Error(
        "The video service returned an unexpected result."
      );
    }

    recordMediaGeneration("video");
    appendVideoMessage(generatedVideo, prompt);

    clearAttachments();
    applyThemeFromText(prompt);
    setAppStatus("ready");
  } catch (error) {
    console.error("Video generation error:", error);

    loading.wrapper.remove();

    appendTextMessage(
      "assistant",
      getFriendlyErrorMessage(
        error,
        "I couldn't generate that video."
      )
    );

    setAppStatus("error");

    window.setTimeout(() => {
      setAppStatus("ready");
    }, 2500);
  }
}


/* =========================================================
   16. MESSAGE SUBMISSION
   ========================================================= */

async function submitMessage(
  suppliedPrompt = null,
  source = "text"
) {
  if (state.isGenerating) {
    showToast(
      "Galaxy is still working on the previous request.",
      "info"
    );
    return;
  }

  const prompt = String(
    suppliedPrompt ?? elements.messageInput.value
  ).trim();

  if (!prompt) {
    if (state.attachments.length > 0) {
      showToast(
        "Type what Galaxy should do with the attached image.",
        "info"
      );
    }

    return;
  }

  state.isGenerating = true;
  elements.sendButton.disabled = true;
  elements.messageInput.disabled = true;

  if (suppliedPrompt === null) {
    elements.messageInput.value = "";
    autoResizeTextarea();
  }

  appendTextMessage("user", prompt);

  const intent = detectIntent(prompt);

  try {
    if (intent === "video") {
      await generateVideo(prompt);
    } else if (intent === "image") {
      await generateImage(prompt);
    } else {
      await generateChatResponse(prompt);
    }
  } finally {
    state.isGenerating = false;
    elements.sendButton.disabled = false;
    elements.messageInput.disabled = false;
    elements.messageInput.focus();

    if (
      source === "voice" &&
      state.settings.wakeWordEnabled
    ) {
      restartRecognitionSoon();
    }
  }
}


/* =========================================================
   17. VOICE SYNTHESIS
   ========================================================= */

function chooseSpeechVoice() {
  const voices =
    window.speechSynthesis?.getVoices() || [];

  if (!voices.length) {
    return;
  }

  const preferredNames = [
    "Google UK English Female",
    "Microsoft Sonia",
    "Microsoft Aria",
    "Samantha",
    "Google US English",
    "Microsoft Zira"
  ];

  state.speechVoice =
    voices.find(voice =>
      preferredNames.some(name =>
        voice.name.includes(name)
      )
    ) ||
    voices.find(voice =>
      voice.lang.toLowerCase().startsWith("en")
    ) ||
    voices[0];
}


function stripSpeechFormatting(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/https?:\/\/\S+/g, "link")
    .replace(/[*_#>`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function speakText(text) {
  if (
    !state.settings.speechEnabled ||
    !("speechSynthesis" in window)
  ) {
    setAppStatus("ready");
    return;
  }

  const cleaned = stripSpeechFormatting(text);

  if (!cleaned) {
    setAppStatus("ready");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(cleaned);

  utterance.voice = state.speechVoice;
  utterance.rate = 1;
  utterance.pitch = 1.02;
  utterance.volume = 1;

  utterance.onstart = () => {
    setAppStatus("speaking");
  };

  utterance.onend = () => {
    setAppStatus("ready");

    if (state.settings.wakeWordEnabled) {
      restartRecognitionSoon();
    }
  };

  utterance.onerror = () => {
    setAppStatus("ready");
  };

  window.speechSynthesis.speak(utterance);
}


function speakWakeAcknowledgement() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      "Yes, I'm listening."
    );

  utterance.voice = state.speechVoice;
  utterance.rate = 1;
  utterance.pitch = 1.05;

  window.speechSynthesis.speak(utterance);
}


/* =========================================================
   18. SPEECH RECOGNITION AND WAKE WORD
   ========================================================= */

function setupSpeechRecognition() {
  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!Recognition) {
    elements.wakeWordToggle.disabled = true;

    elements.voiceNoticeText.textContent =
      "Voice recognition is unavailable in this browser.";

    return;
  }

  const recognition = new Recognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang =
    navigator.language || "en-US";

  recognition.onstart = () => {
    state.isListening = true;

    if (state.settings.wakeWordEnabled) {
      elements.voiceNotice.classList.remove("hidden");
      elements.voiceNoticeText.textContent =
        state.awaitingVoiceCommand
          ? "Listening for your request…"
          : "Listening for “Galaxy”…";

      setAppStatus("listening");
    }
  };

  recognition.onresult = event => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (
      let index = event.resultIndex;
      index < event.results.length;
      index += 1
    ) {
      const transcript =
        event.results[index][0].transcript.trim();

      if (event.results[index].isFinal) {
        finalTranscript += ` ${transcript}`;
      } else {
        interimTranscript += ` ${transcript}`;
      }
    }

    const heard =
      `${finalTranscript} ${interimTranscript}`
        .trim();

    if (!heard) {
      return;
    }

    if (state.awaitingVoiceCommand) {
      elements.voiceNoticeText.textContent =
        heard;

      if (finalTranscript.trim()) {
        const command = finalTranscript.trim();

        state.awaitingVoiceCommand = false;
        recognition.stop();

        submitMessage(command, "voice");
      }

      return;
    }

    const wakeMatch = heard.match(
      /\bgalaxy\b[\s,]*(.*)/i
    );

    if (!wakeMatch) {
      return;
    }

    const commandAfterWakeWord =
      wakeMatch[1]?.trim() || "";

    if (commandAfterWakeWord) {
      state.awaitingVoiceCommand = false;
      recognition.stop();

      submitMessage(commandAfterWakeWord, "voice");
      return;
    }

    if (finalTranscript.trim()) {
      state.awaitingVoiceCommand = true;

      elements.voiceNoticeText.textContent =
        "Yes, I'm listening…";

      speakWakeAcknowledgement();
    }
  };

  recognition.onerror = event => {
    console.warn(
      "Speech recognition error:",
      event.error
    );

    if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {
      state.settings.wakeWordEnabled = false;
      elements.wakeWordToggle.checked = false;
      saveSettings();

      elements.voiceNotice.classList.add("hidden");

      showToast(
        "Microphone permission was not granted.",
        "error"
      );
    }

    setAppStatus("ready");
  };

  recognition.onend = () => {
    state.isListening = false;

    if (
      state.settings.wakeWordEnabled &&
      !state.isGenerating &&
      !window.speechSynthesis?.speaking
    ) {
      restartRecognitionSoon();
    } else if (!state.settings.wakeWordEnabled) {
      elements.voiceNotice.classList.add("hidden");
      setAppStatus("ready");
    }
  };

  state.recognition = recognition;
}


function startWakeWordListening() {
  if (!state.recognition) {
    showToast(
      "Voice recognition is unavailable in this browser.",
      "error"
    );

    state.settings.wakeWordEnabled = false;
    elements.wakeWordToggle.checked = false;
    saveSettings();

    return;
  }

  if (state.isListening) {
    return;
  }

  try {
    state.recognition.start();
  } catch (error) {
    console.warn(
      "Recognition could not start:",
      error
    );
  }
}


function stopWakeWordListening() {
  window.clearTimeout(
    state.recognitionRestartTimer
  );

  state.awaitingVoiceCommand = false;

  if (
    state.recognition &&
    state.isListening
  ) {
    try {
      state.recognition.stop();
    } catch {
      // Recognition may already be stopping.
    }
  }

  elements.voiceNotice.classList.add("hidden");
  setAppStatus("ready");
}


function restartRecognitionSoon() {
  window.clearTimeout(
    state.recognitionRestartTimer
  );

  if (!state.settings.wakeWordEnabled) {
    return;
  }

  state.recognitionRestartTimer =
    window.setTimeout(() => {
      startWakeWordListening();
    }, 900);
}


/* =========================================================
   19. TOPIC BACKGROUND ENGINE
   ========================================================= */

const themeRules = [
  {
    theme: "volcano",
    pattern:
      /\b(volcano|lava|magma|eruption|molten)\b/i
  },
  {
    theme: "ocean",
    pattern:
      /\b(ocean|sea|underwater|coral|whale|shark|beach|waves)\b/i
  },
  {
    theme: "rain",
    pattern:
      /\b(rain|rainy|storm clouds|monsoon|drizzle)\b/i
  },
  {
    theme: "snow",
    pattern:
      /\b(snow|snowy|winter|ice|frozen|blizzard|arctic)\b/i
  },
  {
    theme: "forest",
    pattern:
      /\b(forest|jungle|trees|nature|wildlife|garden)\b/i
  },
  {
    theme: "cyber",
    pattern:
      /\b(ai|artificial intelligence|robot|cyber|computer|coding|technology|digital|neural)\b/i
  },
  {
    theme: "horror",
    pattern:
      /\b(horror|ghost|haunted|scary|zombie|monster|nightmare)\b/i
  },
  {
    theme: "sunny",
    pattern:
      /\b(hot weather|heatwave|desert|sunny|sunshine|summer)\b/i
  },
  {
    theme: "space",
    pattern:
      /\b(space|galaxy|planet|star|moon|astronaut|universe|cosmos|nebula)\b/i
  }
];


function applyThemeFromText(text) {
  if (!state.settings.effectsEnabled) {
    setTheme("space");
    return;
  }

  const matchedRule = themeRules.find(rule =>
    rule.pattern.test(text)
  );

  setTheme(matchedRule?.theme || "space");
}


function setTheme(theme) {
  state.currentTheme = theme;

  const themes = [
    "space",
    "ocean",
    "rain",
    "snow",
    "forest",
    "volcano",
    "cyber",
    "horror",
    "sunny"
  ];

  for (const name of themes) {
    elements.body.classList.remove(
      `theme-${name}`
    );
  }

  elements.body.classList.add(
    `theme-${theme}`
  );

  elements.body.dataset.theme = theme;
}


/* =========================================================
   20. CANVAS GALAXY PARTICLES
   ========================================================= */

function setupCanvasBackground() {
  const canvas = elements.backgroundCanvas;

  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  function resizeCanvas() {
    const ratio =
      Math.min(window.devicePixelRatio || 1, 2);

    canvas.width =
      Math.floor(window.innerWidth * ratio);

    canvas.height =
      Math.floor(window.innerHeight * ratio);

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    context.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );

    createParticles();
  }

  function createParticles() {
    const count = Math.min(
      180,
      Math.floor(
        (window.innerWidth * window.innerHeight) /
          9000
      )
    );

    state.particles = Array.from(
      { length: count },
      () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: 0.3 + Math.random() * 1.6,
        speed: 0.05 + Math.random() * 0.25,
        opacity: 0.15 + Math.random() * 0.75,
        twinkle: Math.random() * Math.PI * 2
      })
    );
  }

  function animate(time = 0) {
    context.clearRect(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );

    if (state.settings.effectsEnabled) {
      for (const particle of state.particles) {
        particle.y -= particle.speed;

        if (particle.y < -5) {
          particle.y = window.innerHeight + 5;
          particle.x =
            Math.random() * window.innerWidth;
        }

        const pulse =
          0.45 +
          Math.sin(
            time * 0.0015 + particle.twinkle
          ) *
            0.3;

        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          particle.radius,
          0,
          Math.PI * 2
        );

        context.fillStyle =
          `rgba(220, 210, 255, ${
            particle.opacity * pulse
          })`;

        context.fill();
      }
    }

    state.animationFrameId =
      requestAnimationFrame(animate);
  }

  resizeCanvas();

  window.addEventListener(
    "resize",
    resizeCanvas
  );

  state.animationFrameId =
    requestAnimationFrame(animate);
}


/* =========================================================
   21. EASTER EGGS
   ========================================================= */

function triggerPossibleEasterEgg(text) {
  if (
    state.easterEggRunning ||
    !state.settings.effectsEnabled
  ) {
    return;
  }

  if (
    /\b(chicken|tandoori)\b/i.test(text)
  ) {
    runChickenEasterEgg();
    return;
  }

  if (
    /\b(dinosaur|t[- ]?rex|jurassic)\b/i.test(text)
  ) {
    runCharacterEasterEgg(
      elements.dinosaurCharacter,
      6500
    );

    return;
  }

  if (
    /\b(astronaut|spacewalk|zero gravity)\b/i.test(text)
  ) {
    runCharacterEasterEgg(
      elements.astronautCharacter,
      7500
    );
  }
}


function runChickenEasterEgg() {
  const character =
    elements.chickenCharacter;

  if (!character) {
    return;
  }

  state.easterEggRunning = true;

  character.classList.remove("hidden");
  character.classList.add("chicken-walk");

  window.setTimeout(() => {
    character.classList.add("become-tandoori");
  }, 4200);

  window.setTimeout(() => {
    character.classList.add("hidden");
    character.classList.remove(
      "chicken-walk",
      "become-tandoori"
    );

    state.easterEggRunning = false;
  }, 7000);
}


function runCharacterEasterEgg(
  character,
  duration
) {
  if (!character) {
    return;
  }

  state.easterEggRunning = true;

  character.classList.remove("hidden");
  character.classList.add("character-active");

  window.setTimeout(() => {
    character.classList.add("hidden");
    character.classList.remove(
      "character-active"
    );

    state.easterEggRunning = false;
  }, duration);
}


/* =========================================================
   22. INTRO, SIDEBAR AND SETTINGS
   ========================================================= */

function showGalaxyApp() {
  elements.introScreen.classList.add(
    "intro-exit"
  );

  window.setTimeout(() => {
    elements.introScreen.classList.add("hidden");
    elements.galaxyApp.classList.remove("hidden");

    localStorage.setItem(
      CONFIG.storageKeys.introSeen,
      "true"
    );

    elements.messageInput.focus();
  }, 650);
}


function initializeIntro() {
  const introSeen =
    localStorage.getItem(
      CONFIG.storageKeys.introSeen
    ) === "true";

  if (introSeen) {
    elements.introScreen.classList.add("hidden");
    elements.galaxyApp.classList.remove("hidden");
  }
}


function openSidebar() {
  elements.sidebar.classList.add("open");
  elements.sidebarOverlay.classList.add("visible");
  elements.body.classList.add("sidebar-open");
}


function closeSidebar() {
  elements.sidebar.classList.remove("open");
  elements.sidebarOverlay.classList.remove("visible");
  elements.body.classList.remove("sidebar-open");
}


function openSettings() {
  elements.settingsModal.classList.remove("hidden");
  elements.body.classList.add("modal-open");
}


function closeSettings() {
  elements.settingsModal.classList.add("hidden");
  elements.body.classList.remove("modal-open");
}


/* =========================================================
   23. ERROR HANDLING
   ========================================================= */

function getFriendlyErrorMessage(
  error,
  fallbackMessage
) {
  const rawMessage =
    error?.message ||
    String(error || "");

  const message = rawMessage.toLowerCase();

  if (
    message.includes("sign in") ||
    message.includes("signin") ||
    message.includes("authentication") ||
    message.includes("unauthorized")
  ) {
    return "Please sign in to Puter when prompted, then try again.";
  }

  if (
    message.includes("credit") ||
    message.includes("quota") ||
    message.includes("payment")
  ) {
    return "The selected AI service requires available Puter AI credits. Please check the Puter account and try again.";
  }

  if (
    message.includes("network") ||
    message.includes("fetch")
  ) {
    return "I couldn't reach the AI service. Check your internet connection and try again.";
  }

  if (
    message.includes("content") ||
    message.includes("safety") ||
    message.includes("policy")
  ) {
    return "That request could not be generated. Try changing the prompt.";
  }

  return `${fallbackMessage} ${
    rawMessage
      ? `Details: ${rawMessage}`
      : "Please try again."
  }`;
}


/* =========================================================
   24. EVENT BINDINGS
   ========================================================= */

function bindSuggestionCards() {
  const cards = document.querySelectorAll(
    ".suggestion-card[data-prompt]"
  );

  for (const card of cards) {
    card.addEventListener("click", () => {
      submitMessage(card.dataset.prompt);
    });
  }
}


function bindEvents() {
  elements.enterGalaxyButton?.addEventListener(
    "click",
    showGalaxyApp
  );

  elements.skipIntroButton?.addEventListener(
    "click",
    showGalaxyApp
  );

  elements.openSidebarButton?.addEventListener(
    "click",
    openSidebar
  );

  elements.closeSidebarButton?.addEventListener(
    "click",
    closeSidebar
  );

  elements.sidebarOverlay?.addEventListener(
    "click",
    closeSidebar
  );

  elements.newChatButton?.addEventListener(
    "click",
    () => createNewChat()
  );

  elements.clearChatsButton?.addEventListener(
    "click",
    clearAllChats
  );

  elements.settingsButton?.addEventListener(
    "click",
    openSettings
  );

  elements.closeSettingsButton?.addEventListener(
    "click",
    closeSettings
  );

  elements.modalBackdrop?.addEventListener(
    "click",
    closeSettings
  );

  elements.sendButton?.addEventListener(
    "click",
    () => submitMessage()
  );

  elements.messageInput?.addEventListener(
    "input",
    autoResizeTextarea
  );

  elements.messageInput?.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        submitMessage();
      }
    }
  );

  elements.speechToggle?.addEventListener(
    "change",
    event => {
      state.settings.speechEnabled =
        event.target.checked;

      saveSettings();

      if (!event.target.checked) {
        window.speechSynthesis?.cancel();
        setAppStatus("ready");
      }
    }
  );

  elements.wakeWordToggle?.addEventListener(
    "change",
    event => {
      state.settings.wakeWordEnabled =
        event.target.checked;

      saveSettings();

      if (event.target.checked) {
        startWakeWordListening();
      } else {
        stopWakeWordListening();
      }
    }
  );

  elements.effectsToggle?.addEventListener(
    "change",
    event => {
      state.settings.effectsEnabled =
        event.target.checked;

      saveSettings();

      if (event.target.checked) {
        setTheme(state.currentTheme);
        renderWeatherEffects(
          state.weather?.theme || "space"
        );
      } else {
        setTheme("space");
        elements.weatherEffects.innerHTML = "";
      }
    }
  );

  elements.enableWeatherButton?.addEventListener(
    "click",
    enableWeather
  );

  elements.deleteHistoryButton?.addEventListener(
    "click",
    () => {
      clearAllChats();
      closeSettings();
    }
  );

  elements.weatherCard?.addEventListener(
    "click",
    () => {
      if (state.weather) {
        const message =
          `${state.weather.temperature}°C, ` +
          `${state.weather.description}. ` +
          `Feels like ${state.weather.apparentTemperature}°C ` +
          `with wind at ${state.weather.windSpeed} km/h.`;

        showToast(message, "info", 5000);
      } else {
        openSettings();
      }
    }
  );

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeSidebar();
      closeSettings();
    }
  });

  window.addEventListener("beforeunload", () => {
    window.speechSynthesis?.cancel();

    if (state.recognition && state.isListening) {
      try {
        state.recognition.stop();
      } catch {
        // Ignore browser shutdown errors.
      }
    }

    if (state.animationFrameId) {
      cancelAnimationFrame(
        state.animationFrameId
      );
    }
  });
}


/* =========================================================
   25. INITIALIZATION
   ========================================================= */

async function initializeGalaxy() {
  loadStoredState();
  initializeIntro();

  if (!state.activeChatId) {
    createNewChat(false);
  }

  renderRecentChats();
  renderActiveChat();

  updateClock();
  window.setInterval(updateClock, 1000);

  setupCanvasBackground();
  setupAttachmentSystem();

  setupSpeechRecognition();
  chooseSpeechVoice();

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged =
      chooseSpeechVoice;
  }

  bindEvents();
  bindSuggestionCards();

  setTheme("space");
  setAppStatus("ready");

  await restoreWeatherIfEnabled();

  if (state.settings.wakeWordEnabled) {
    /*
      Microphone access normally requires a user action.
      We wait until the first click/touch before starting.
    */
    const startVoiceAfterInteraction = () => {
      startWakeWordListening();

      document.removeEventListener(
        "click",
        startVoiceAfterInteraction
      );

      document.removeEventListener(
        "touchstart",
        startVoiceAfterInteraction
      );
    };

    document.addEventListener(
      "click",
      startVoiceAfterInteraction,
      {
        once: true
      }
    );

    document.addEventListener(
      "touchstart",
      startVoiceAfterInteraction,
      {
        once: true
      }
    );
  }

  console.info(
    `${CONFIG.appName} AI Assistant initialized.`
  );
}


document.addEventListener(
  "DOMContentLoaded",
 document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("introScreen");
  const app = document.getElementById("galaxyApp");

  setTimeout(() => {
    intro.classList.add("intro-exit");

    if (app) {
      app.classList.remove("hidden");
    }

    setTimeout(() => {
      intro.style.display = "none";
    }, 700);
  }, 6500);
});
);
document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("galaxyIntro");

  if (!intro) {
    console.error("galaxyIntro was not found");
    return;
  }

  setTimeout(() => {
    intro.style.transition = "opacity 1s ease";
    intro.style.opacity = "0";
    intro.style.pointerEvents = "none";

    setTimeout(() => {
      intro.remove();
    }, 1000);
  }, 6500);
});
