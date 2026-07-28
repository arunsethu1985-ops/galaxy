"use strict";

/* =========================
   GALAXY — FRESH SCRIPT.JS
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("introScreen");
  const app = document.getElementById("galaxyApp");

  const enterButton =
    document.getElementById("enterGalaxyButton");

  const skipButton =
    document.getElementById("skipIntroButton");

  const messageInput =
    document.getElementById("messageInput");

  const sendButton =
    document.getElementById("sendButton");

  const messages =
    document.getElementById("messages");

  const chatArea =
    document.getElementById("chatArea");

  const liveTime =
    document.getElementById("liveTime");

  const liveDate =
    document.getElementById("liveDate");

  const openSidebarButton =
    document.getElementById("openSidebarButton");

  const closeSidebarButton =
    document.getElementById("closeSidebarButton");

  const sidebar =
    document.getElementById("sidebar");

  const sidebarOverlay =
    document.getElementById("sidebarOverlay");

  const settingsButton =
    document.getElementById("settingsButton");

  const settingsModal =
    document.getElementById("settingsModal");

  const closeSettingsButton =
    document.getElementById("closeSettingsButton");

  let generating = false;

  /* =========================
     INTRO
     ========================= */

  function openGalaxy() {
    if (intro) {
      intro.style.transition = "opacity 0.8s ease";
      intro.style.opacity = "0";
      intro.style.pointerEvents = "none";

      setTimeout(() => {
        intro.style.display = "none";
      }, 800);
    }

    if (app) {
      app.classList.remove("hidden");
      app.style.display = "";
    }

    setTimeout(() => {
      messageInput?.focus();
    }, 850);
  }

  enterButton?.addEventListener("click", openGalaxy);
  skipButton?.addEventListener("click", openGalaxy);

  // Automatically remove intro after 6.5 seconds
  setTimeout(openGalaxy, 6500);

  /* =========================
     CLOCK
     ========================= */

  function updateClock() {
    const now = new Date();

    if (liveTime) {
      liveTime.textContent =
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
    }

    if (liveDate) {
      liveDate.textContent =
        now.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric"
        });
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  /* =========================
     SIDEBAR
     ========================= */

  function openSidebar() {
    sidebar?.classList.add("open");
    sidebarOverlay?.classList.add("visible");
  }

  function closeSidebar() {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("visible");
  }

  openSidebarButton?.addEventListener(
    "click",
    openSidebar
  );

  closeSidebarButton?.addEventListener(
    "click",
    closeSidebar
  );

  sidebarOverlay?.addEventListener(
    "click",
    closeSidebar
  );

  /* =========================
     SETTINGS
     ========================= */

  function openSettings() {
    settingsModal?.classList.remove("hidden");
  }

  function closeSettings() {
    settingsModal?.classList.add("hidden");
  }

  settingsButton?.addEventListener(
    "click",
    openSettings
  );

  closeSettingsButton?.addEventListener(
    "click",
    closeSettings
  );

  /* =========================
     MESSAGE HELPERS
     ========================= */

  function escapeHTML(text = "") {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (chatArea) {
        chatArea.scrollTop =
          chatArea.scrollHeight;
      }
    });
  }

  function removeWelcomeScreen() {
    document
      .querySelector(".welcome-screen")
      ?.remove();
  }

  function addMessage(role, text) {
    if (!messages) return null;

    removeWelcomeScreen();

    const message =
      document.createElement("article");

    message.className =
      `message message-${role}`;

    const avatar =
      document.createElement("div");

    avatar.className = "message-avatar";
    avatar.textContent =
      role === "assistant" ? "G" : "You";

    const body =
      document.createElement("div");

    body.className = "message-body";

    const name =
      document.createElement("div");

    name.className = "message-name";
    name.textContent =
      role === "assistant"
        ? "Galaxy"
        : "You";

    const content =
      document.createElement("div");

    content.className = "message-content";
    content.innerHTML =
      escapeHTML(text).replace(/\n/g, "<br>");

    body.append(name, content);
    message.append(avatar, body);
    messages.appendChild(message);

    scrollToBottom();

    return content;
  }

  function addLoadingMessage() {
    const content = addMessage(
      "assistant",
      "Thinking..."
    );

    if (content) {
      content.innerHTML = `
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
    }

    return content;
  }

  /* =========================
     PUTER AI CHAT
     ========================= */

  async function sendMessage() {
    if (generating || !messageInput) return;

    const prompt =
      messageInput.value.trim();

    if (!prompt) return;

    generating = true;

    messageInput.value = "";
    messageInput.disabled = true;

    if (sendButton) {
      sendButton.disabled = true;
    }

    addMessage("user", prompt);

    const loading =
      addLoadingMessage();

    try {
      if (
        typeof puter === "undefined" ||
        !puter.ai
      ) {
        throw new Error(
          "Puter.js is not loaded."
        );
      }

      const response =
        await puter.ai.chat(
          [
            {
              role: "system",
              content:
                "You are Galaxy, a friendly and helpful AI assistant created by Harshavardhan."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          {
            model: "gpt-5.4-nano"
          }
        );

      let answer = "";

      if (typeof response === "string") {
        answer = response;
      } else if (
        typeof response?.message?.content ===
        "string"
      ) {
        answer = response.message.content;
      } else if (
        typeof response?.text === "string"
      ) {
        answer = response.text;
      } else {
        answer =
          "I received a response, but could not read it.";
      }

      if (loading) {
        loading.innerHTML =
          escapeHTML(answer).replace(
            /\n/g,
            "<br>"
          );
      }
    } catch (error) {
      console.error(error);

      if (loading) {
        loading.textContent =
          "Galaxy could not connect. Make sure Puter.js is included in index.html.";
      }
    } finally {
      generating = false;

      messageInput.disabled = false;

      if (sendButton) {
        sendButton.disabled = false;
      }

      messageInput.focus();
      scrollToBottom();
    }
  }

  sendButton?.addEventListener(
    "click",
    sendMessage
  );

  messageInput?.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendMessage();
      }
    }
  );

  /* =========================
     ESCAPE KEY
     ========================= */

  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        closeSidebar();
        closeSettings();
      }
    }
  );

  console.log("Galaxy initialized successfully.");
});
