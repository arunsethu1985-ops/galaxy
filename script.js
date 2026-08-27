"use strict";

/* =========================================================
   GALAXY AI — COMPLETE FRONT-END CONTROLLER
   Clean replacement script
   ========================================================= */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

const on = (target, type, handler, options) => {
  if (target) {
    target.addEventListener(type, handler, options);
  }
};

const uid = prefix =>
  `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;

const now = () => Date.now();

const sleep = ms =>
  new Promise(resolve =>
    setTimeout(resolve, ms)
  );

const escapeHTML = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    ch =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[ch]
  );


/* =========================================================
   LOCAL DATABASE
   ========================================================= */

const DB = {

  prefix: "galaxy.ai.",

  key(name) {
    return `${this.prefix}${name}`;
  },

  get(name, fallback = null) {

    try {

      const raw =
        localStorage.getItem(
          this.key(name)
        );

      return raw === null
        ? fallback
        : JSON.parse(raw);

    } catch (error) {

      console.error(
        "GALAXY DB GET ERROR",
        name,
        error
      );

      return fallback;
    }

  },

  set(name, value) {

    try {

      localStorage.setItem(
        this.key(name),
        JSON.stringify(value)
      );

      return true;

    } catch (error) {

      console.error(
        "GALAXY DB SET ERROR",
        name,
        error
      );

      return false;
    }

  },

  remove(name) {

    try {

      localStorage.removeItem(
        this.key(name)
      );

    } catch (error) {

      console.error(
        "GALAXY DB REMOVE ERROR",
        name,
        error
      );

    }

  },

  clear() {

    Object.keys(localStorage)
      .filter(
        key =>
          key.startsWith(this.prefix)
      )
      .forEach(
        key =>
          localStorage.removeItem(key)
      );

  }

};


/* =========================================================
   SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {

  theme: "dark",

  accent: "violet",

  focusMode: false,

  enterToSend: true,

  autosave: true,

  autosaveDelay: 300,

  streaming: true,

  streamSpeed: 10,

  showTimestamps: false,

  voiceLanguage: "en-US",

  confirmDeletes: true,

  webSearchDefault: false

};


/* =========================================================
   PACKS
   ========================================================= */

const DEFAULT_PACKS = [

  {
    id: "pack_prompt",
    name: "Ultimate Prompt Pack",
    category: "prompt",
    icon: "✦",
    description:
      "Research, writing, analysis and planning prompts.",
    installed: true,
    featured: true,
    items: [
      "Deep Research",
      "Executive Summary",
      "Critical Thinking",
      "Decision Matrix",
      "Professional Rewrite",
      "Comparison Analysis",
      "Step-by-Step Planner"
    ]
  },

  {
    id: "pack_sites",
    name: "Website Builder Pack",
    category: "website",
    icon: "⌘",
    description:
      "Modern website creation workflows.",
    installed: true,
    featured: true,
    items: [
      "Landing Page",
      "Portfolio",
      "Business Site",
      "SaaS Site",
      "Dashboard",
      "Docs Site",
      "SEO Review",
      "Accessibility Review"
    ]
  },

  {
    id: "pack_creator",
    name: "Creator Power Pack",
    category: "creator",
    icon: "◫",
    description:
      "Content, video and campaign workflows.",
    installed: true,
    featured: true,
    items: [
      "YouTube Script",
      "Short Video Script",
      "Hook Generator",
      "Storyboard",
      "Voiceover",
      "Campaign Generator"
    ]
  },

  {
    id: "pack_productivity",
    name: "Productivity Pack",
    category: "productivity",
    icon: "✓",
    description:
      "Tasks, goals, meetings and planning.",
    installed: true,
    featured: false,
    items: [
      "Daily Planner",
      "Weekly Planner",
      "Meeting Summary",
      "Priority Matrix",
      "Goal Breakdown",
      "Risk Register"
    ]
  },

  {
    id: "pack_research",
    name: "Research Intelligence Pack",
    category: "research",
    icon: "⌕",
    description:
      "Advanced research and evidence workflows.",
    installed: true,
    featured: true,
    items: [
      "Research Question Builder",
      "Evidence Table",
      "Fact Verification",
      "Timeline Builder",
      "Market Research",
      "Competitor Research"
    ]
  },

  {
    id: "pack_developer",
    name: "Developer Pack",
    category: "developer",
    icon: "</>",
    description:
      "Coding, debugging and architecture workflows.",
    installed: true,
    featured: true,
    items: [
      "Code Generator",
      "Bug Finder",
      "Code Review",
      "Refactor",
      "API Design",
      "Database Design",
      "System Architecture"
    ]
  },

  {
    id: "pack_design",
    name: "Design System Pack",
    category: "design",
    icon: "◇",
    description:
      "UI systems, visual direction and UX review.",
    installed: true,
    featured: false,
    items: [
      "UI Audit",
      "UX Review",
      "Color System",
      "Typography",
      "Spacing",
      "Component Planner"
    ]
  },

  {
    id: "pack_video",
    name: "Video Creator Pack",
    category: "video",
    icon: "▷",
    description:
      "Video ideas, scenes, scripts and production plans.",
    installed: true,
    featured: false,
    items: [
      "30 Second Video",
      "Scene Generator",
      "Shot List",
      "Character Prompt",
      "Camera Prompt",
      "Lighting Prompt"
    ]
  },

  {
    id: "pack_startup",
    name: "Startup Launch Pack",
    category: "startup",
    icon: "↗",
    description:
      "Validate ideas and prepare go-to-market plans.",
    installed: true,
    featured: true,
    items: [
      "Idea Validator",
      "MVP Planner",
      "Feature Prioritizer",
      "Launch Checklist",
      "Pitch Outline",
      "Go-To-Market Plan"
    ]
  },

  {
    id: "pack_data",
    name: "Data Analysis Pack",
    category: "data",
    icon: "▦",
    description:
      "Analyze metrics, tables and structured data.",
    installed: true,
    featured: false,
    items: [
      "Dataset Summary",
      "Trend Detection",
      "Anomaly Detection",
      "KPI Builder",
      "Forecast Prompt",
      "CSV Analyzer"
    ]
  }

];


/* =========================================================
   PROMPT TEMPLATES
   ========================================================= */

const DEFAULT_PROMPTS = [

  {
    id: "p_site",
    title: "Build a modern website",
    category: "website",
    prompt:
      "Build a modern responsive website with excellent typography, spacing, accessibility and mobile behavior."
  },

  {
    id: "p_research",
    title: "Deep research",
    category: "research",
    prompt:
      "Research this topic deeply. Separate facts, assumptions, uncertainties, risks and conclusions."
  },

  {
    id: "p_project",
    title: "Project planner",
    category: "project",
    prompt:
      "Create a structured project plan with scope, milestones, tasks, owners, risks and next actions."
  },

  {
    id: "p_improve",
    title: "Improve my idea",
    category: "creative",
    prompt:
      "Analyze this idea, identify weaknesses and propose a much stronger version."
  },

  {
    id: "p_compare",
    title: "Compare options",
    category: "analysis",
    prompt:
      "Compare these options across cost, quality, risk, usability, scalability and long-term value."
  },

  {
    id: "p_video",
    title: "Video creator",
    category: "video",
    prompt:
      "Create a complete short-video plan with hook, scenes, dialogue, camera instructions and ending."
  },

  {
    id: "p_code",
    title: "Code builder",
    category: "developer",
    prompt:
      "Build production-quality code for this requirement. Keep the architecture clean and explain important tradeoffs."
  }

];


/* =========================================================
   PLUGINS
   ========================================================= */

const DEFAULT_PLUGINS = [

  {
    id: "plugin_mail",
    name: "Mail",
    description:
      "Search messages and draft replies.",
    icon: "✉",
    installed: false,
    connected: false
  },

  {
    id: "plugin_calendar",
    name: "Calendar",
    description:
      "Find events and manage meetings.",
    icon: "◷",
    installed: false,
    connected: false
  },

  {
    id: "plugin_drive",
    name: "Drive",
    description:
      "Find and work with cloud files.",
    icon: "▱",
    installed: false,
    connected: false
  },

  {
    id: "plugin_github",
    name: "GitHub",
    description:
      "Repositories and development workflows.",
    icon: "⌘",
    installed: false,
    connected: false
  },

  {
    id: "plugin_slack",
    name: "Slack",
    description:
      "Search channels and team conversations.",
    icon: "#",
    installed: false,
    connected: false
  }

];


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const Galaxy = {

  version: "4.0.0",

  state: {

    mode: "chat",

    view: "chat",

    settings: {
      ...DEFAULT_SETTINGS,
      ...DB.get("settings", {})
    },

    chats:
      DB.get("chats", []),

    currentChatId:
      DB.get("currentChatId", null),

    projects:
      DB.get("projects", []),

    library:
      DB.get("library", []),

    packs:
      DB.get("packs", []),

    scheduled:
      DB.get("scheduled", []),

    plugins:
      DB.get("plugins", []),

    agents:
      DB.get("agents", []),

    sites:
      DB.get("sites", []),

    images:
      DB.get("images", []),

    prompts:
      DB.get("prompts", []),

    notifications:
      DB.get("notifications", []),

    workDocuments:
      DB.get("workDocuments", []),

    activeWorkDocumentId:
      DB.get(
        "activeWorkDocumentId",
        null
      ),

    activeSiteId: null,

    activeLibraryFilter: "all",

    activePackFilter: "all",

    activeSearchFilter: "all",

    attachments: [],

    webSearchState:
      DB.get(
        "webSearchState",
        "off"
      ),

    voiceState: "idle",

    voiceRecognition: null,

    generation: {
      active: false,
      stopped: false,
      controller: null,
      messageId: null
    },

    dragCounter: 0

  }

};


/* =========================================================
   INITIAL DATA
   ========================================================= */

function seedData() {

  if (!Galaxy.state.packs.length) {
    Galaxy.state.packs =
      structuredClone(DEFAULT_PACKS);
  }

  if (!Galaxy.state.prompts.length) {
    Galaxy.state.prompts =
      structuredClone(DEFAULT_PROMPTS);
  }

  if (!Galaxy.state.plugins.length) {
    Galaxy.state.plugins =
      structuredClone(DEFAULT_PLUGINS);
  }

  persistAll();
}


/* =========================================================
   SAVE
   ========================================================= */

function persistAll() {

  DB.set(
    "settings",
    Galaxy.state.settings
  );

  DB.set(
    "chats",
    Galaxy.state.chats
  );

  DB.set(
    "currentChatId",
    Galaxy.state.currentChatId
  );

  DB.set(
    "projects",
    Galaxy.state.projects
  );

  DB.set(
    "library",
    Galaxy.state.library
  );

  DB.set(
    "packs",
    Galaxy.state.packs
  );

  DB.set(
    "scheduled",
    Galaxy.state.scheduled
  );

  DB.set(
    "plugins",
    Galaxy.state.plugins
  );

  DB.set(
    "agents",
    Galaxy.state.agents
  );

  DB.set(
    "sites",
    Galaxy.state.sites
  );

  DB.set(
    "images",
    Galaxy.state.images
  );

  DB.set(
    "prompts",
    Galaxy.state.prompts
  );

  DB.set(
    "notifications",
    Galaxy.state.notifications
  );

  DB.set(
    "workDocuments",
    Galaxy.state.workDocuments
  );

  DB.set(
    "activeWorkDocumentId",
    Galaxy.state.activeWorkDocumentId
  );

  DB.set(
    "webSearchState",
    Galaxy.state.webSearchState
  );

}


/* =========================================================
   TOASTS
   ========================================================= */

function toast(
  message,
  type = "default"
) {

  const root =
    $("#toastRoot");

  if (!root) {
    return;
  }

  const node =
    document.createElement("div");

  node.className =
    `toast toast-${type}`;

  node.textContent =
    message;

  root.appendChild(node);

  setTimeout(
    () =>
      node.classList.add(
        "toast-out"
      ),
    2200
  );

  setTimeout(
    () =>
      node.remove(),
    2600
  );

}


/* =========================================================
   ERRORS
   ========================================================= */

function handleError(
  error,
  context = "GALAXY AI"
) {

  console.error(
    `[${context}]`,
    error
  );

  toast(
    error?.message ||
      "Something went wrong.",
    "error"
  );

}


/* =========================================================
   MODALS
   ========================================================= */

function openModal({
  title,
  body,
  width = "680px"
}) {

  const root =
    $("#overlayRoot");

  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="overlay">

      <section
        class="modal"
        role="dialog"
        aria-modal="true"
        style="max-width:${width}"
      >

        <div class="modal-head">

          <strong>
            ${escapeHTML(title)}
          </strong>

          <button
            class="icon-btn"
            data-action="close-overlay"
            aria-label="Close"
          >
            ×
          </button>

        </div>

        <div class="modal-body">
          ${body}
        </div>

      </section>

    </div>
  `;

}


function closeOverlay() {

  const root =
    $("#overlayRoot");

  if (root) {
    root.innerHTML = "";
  }

}


/* =========================================================
   CONFIRM
   ========================================================= */

function confirmAction({
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Delete",
  onConfirm
}) {

  if (
    !Galaxy.state.settings
      .confirmDeletes
  ) {

    onConfirm?.();

    return;
  }

  openModal({

    title,

    body: `
      <div class="confirm-dialog">

        <p>
          ${escapeHTML(message)}
        </p>

        <div class="confirm-actions">

          <button
            class="text-action"
            data-action="close-overlay"
          >
            Cancel
          </button>

          <button
            class="text-action danger"
            id="confirmActionButton"
          >
            ${escapeHTML(confirmLabel)}
          </button>

        </div>

      </div>
    `

  });

  setTimeout(
    () => {

      on(
        $("#confirmActionButton"),
        "click",
        () => {

          closeOverlay();

          onConfirm?.();

        }
      );

    },
    0
  );

}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {

  const {
    theme,
    accent,
    focusMode
  } =
    Galaxy.state.settings;

  document.body
    .classList
    .toggle(
      "light",
      theme === "light"
    );

  document.body
    .classList
    .toggle(
      "dark",
      theme === "dark"
    );

  document.body
    .classList
    .toggle(
      "focus-mode",
      !!focusMode
    );

  document
    .documentElement
    .dataset
    .accent =
      accent;

}


function toggleTheme() {

  Galaxy.state.settings.theme =
    Galaxy.state.settings.theme ===
    "dark"
      ? "light"
      : "dark";

  persistAll();

  applyTheme();

}


function toggleFocusMode() {

  Galaxy.state.settings.focusMode =
    !Galaxy.state.settings.focusMode;

  persistAll();

  applyTheme();

  toast(
    Galaxy.state.settings.focusMode
      ? "Focus mode on"
      : "Focus mode off"
  );

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function addNotification(
  title,
  message,
  type = "info"
) {

  Galaxy.state.notifications.unshift({
    id:
      uid("notification"),

    title,

    message,

    type,

    read: false,

    createdAt:
      now()
  });

  Galaxy.state.notifications =
    Galaxy.state.notifications.slice(
      0,
      100
    );

  persistAll();

  updateNotificationIndicator();

}


function updateNotificationIndicator() {

  const unread =
    Galaxy.state.notifications
      .filter(
        item =>
          !item.read
      )
      .length;

  const button =
    $('[data-action="notifications"]');

  button?.classList.toggle(
    "has-notifications",
    unread > 0
  );

}


function openNotifications() {

  Galaxy.state.notifications
    .forEach(
      item =>
        item.read = true
    );

  persistAll();

  updateNotificationIndicator();

  openModal({

    title:
      "Notifications",

    body:
      Galaxy.state.notifications
        .length

        ? `
          <div class="notification-list">

            ${Galaxy.state.notifications
              .map(
                item => `
                <article class="notification-row">

                  <div class="notification-icon">
                    ${
                      item.type ===
                      "error"
                        ? "!"
                        : "◔"
                    }
                  </div>

                  <div class="notification-copy">

                    <strong>
                      ${escapeHTML(item.title)}
                    </strong>

                    <span>
                      ${escapeHTML(item.message)}
                    </span>

                  </div>

                </article>
              `
              )
              .join("")}

          </div>
        `

        : `
          <div class="empty-panel">
            No notifications yet.
          </div>
        `

  });

}


/* =========================================================
   SETTINGS UI
   ========================================================= */

function renderSettingToggle(
  title,
  key,
  value
) {

  return `
    <div class="setting-row">

      <div>
        <strong>
          ${escapeHTML(title)}
        </strong>
      </div>

      <button
        class="toggle-switch ${
          value
            ? "active"
            : ""
        }"
        data-setting-toggle="${escapeHTML(key)}"
        aria-pressed="${String(value)}"
      >
        <span></span>
      </button>

    </div>
  `;

}


function openSettings() {

  const s =
    Galaxy.state.settings;

  openModal({

    title:
      "Settings",

    body: `
      <div class="settings-list">

        <div class="setting-row">

          <strong>
            Theme
          </strong>

          <select
            data-setting-select="theme"
          >

            <option
              value="dark"
              ${
                s.theme ===
                "dark"
                  ? "selected"
                  : ""
              }
            >
              Dark
            </option>

            <option
              value="light"
              ${
                s.theme ===
                "light"
                  ? "selected"
                  : ""
              }
            >
              Light
            </option>

          </select>

        </div>

        <div class="setting-row">

          <strong>
            Accent
          </strong>

          <select
            data-setting-select="accent"
          >

            <option
              value="violet"
              ${
                s.accent ===
                "violet"
                  ? "selected"
                  : ""
              }
            >
              Violet
            </option>

            <option
              value="blue"
              ${
                s.accent ===
                "blue"
                  ? "selected"
                  : ""
              }
            >
              Blue
            </option>

            <option
              value="green"
              ${
                s.accent ===
                "green"
                  ? "selected"
                  : ""
              }
            >
              Green
            </option>

            <option
              value="orange"
              ${
                s.accent ===
                "orange"
                  ? "selected"
                  : ""
              }
            >
              Orange
            </option>

          </select>

        </div>

        ${renderSettingToggle(
          "Focus mode",
          "focusMode",
          s.focusMode
        )}

        ${renderSettingToggle(
          "Enter to send",
          "enterToSend",
          s.enterToSend
        )}

        ${renderSettingToggle(
          "Autosave",
          "autosave",
          s.autosave
        )}

        ${renderSettingToggle(
          "Streaming responses",
          "streaming",
          s.streaming
        )}

        ${renderSettingToggle(
          "Show timestamps",
          "showTimestamps",
          s.showTimestamps
        )}

        <div class="setting-row">

          <div>

            <strong>
              Reset GALAXY data
            </strong>

            <span>
              Remove locally saved workspace data.
            </span>

          </div>

          <button
            class="text-action danger"
            data-action="reset-data"
          >
            Reset
          </button>

        </div>

      </div>
    `

  });

}


/* =========================================================
   CHAT HELPERS
   ========================================================= */

function getCurrentChat() {

  return (
    Galaxy.state.chats
      .find(
        chat =>
          chat.id ===
          Galaxy.state.currentChatId
      ) ||
    null
  );

}


function createChat(
  title = "New conversation"
) {

  const chat = {

    id:
      uid("chat"),

    title,

    messages: [],

    pinned: false,

    archived: false,

    createdAt:
      now(),

    updatedAt:
      now(),

    branchOf: null

  };

  Galaxy.state.chats.unshift(
    chat
  );

  Galaxy.state.currentChatId =
    chat.id;

  persistAll();

  renderRecentChats();

  renderChat();

  return chat;

}


function ensureCurrentChat() {

  return (
    getCurrentChat() ||
    createChat()
  );

}


function newChat() {

  createChat();

  switchMode("chat");

  $("#promptInput")
    ?.focus();

}


/* =========================================================
   CHAT LIST
   ========================================================= */

function sortChats() {

  Galaxy.state.chats.sort(
    (a, b) => {

      if (
        a.pinned !==
        b.pinned
      ) {

        return a.pinned
          ? -1
          : 1;

      }

      return (
        b.updatedAt -
        a.updatedAt
      );

    }
  );

}


function renderRecentChats() {

  const root =
    $("#recentChats");

  if (!root) {
    return;
  }

  sortChats();

  root.innerHTML =
    Galaxy.state.chats

      .filter(
        chat =>
          !chat.archived
      )

      .slice(0, 40)

      .map(
        chat => `
          <div
            class="recent-chat-row ${
              chat.id ===
              Galaxy.state.currentChatId
                ? "active"
                : ""
            }"
            data-context-type="chat"
            data-context-id="${chat.id}"
          >

            <button
              class="recent-chat"
              data-chat-open="${chat.id}"
              title="${escapeHTML(chat.title)}"
            >

              ${
                chat.pinned
                  ? '<span class="pin-dot">•</span>'
                  : ""
              }

              <span>
                ${escapeHTML(chat.title)}
              </span>

            </button>

            <button
              class="recent-more"
              data-context-open="chat"
              data-context-id="${chat.id}"
              aria-label="More"
            >
              ⋯
            </button>

          </div>
        `
      )

      .join("");

}


/* =========================================================
   RENAME CHAT
   ========================================================= */

function renameChat(id) {

  const chat =
    Galaxy.state.chats.find(
      item =>
        item.id === id
    );

  if (!chat) {
    return;
  }

  openModal({

    title:
      "Rename chat",

    body: `
      <div class="form-stack">

        <input
          id="renameChatInput"
          class="field"
          value="${escapeHTML(chat.title)}"
        >

        <button
          id="renameChatSave"
          class="text-action primary"
        >
          Save
        </button>

      </div>
    `

  });

  setTimeout(
    () => {

      on(
        $("#renameChatSave"),
        "click",
        () => {

          const value =
            $("#renameChatInput")
              ?.value
              .trim();

          if (!value) {
            return;
          }

          chat.title =
            value;

          chat.updatedAt =
            now();

          persistAll();

          renderRecentChats();

          closeOverlay();

        }
      );

    },
    0
  );

}


/* =========================================================
   DELETE CHAT
   ========================================================= */

function deleteChat(id) {

  const chat =
    Galaxy.state.chats.find(
      item =>
        item.id === id
    );

  if (!chat) {
    return;
  }

  confirmAction({

    title:
      "Delete chat",

    message:
      `Delete “${chat.title}”?`,

    onConfirm() {

      Galaxy.state.chats =
        Galaxy.state.chats.filter(
          item =>
            item.id !== id
        );

      if (
        Galaxy.state.currentChatId ===
        id
      ) {

        Galaxy.state.currentChatId =
          Galaxy.state.chats[0]?.id ||
          null;

      }

      persistAll();

      renderRecentChats();

      renderChat();

    }

  });

}


/* =========================================================
   PIN / ARCHIVE
   ========================================================= */

function togglePinChat(id) {

  const chat =
    Galaxy.state.chats.find(
      item =>
        item.id === id
    );

  if (!chat) {
    return;
  }

  chat.pinned =
    !chat.pinned;

  chat.updatedAt =
    now();

  persistAll();

  renderRecentChats();

}


function toggleArchiveChat(id) {

  const chat =
    Galaxy.state.chats.find(
      item =>
        item.id === id
    );

  if (!chat) {
    return;
  }

  chat.archived =
    !chat.archived;

  chat.updatedAt =
    now();

  persistAll();

  renderRecentChats();

}


/* =========================================================
   BRANCH CONVERSATION
   ========================================================= */

function branchConversation(
  messageId
) {

  const source =
    getCurrentChat();

  if (!source) {
    return;
  }

  const index =
    source.messages
      .findIndex(
        message =>
          message.id ===
          messageId
      );

  if (index < 0) {
    return;
  }

  const chat = {

    id:
      uid("chat"),

    title:
      `${source.title} — Branch`,

    messages:
      structuredClone(
        source.messages.slice(
          0,
          index + 1
        )
      ),

    pinned: false,

    archived: false,

    createdAt:
      now(),

    updatedAt:
      now(),

    branchOf:
      source.id

  };

  Galaxy.state.chats.unshift(
    chat
  );

  Galaxy.state.currentChatId =
    chat.id;

  persistAll();

  renderRecentChats();

  renderChat();

}


/* =========================================================
   EXPORT / IMPORT
   ========================================================= */

function safeFilename(value) {

  return (
    String(value)
      .replace(
        /[^\w\- ]+/g,
        ""
      )
      .trim()
      .replace(
        /\s+/g,
        "_"
      )
      .slice(0, 80) ||
    "galaxy"
  );

}


function downloadText(
  filename,
  content,
  type = "text/plain"
) {

  const blob =
    new Blob(
      [content],
      { type }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download = filename;

  a.click();

  URL.revokeObjectURL(url);

}


function exportConversation(id) {

  const chat =
    Galaxy.state.chats.find(
      item =>
        item.id === id
    );

  if (!chat) {
    return;
  }

  downloadText(
    `${safeFilename(chat.title)}.galaxy.json`,
    JSON.stringify(
      {
        galaxyVersion:
          Galaxy.version,
        chat
      },
      null,
      2
    ),
    "application/json"
  );

}


function importConversation(file) {

  const reader =
    new FileReader();

  reader.onload =
    () => {

      try {

        const parsed =
          JSON.parse(
            reader.result
          );

        const imported =
          parsed.chat ||
          parsed;

        if (
          !Array.isArray(
            imported.messages
          )
        ) {

          throw new Error(
            "Invalid GALAXY conversation."
          );

        }

        imported.id =
          uid("chat");

        imported.title =
          imported.title ||
          "Imported conversation";

        imported.createdAt =
          now();

        imported.updatedAt =
          now();

        Galaxy.state.chats.unshift(
          imported
        );

        Galaxy.state.currentChatId =
          imported.id;

        persistAll();

        renderRecentChats();

        renderChat();

        toast(
          "Conversation imported"
        );

      } catch (error) {

        handleError(
          error,
          "Import conversation"
        );

      }

    };

  reader.readAsText(file);

}


/* =========================================================
   MARKDOWN RENDERER
   ========================================================= */

function renderMarkdown(input) {

  const codeBlocks = [];

  let text =
    String(input ?? "")
      .replace(
        /```([\w-]*)\n([\s\S]*?)```/g,
        (
          _,
          language,
          code
        ) => {

          const index =
            codeBlocks.length;

          codeBlocks.push({
            language:
              language ||
              "code",
            code
          });

          return `@@GALAXY_CODE_${index}@@`;

        }
      );

  text =
    escapeHTML(text);

  text =
    text
      .replace(
        /^### (.+)$/gm,
        "<h3>$1</h3>"
      )
      .replace(
        /^## (.+)$/gm,
        "<h2>$1</h2>"
      )
      .replace(
        /^# (.+)$/gm,
        "<h1>$1</h1>"
      )
      .replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
      )
      .replace(
        /\*([^*]+)\*/g,
        "<em>$1</em>"
      )
      .replace(
        /`([^`\n]+)`/g,
        '<code class="inline-code">$1</code>'
      )
      .replace(
        /^> (.+)$/gm,
        "<blockquote>$1</blockquote>"
      )
      .replace(
        /^- (.+)$/gm,
        '<div class="markdown-list-item">• $1</div>'
      )
      .replace(
        /^\d+\. (.+)$/gm,
        '<div class="markdown-list-item numbered">$1</div>'
      )
      .replace(
        /\n/g,
        "<br>"
      );

  codeBlocks.forEach(
    (block, index) => {

      const encoded =
        encodeURIComponent(
          block.code
        );

      const html = `
        <div class="code-block">

          <div class="code-head">

            <span>
              ${escapeHTML(block.language)}
            </span>

            <button
              class="code-copy"
              data-copy-code="${encoded}"
            >
              Copy
            </button>

          </div>

          <pre><code>${escapeHTML(block.code)}</code></pre>

        </div>
      `;

      text =
        text.replace(
          `@@GALAXY_CODE_${index}@@`,
          html
        );

    }
  );

  return text;

}


/* =========================================================
   MESSAGE RENDERING
   ========================================================= */

function renderMessage(message) {

  const user =
    message.role ===
    "user";

  const actions =
    user

      ? `
        <div class="message-actions">

          <button
            class="message-action"
            data-edit-message="${message.id}"
            title="Edit"
          >
            ✎
          </button>

          <button
            class="message-action"
            data-copy-message="${message.id}"
            title="Copy"
          >
            ⧉
          </button>

          <button
            class="message-action"
            data-branch-message="${message.id}"
            title="Branch"
          >
            ⑂
          </button>

        </div>
      `

      : `
        <div class="message-actions">

          <button
            class="message-action"
            data-copy-message="${message.id}"
            title="Copy"
          >
            ⧉
          </button>

          <button
            class="message-action"
            data-retry-message="${message.id}"
            title="Retry"
          >
            ↻
          </button>

          <button
            class="message-action"
            data-read-message="${message.id}"
            title="Read aloud"
          >
            ◉
          </button>

          <button
            class="message-action"
            data-branch-message="${message.id}"
            title="Branch"
          >
            ⑂
          </button>

        </div>
      `;

  const time =
    Galaxy.state.settings
      .showTimestamps

      ? `
        <time class="message-time">
          ${new Date(
            message.createdAt
          ).toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          )}
        </time>
      `

      : "";

  return `
    <article
      class="message ${message.role}"
      data-message-id="${message.id}"
    >

      <div class="bubble">
        ${renderMarkdown(message.text || "")}
      </div>

      ${time}

      ${actions}

    </article>
  `;

}


function renderChat() {

  const root =
    $("#messages");

  const empty =
    $("#emptyState");

  if (!root) {
    return;
  }

  const messages =
    getCurrentChat()
      ?.messages ||
    [];

  if (empty) {

    empty.style.display =
      messages.length
        ? "none"
        : "";

  }

  root.innerHTML =
    messages
      .map(renderMessage)
      .join("");

  requestAnimationFrame(
    () => {

      const scroller =
        $("#chatScroller");

      if (scroller) {

        scroller.scrollTop =
          scroller.scrollHeight;

      }

    }
  );

}


/* =========================================================
   COPY
   ========================================================= */

async function copyText(text) {

  try {

    await navigator
      .clipboard
      .writeText(text);

  } catch {

    const area =
      document.createElement(
        "textarea"
      );

    area.value = text;

    document.body.appendChild(area);

    area.select();

    document.execCommand("copy");

    area.remove();

  }

  toast("Copied");

}


/* =========================================================
   READ ALOUD
   ========================================================= */

function readAloud(messageId) {

  const message =
    getCurrentChat()
      ?.messages
      .find(
        item =>
          item.id ===
          messageId
      );

  if (
    !message ||
    !(
      "speechSynthesis" in
      window
    )
  ) {
    return;
  }

  speechSynthesis.cancel();

  const speech =
    new SpeechSynthesisUtterance(
      message.text
    );

  speech.lang =
    Galaxy.state.settings
      .voiceLanguage;

  speechSynthesis.speak(speech);

}


/* =========================================================
   EDIT MESSAGE
   ========================================================= */

function editMessage(messageId) {

  const chat =
    getCurrentChat();

  const message =
    chat?.messages.find(
      item =>
        item.id ===
        messageId
    );

  if (
    !chat ||
    !message
  ) {
    return;
  }

  openModal({

    title:
      "Edit message",

    body: `
      <div class="form-stack">

        <textarea
          id="editMessageField"
          class="field textarea-field"
        >${escapeHTML(message.text)}</textarea>

        <button
          id="saveEditedMessage"
          class="text-action primary"
        >
          Save and retry
        </button>

      </div>
    `

  });

  setTimeout(
    () => {

      on(
        $("#saveEditedMessage"),
        "click",
        async () => {

          const value =
            $("#editMessageField")
              ?.value
              .trim();

          if (!value) {
            return;
          }

          const index =
            chat.messages
              .findIndex(
                item =>
                  item.id ===
                  messageId
              );

          message.text =
            value;

          message.updatedAt =
            now();

          chat.messages =
            chat.messages.slice(
              0,
              index + 1
            );

          persistAll();

          renderChat();

          closeOverlay();

          await generateAssistantReply(
            value
          );

        }
      );

    },
    0
  );

}


/* =========================================================
   RETRY
   ========================================================= */

async function retryMessage(
  messageId
) {

  const chat =
    getCurrentChat();

  if (!chat) {
    return;
  }

  const index =
    chat.messages.findIndex(
      item =>
        item.id ===
        messageId
    );

  if (index < 0) {
    return;
  }

  const previous =
    [...chat.messages]
      .slice(0, index)
      .reverse()
      .find(
        item =>
          item.role ===
          "user"
      );

  if (!previous) {
    return;
  }

  chat.messages =
    chat.messages.slice(
      0,
      index
    );

  persistAll();

  renderChat();

  await generateAssistantReply(
    previous.text
  );

}


/* =========================================================
   TEXTAREA
   ========================================================= */

function autoResizeTextarea(
  textarea
) {

  if (!textarea) {
    return;
  }

  textarea.style.height =
    "auto";

  textarea.style.height =
    `${Math.min(
      textarea.scrollHeight,
      180
    )}px`;

}


/* =========================================================
   ATTACHMENTS
   ========================================================= */

function detectFileType(file) {

  if (
    file.type.startsWith(
      "image/"
    )
  ) {
    return "image";
  }

  if (
    file.type.startsWith(
      "video/"
    )
  ) {
    return "video";
  }

  return "file";

}


function addFiles(files) {

  Array.from(
    files || []
  ).forEach(
    file => {

      Galaxy.state.attachments.push({

        id:
          uid("attachment"),

        name:
          file.name,

        size:
          file.size,

        mime:
          file.type,

        type:
          detectFileType(file),

        file

      });

    }
  );

  renderAttachments();

}


function removeAttachment(id) {

  Galaxy.state.attachments =
    Galaxy.state.attachments
      .filter(
        item =>
          item.id !== id
      );

  renderAttachments();

}


function renderAttachments() {

  const strip =
    $("#attachmentStrip");

  if (!strip) {
    return;
  }

  if (
    !Galaxy.state.attachments
      .length
  ) {

    strip.hidden = true;

    strip.innerHTML = "";

    return;

  }

  strip.hidden = false;

  strip.innerHTML =
    Galaxy.state.attachments
      .map(
        item => `
          <div class="attachment-chip">

            <span>
              ${
                item.type ===
                "image"
                  ? "◫"
                  : item.type ===
                    "video"
                    ? "▷"
                    : "▱"
              }
            </span>

            <span>
              ${escapeHTML(item.name)}
            </span>

            <button
              class="icon-btn"
              data-remove-attachment="${item.id}"
              aria-label="Remove"
            >
              ×
            </button>

          </div>
        `
      )
      .join("");

}


function describeAttachments() {

  return Galaxy.state.attachments
    .map(
      item =>
        `[${item.type}: ${item.name}]`
    )
    .join("\n");

}


/* =========================================================
   LIBRARY
   ========================================================= */

function addLibraryFile(file) {

  const reader =
    new FileReader();

  const item = {

    id:
      uid("library"),

    name:
      file.name,

    type:
      detectFileType(file),

    mime:
      file.type,

    size:
      file.size,

    createdAt:
      now(),

    favorite: false,

    dataUrl: null

  };

  reader.onload =
    () => {

      item.dataUrl =
        reader.result;

      Galaxy.state.library.unshift(
        item
      );

      persistAll();

      if (
        Galaxy.state.view ===
        "library"
      ) {

        renderLibrary();

      }

    };

  reader.onerror =
    () =>
      handleError(
        new Error(
          "Could not read the file."
        ),
        "Library"
      );

  reader.readAsDataURL(file);

}


function toggleLibraryFavorite(id) {

  const item =
    Galaxy.state.library.find(
      entry =>
        entry.id === id
    );

  if (!item) {
    return;
  }

  item.favorite =
    !item.favorite;

  persistAll();

  renderLibrary();

}


function deleteLibraryItem(id) {

  Galaxy.state.library =
    Galaxy.state.library.filter(
      item =>
        item.id !== id
    );

  persistAll();

  renderLibrary();

}


function renderContentHeader(
  eyebrow,
  title,
  actions = ""
) {

  const eyebrowElement =
    $("#contentEyebrow");

  const titleElement =
    $("#contentTitle");

  const actionsElement =
    $("#contentActions");

  if (eyebrowElement) {
    eyebrowElement.textContent =
      eyebrow;
  }

  if (titleElement) {
    titleElement.textContent =
      title;
  }

  if (actionsElement) {
    actionsElement.innerHTML =
      actions;
  }

}


function renderContentTabs(
  tabs,
  active,
  group
) {

  const root =
    $("#contentTabs");

  if (!root) {
    return;
  }

  root.innerHTML =
    tabs
      .map(
        ([value, label]) => `
          <button
            class="flat-tab ${
              value === active
                ? "active"
                : ""
            }"
            data-content-tab="${escapeHTML(value)}"
            data-content-group="${escapeHTML(group)}"
          >
            ${escapeHTML(label)}
          </button>
        `
      )
      .join("");

}


function renderLibrary(
  filter =
    Galaxy.state
      .activeLibraryFilter
) {

  Galaxy.state.activeLibraryFilter =
    filter;

  renderContentHeader(
    "Your content",
    "Library",
    `
      <button
        class="text-action"
        data-action="library-upload"
      >
        ＋ Add
      </button>
    `
  );

  renderContentTabs(
    [
      ["all", "All"],
      ["photos", "Photos"],
      ["videos", "Videos"],
      ["files", "Files"],
      ["favorites", "Favorites"]
    ],
    filter,
    "library"
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  const items =
    Galaxy.state.library.filter(
      item =>

        filter ===
        "all" ||

        (
          filter ===
          "photos" &&
          item.type ===
          "image"
        ) ||

        (
          filter ===
          "videos" &&
          item.type ===
          "video"
        ) ||

        (
          filter ===
          "files" &&
          item.type ===
          "file"
        ) ||

        (
          filter ===
          "favorites" &&
          item.favorite
        )
    );

  root.innerHTML =
    items.length

      ? `
        <div class="media-grid">

          ${items
            .map(
              item => `
              <article class="media-card">

                <button
                  class="media-preview"
                  data-preview-library="${item.id}"
                >

                  ${
                    item.type ===
                    "image"

                      ? `
                        <img
                          src="${item.dataUrl}"
                          alt="${escapeHTML(item.name)}"
                        >
                      `

                      : item.type ===
                        "video"

                        ? `
                          <video
                            src="${item.dataUrl}"
                            muted
                          ></video>
                        `

                        : `
                          <div class="file-preview-tile">
                            ▱
                          </div>
                        `
                  }

                </button>

                <div class="media-meta">

                  <div>

                    <strong>
                      ${escapeHTML(item.name)}
                    </strong>

                    <small>
                      ${item.type}
                    </small>

                  </div>

                  <button
                    class="icon-btn ${
                      item.favorite
                        ? "active"
                        : ""
                    }"
                    data-library-favorite="${item.id}"
                  >
                    ♡
                  </button>

                  <button
                    class="icon-btn"
                    data-delete-library="${item.id}"
                  >
                    ×
                  </button>

                </div>

              </article>
            `
            )
            .join("")}

        </div>
      `

      : `
        <div class="empty-panel">

          <span>
            ▣
          </span>

          <h3>
            No items yet
          </h3>

          <p>
            Add photos, videos or files.
          </p>

        </div>
      `;

}


function previewLibraryItem(id) {

  const item =
    Galaxy.state.library.find(
      entry =>
        entry.id === id
    );

  if (!item) {
    return;
  }

  if (
    item.type ===
    "image"
  ) {

    openModal({

      title:
        item.name,

      width:
        "1000px",

      body: `
        <div class="image-preview">

          <img
            src="${item.dataUrl}"
            alt="${escapeHTML(item.name)}"
          >

        </div>
      `

    });

    return;
  }

  if (
    item.type ===
    "video"
  ) {

    openModal({

      title:
        item.name,

      width:
        "1000px",

      body: `
        <div class="video-preview">

          <video
            src="${item.dataUrl}"
            controls
            autoplay
          ></video>

        </div>
      `

    });

    return;
  }

  openModal({

    title:
      item.name,

    body: `
      <div class="file-preview">

        <div class="file-large-icon">
          ▱
        </div>

        <h3>
          ${escapeHTML(item.name)}
        </h3>

        <p>
          ${escapeHTML(item.mime || "File")}
        </p>

      </div>
    `

  });

}


/* =========================================================
   PROJECTS
   ========================================================= */

function createProject() {

  openProjectEditor();

}


function openProjectEditor(
  project = null
) {

  const editing =
    !!project;

  openModal({

    title:
      editing
        ? "Edit project"
        : "New project",

    body: `
      <form
        id="projectForm"
        class="form-stack"
      >

        <label>
          Name

          <input
            class="field"
            name="name"
            value="${
              project
                ? escapeHTML(project.name)
                : ""
            }"
            required
          >

        </label>

        <label>
          Description

          <textarea
            class="field textarea-field"
            name="description"
          >${
            project
              ? escapeHTML(
                  project.description ||
                  ""
                )
              : ""
          }</textarea>

        </label>

        <label>
          Status

          <select
            class="field"
            name="status"
          >

            ${[
              "active",
              "planning",
              "paused",
              "complete"
            ]
              .map(
                status => `
                <option
                  value="${status}"
                  ${
                    project?.status ===
                    status
                      ? "selected"
                      : ""
                  }
                >
                  ${status}
                </option>
              `
              )
              .join("")}

          </select>

        </label>

        <button
          class="text-action primary"
          type="submit"
        >
          ${
            editing
              ? "Save changes"
              : "Create project"
          }
        </button>

      </form>
    `

  });

  setTimeout(
    () => {

      on(
        $("#projectForm"),
        "submit",
        event => {

          event.preventDefault();

          const form =
            new FormData(
              event.currentTarget
            );

          const data = {

            name:
              String(
                form.get("name") ||
                ""
              ).trim(),

            description:
              String(
                form.get("description") ||
                ""
              ).trim(),

            status:
              form.get("status")

          };

          if (!data.name) {
            return;
          }

          if (editing) {

            Object.assign(
              project,
              data,
              {
                updatedAt:
                  now()
              }
            );

          } else {

            Galaxy.state.projects.unshift({

              id:
                uid("project"),

              ...data,

              createdAt:
                now(),

              updatedAt:
                now()

            });

          }

          persistAll();

          closeOverlay();

          renderProjects();

        }
      );

    },
    0
  );

}


function editProject(id) {

  const project =
    Galaxy.state.projects.find(
      item =>
        item.id === id
    );

  if (project) {
    openProjectEditor(project);
  }

}


function deleteProject(id) {

  const project =
    Galaxy.state.projects.find(
      item =>
        item.id === id
    );

  if (!project) {
    return;
  }

  confirmAction({

    title:
      "Delete project",

    message:
      `Delete “${project.name}”?`,

    onConfirm() {

      Galaxy.state.projects =
        Galaxy.state.projects.filter(
          item =>
            item.id !== id
        );

      persistAll();

      renderProjects();

    }

  });

}


function renderProjects() {

  renderContentHeader(
    "Workspace",
    "Projects",
    `
      <button
        class="text-action"
        data-action="new-project"
      >
        ＋ New project
      </button>
    `
  );

  renderContentTabs(
    [
      ["all", "All"],
      ["active", "Active"],
      ["planning", "Planning"],
      ["complete", "Complete"]
    ],
    "all",
    "projects"
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  root.innerHTML =
    Galaxy.state.projects.length

      ? `
        <div class="resource-grid">

          ${Galaxy.state.projects
            .map(
              project => `
              <article
                class="resource-card"
                data-context-type="project"
                data-context-id="${project.id}"
              >

                <div class="resource-icon">
                  ▱
                </div>

                <div class="resource-copy">

                  <strong>
                    ${escapeHTML(project.name)}
                  </strong>

                  <span>
                    ${escapeHTML(project.status)}
                  </span>

                </div>

                <button
                  class="icon-btn"
                  data-edit-project="${project.id}"
                >
                  ⋯
                </button>

              </article>
            `
            )
            .join("")}

        </div>
      `

      : `
        <div class="empty-panel">

          <span>
            ▱
          </span>

          <h3>
            No projects yet
          </h3>

          <p>
            Create your first GALAXY project.
          </p>

        </div>
      `;

}


/* =========================================================
   SCHEDULED TASKS
   ========================================================= */

function createScheduledTask() {

  openModal({

    title:
      "New scheduled task",

    body: `
      <form
        id="scheduleForm"
        class="form-stack"
      >

        <label>
          Name

          <input
            class="field"
            name="name"
            required
          >

        </label>

        <label>
          Prompt

          <textarea
            class="field textarea-field"
            name="prompt"
            required
          ></textarea>

        </label>

        <label>
          Frequency

          <select
            class="field"
            name="frequency"
          >

            <option value="once">
              Once
            </option>

            <option value="daily">
              Daily
            </option>

            <option value="weekly">
              Weekly
            </option>

            <option value="monthly">
              Monthly
            </option>

          </select>

        </label>

        <label>
          Date and time

          <input
            class="field"
            type="datetime-local"
            name="datetime"
          >

        </label>

        <button
          class="text-action primary"
          type="submit"
        >
          Schedule
        </button>

      </form>
    `

  });

  setTimeout(
    () => {

      on(
        $("#scheduleForm"),
        "submit",
        event => {

          event.preventDefault();

          const form =
            new FormData(
              event.currentTarget
            );

          Galaxy.state.scheduled.unshift({

            id:
              uid("schedule"),

            name:
              String(
                form.get("name") ||
                ""
              ).trim(),

            prompt:
              String(
                form.get("prompt") ||
                ""
              ).trim(),

            frequency:
              form.get("frequency"),

            datetime:
              form.get("datetime"),

            enabled: true,

            createdAt:
              now()

          });

          persistAll();

          closeOverlay();

          renderScheduled();

        }
      );

    },
    0
  );

}


function toggleScheduledTask(id) {

  const task =
    Galaxy.state.scheduled.find(
      item =>
        item.id === id
    );

  if (!task) {
    return;
  }

  task.enabled =
    !task.enabled;

  persistAll();

  renderScheduled();

}


function deleteScheduledTask(id) {

  Galaxy.state.scheduled =
    Galaxy.state.scheduled.filter(
      item =>
        item.id !== id
    );

  persistAll();

  renderScheduled();

}


function renderScheduled() {

  renderContentHeader(
    "Automation",
    "Scheduled",
    `
      <button
        class="text-action"
        data-action="new-scheduled"
      >
        ＋ New
      </button>
    `
  );

  renderContentTabs(
    [
      ["upcoming", "Upcoming"],
      ["recurring", "Recurring"],
      ["completed", "Completed"]
    ],
    "upcoming",
    "scheduled"
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  root.innerHTML =
    Galaxy.state.scheduled.length

      ? `
        <div class="schedule-list">

          ${Galaxy.state.scheduled
            .map(
              task => `
              <article class="schedule-row">

                <div class="resource-icon">
                  ◷
                </div>

                <div class="resource-copy">

                  <strong>
                    ${escapeHTML(task.name)}
                  </strong>

                  <span>
                    ${escapeHTML(task.frequency)}

                    ${
                      task.datetime
                        ? ` · ${escapeHTML(task.datetime)}`
                        : ""
                    }
                  </span>

                </div>

                <button
                  class="toggle-switch ${
                    task.enabled
                      ? "active"
                      : ""
                  }"
                  data-toggle-scheduled="${task.id}"
                >
                  <span></span>
                </button>

                <button
                  class="icon-btn"
                  data-delete-scheduled="${task.id}"
                >
                  ×
                </button>

              </article>
            `
            )
            .join("")}

        </div>
      `

      : `
        <div class="empty-panel">

          <span>
            ◷
          </span>

          <h3>
            No scheduled tasks
          </h3>

          <p>
            Create recurring AI workflows.
          </p>

        </div>
      `;

}


/* =========================================================
   PLUGINS
   ========================================================= */

function togglePluginInstall(id) {

  const plugin =
    Galaxy.state.plugins.find(
      item =>
        item.id === id
    );

  if (!plugin) {
    return;
  }

  plugin.installed =
    !plugin.installed;

  if (!plugin.installed) {
    plugin.connected = false;
  }

  persistAll();

  renderPlugins();

}


function togglePluginConnection(id) {

  const plugin =
    Galaxy.state.plugins.find(
      item =>
        item.id === id
    );

  if (!plugin) {
    return;
  }

  plugin.installed = true;

  plugin.connected =
    !plugin.connected;

  persistAll();

  renderPlugins();

}


function renderPlugins() {

  renderContentHeader(
    "Connections",
    "Plugins"
  );

  renderContentTabs(
    [
      ["installed", "Installed"],
      ["discover", "Discover"],
      ["permissions", "Permissions"]
    ],
    "discover",
    "plugins"
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="resource-grid">

      ${Galaxy.state.plugins
        .map(
          plugin => `
          <article class="plugin-card">

            <div class="resource-icon">
              ${plugin.icon}
            </div>

            <div class="resource-copy">

              <strong>
                ${escapeHTML(plugin.name)}
              </strong>

              <span>
                ${escapeHTML(plugin.description)}
              </span>

            </div>

            <div class="plugin-actions">

              <button
                class="text-action"
                data-plugin-install="${plugin.id}"
              >
                ${
                  plugin.installed
                    ? "Remove"
                    : "Install"
                }
              </button>

              ${
                plugin.installed

                  ? `
                    <button
                      class="text-action"
                      data-plugin-connect="${plugin.id}"
                    >
                      ${
                        plugin.connected
                          ? "Disconnect"
                          : "Connect"
                      }
                    </button>
                  `

                  : ""
              }

            </div>

          </article>
        `
        )
        .join("")}

    </div>
  `;

}


/* =========================================================
   GPT / AGENT CREATOR
   ========================================================= */

function createAgent() {

  openAgentEditor();

}


function openAgentEditor(
  agent = null
) {

  openModal({

    title:
      agent
        ? "Edit GPT"
        : "Create GPT",

    body: `
      <form
        id="agentForm"
        class="form-stack"
      >

        <label>
          Name

          <input
            class="field"
            name="name"
            value="${
              agent
                ? escapeHTML(agent.name)
                : ""
            }"
            required
          >

        </label>

        <label>
          Instructions

          <textarea
            class="field textarea-field"
            name="instructions"
            required
          >${
            agent
              ? escapeHTML(
                  agent.instructions ||
                  ""
                )
              : ""
          }</textarea>

        </label>

        <label>
          Personality

          <select
            class="field"
            name="personality"
          >

            <option value="balanced">
              Balanced
            </option>

            <option value="creative">
              Creative
            </option>

            <option value="precise">
              Precise
            </option>

            <option value="technical">
              Technical
            </option>

          </select>

        </label>

        <button
          class="text-action primary"
          type="submit"
        >
          ${
            agent
              ? "Save GPT"
              : "Create GPT"
          }
        </button>

      </form>
    `

  });

  setTimeout(
    () => {

      on(
        $("#agentForm"),
        "submit",
        event => {

          event.preventDefault();

          const form =
            new FormData(
              event.currentTarget
            );

          const data = {

            name:
              String(
                form.get("name") ||
                ""
              ).trim(),

            instructions:
              String(
                form.get("instructions") ||
                ""
              ).trim(),

            personality:
              form.get("personality")

          };

          if (agent) {

            Object.assign(
              agent,
              data,
              {
                updatedAt:
                  now()
              }
            );

          } else {

            Galaxy.state.agents.unshift({

              id:
                uid("agent"),

              ...data,

              createdAt:
                now(),

              updatedAt:
                now()

            });

          }

          persistAll();

          closeOverlay();

          renderAgents();

        }
      );

    },
    0
  );

}


function renderAgents() {

  renderContentHeader(
    "Agents",
    "GPTs",
    `
      <button
        class="text-action"
        data-action="new-agent"
      >
        ＋ Create GPT
      </button>
    `
  );

  renderContentTabs(
    [
      ["mine", "Mine"],
      ["favorites", "Favorites"],
      ["explore", "Explore"]
    ],
    "mine",
    "gpts"
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  root.innerHTML =
    Galaxy.state.agents.length

      ? `
        <div class="resource-grid">

          ${Galaxy.state.agents
            .map(
              agent => `
              <article class="resource-card">

                <div class="resource-icon">
                  ✧
                </div>

                <div class="resource-copy">

                  <strong>
                    ${escapeHTML(agent.name)}
                  </strong>

                  <span>
                    ${escapeHTML(agent.personality)}
                  </span>

                </div>

                <button
                  class="icon-btn"
                  data-edit-agent="${agent.id}"
                >
                  ⋯
                </button>

              </article>
            `
            )
            .join("")}

        </div>
      `

      : `
        <div class="empty-panel">

          <span>
            ✧
          </span>

          <h3>
            Create your first GPT
          </h3>

          <p>
            Build specialized GALAXY agents.
          </p>

        </div>
      `;

}


/* =========================================================
   SITES
   ========================================================= */

function createSite() {

  const site = {

    id:
      uid("site"),

    name:
      "Untitled Site",

    html:
      "<h1>GALAXY Site</h1><p>Start building here.</p>",

    css:
      "body { font-family: system-ui; padding: 40px; }",

    js: "",

    status: "draft",

    createdAt:
      now(),

    updatedAt:
      now()

  };

  Galaxy.state.sites.unshift(site);

  Galaxy.state.activeSiteId =
    site.id;

  persistAll();

  openSiteEditor(site.id);

}


function openSiteEditor(id) {

  const site =
    Galaxy.state.sites.find(
      item =>
        item.id === id
    );

  if (!site) {
    return;
  }

  Galaxy.state.activeSiteId =
    id;

  renderContentHeader(
    "Build",
    site.name,
    `
      <button
        class="text-action"
        data-action="save-site"
      >
        Save
      </button>

      <button
        class="text-action"
        data-action="preview-site"
      >
        Preview
      </button>
    `
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="site-editor">

      <div class="site-editor-tabs">

        <button
          class="editor-tab active"
          data-site-tab="html"
        >
          HTML
        </button>

        <button
          class="editor-tab"
          data-site-tab="css"
        >
          CSS
        </button>

        <button
          class="editor-tab"
          data-site-tab="js"
        >
          JS
        </button>

      </div>

      <textarea
        id="siteEditor"
        class="code-editor"
        data-language="html"
      >${escapeHTML(site.html)}</textarea>

    </div>
  `;

}


function saveActiveSite() {

  const site =
    Galaxy.state.sites.find(
      item =>
        item.id ===
        Galaxy.state.activeSiteId
    );

  const editor =
    $("#siteEditor");

  if (
    !site ||
    !editor
  ) {
    return;
  }

  site[
    editor.dataset.language
  ] =
    editor.value;

  site.updatedAt =
    now();

  persistAll();

  toast("Site saved");

}


function switchSiteEditorTab(
  language
) {

  const site =
    Galaxy.state.sites.find(
      item =>
        item.id ===
        Galaxy.state.activeSiteId
    );

  const editor =
    $("#siteEditor");

  if (
    !site ||
    !editor
  ) {
    return;
  }

  site[
    editor.dataset.language
  ] =
    editor.value;

  editor.dataset.language =
    language;

  editor.value =
    site[language] ||
    "";

  $$(".editor-tab")
    .forEach(
      tab =>
        tab.classList.toggle(
          "active",
          tab.dataset.siteTab ===
            language
        )
    );

  persistAll();

}


function previewActiveSite() {

  saveActiveSite();

  const site =
    Galaxy.state.sites.find(
      item =>
        item.id ===
        Galaxy.state.activeSiteId
    );

  if (!site) {
    return;
  }

  const source = `
    <!DOCTYPE html>

    <html>

      <head>

        <style>
          ${site.css}
        </style>

      </head>

      <body>

        ${site.html}

        <script>
          ${site.js}
        <\/script>

      </body>

    </html>
  `;

  openModal({

    title:
      site.name,

    width:
      "1100px",

    body: `
      <iframe
        class="site-preview-frame"
        id="sitePreviewFrame"
      ></iframe>
    `

  });

  setTimeout(
    () => {

      const frame =
        $("#sitePreviewFrame");

      if (frame) {
        frame.srcdoc =
          source;
      }

    },
    0
  );

}


function renderSites() {

  renderContentHeader(
    "Build",
    "Sites",
    `
      <button
        class="text-action"
        data-action="new-site"
      >
        ＋ New site
      </button>
    `
  );

  renderContentTabs(
    [
      ["drafts", "Drafts"],
      ["published", "Published"],
      ["templates", "Templates"]
    ],
    "drafts",
    "sites"
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  root.innerHTML =
    Galaxy.state.sites.length

      ? `
        <div class="resource-grid">

          ${Galaxy.state.sites
            .map(
              site => `
              <button
                class="resource-card"
                data-open-site="${site.id}"
              >

                <div class="resource-icon">
                  ⌘
                </div>

                <div class="resource-copy">

                  <strong>
                    ${escapeHTML(site.name)}
                  </strong>

                  <span>
                    ${escapeHTML(site.status)}
                  </span>

                </div>

                <span class="resource-arrow">
                  ›
                </span>

              </button>
            `
            )
            .join("")}

        </div>
      `

      : `
        <div class="empty-panel">

          <span>
            ⌘
          </span>

          <h3>
            No sites yet
          </h3>

          <p>
            Create a website in GALAXY Work.
          </p>

        </div>
      `;

}


/* =========================================================
   IMAGES
   ========================================================= */

function createImageConcept() {

  openModal({

    title:
      "Create image",

    body: `
      <form
        id="imageConceptForm"
        class="form-stack"
      >

        <label>
          Describe your image

          <textarea
            class="field textarea-field"
            name="prompt"
            required
          ></textarea>

        </label>

        <label>
          Aspect ratio

          <select
            class="field"
            name="ratio"
          >

            <option value="1:1">
              Square 1:1
            </option>

            <option value="16:9">
              Landscape 16:9
            </option>

            <option value="9:16">
              Portrait 9:16
            </option>

          </select>

        </label>

        <button
          class="text-action primary"
          type="submit"
        >
          Create concept
        </button>

      </form>
    `

  });

  setTimeout(
    () => {

      on(
        $("#imageConceptForm"),
        "submit",
        event => {

          event.preventDefault();

          const form =
            new FormData(
              event.currentTarget
            );

          Galaxy.state.images.unshift({

            id:
              uid("image"),

            prompt:
              String(
                form.get("prompt") ||
                ""
              ).trim(),

            ratio:
              form.get("ratio"),

            status: "concept",

            createdAt:
              now()

          });

          persistAll();

          closeOverlay();

          renderImages();

        }
      );

    },
    0
  );

}


function renderImages() {

  renderContentHeader(
    "Create",
    "Images",
    `
      <button
        class="text-action"
        data-action="new-image"
      >
        ＋ Create image
      </button>
    `
  );

  renderContentTabs(
    [
      ["recent", "Recent"],
      ["collections", "Collections"],
      ["references", "References"]
    ],
    "recent",
    "images"
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  root.innerHTML =
    Galaxy.state.images.length

      ? `
        <div class="image-concept-grid">

          ${Galaxy.state.images
            .map(
              image => `
              <article class="image-concept-card">

                <div class="image-concept-placeholder">
                  ◫
                </div>

                <strong>
                  ${escapeHTML(
                    image.prompt.slice(
                      0,
                      80
                    )
                  )}
                </strong>

                <span>
                  ${escapeHTML(image.ratio)}
                </span>

              </article>
            `
            )
            .join("")}

        </div>
      `

      : `
        <div class="empty-panel">

          <span>
            ◫
          </span>

          <h3>
            Create images
          </h3>

          <p>
            Image generation is ready for a connected backend.
          </p>

        </div>
      `;

}


/* =========================================================
   PACKS SYSTEM
   ========================================================= */

function installPack(id) {

  const pack =
    Galaxy.state.packs.find(
      item =>
        item.id === id
    );

  if (!pack) {
    return;
  }

  pack.installed = true;

  persistAll();

  renderPacks(
    Galaxy.state
      .activePackFilter
  );

}


function removePack(id) {

  const pack =
    Galaxy.state.packs.find(
      item =>
        item.id === id
    );

  if (!pack) {
    return;
  }

  pack.installed = false;

  persistAll();

  renderPacks(
    Galaxy.state
      .activePackFilter
  );

}


function togglePackInstall(id) {

  const pack =
    Galaxy.state.packs.find(
      item =>
        item.id === id
    );

  if (!pack) {
    return;
  }

  if (pack.installed) {

    removePack(id);

  } else {

    installPack(id);

  }

}


function openPack(id) {

  const pack =
    Galaxy.state.packs.find(
      item =>
        item.id === id
    );

  if (!pack) {
    return;
  }

  renderContentHeader(
    "Pack",
    pack.name,
    `
      <button
        class="text-action"
        data-pack-install-toggle="${pack.id}"
      >
        ${
          pack.installed
            ? "Remove Pack"
            : "Install Pack"
        }
      </button>
    `
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="pack-workflow-list">

      ${pack.items
        .map(
          item => `
          <button
            class="pack-workflow-row"
            data-pack-item="${escapeHTML(item)}"
          >

            <span class="pack-workflow-icon">
              ✦
            </span>

            <span>
              ${escapeHTML(item)}
            </span>

            <span class="resource-arrow">
              ›
            </span>

          </button>
        `
        )
        .join("")}

    </div>
  `;

}


function renderPacks(
  filter = "all"
) {

  Galaxy.state.activePackFilter =
    filter;

  renderContentHeader(
    "Collections",
    "Packs"
  );

  renderContentTabs(
    [
      ["all", "All"],
      ["prompt", "Prompts"],
      ["website", "Websites"],
      ["creator", "Creator"],
      ["productivity", "Productivity"],
      ["research", "Research"],
      ["developer", "Developer"],
      ["design", "Design"],
      ["video", "Video"],
      ["startup", "Startup"],
      ["data", "Data"]
    ],
    filter,
    "packs"
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  const packs =
    Galaxy.state.packs.filter(
      pack =>
        filter ===
        "all" ||
        pack.category ===
        filter
    );

  root.innerHTML = `
    <div class="packs-grid">

      ${packs
        .map(
          pack => `
          <article
            class="pack-card ${
              pack.featured
                ? "pack-featured"
                : ""
            }"
          >

            <button
              class="pack-main"
              data-open-pack="${pack.id}"
            >

              <div class="pack-cover">

                <span>
                  ${pack.icon}
                </span>

              </div>

              <div class="pack-card-copy">

                <strong>
                  ${escapeHTML(pack.name)}
                </strong>

                <p>
                  ${escapeHTML(pack.description)}
                </p>

                <div class="pack-meta">

                  <span>
                    ${pack.items.length} workflows
                  </span>

                  ${
                    pack.featured
                      ? "<span>Featured</span>"
                      : ""
                  }

                </div>

              </div>

            </button>

            <button
              class="text-action"
              data-pack-install-toggle="${pack.id}"
            >
              ${
                pack.installed
                  ? "Installed"
                  : "Install"
              }
            </button>

          </article>
        `
        )
        .join("")}

    </div>
  `;

}


/* =========================================================
   PROMPT TEMPLATES
   ========================================================= */

function openPromptTemplates() {

  openModal({

    title:
      "Prompt templates",

    body: `
      <div class="prompt-template-list">

        ${Galaxy.state.prompts
          .map(
            prompt => `
            <button
              class="prompt-template"
              data-use-prompt="${prompt.id}"
            >

              <div>

                <strong>
                  ${escapeHTML(prompt.title)}
                </strong>

                <span>
                  ${escapeHTML(prompt.category)}
                </span>

              </div>

              <span>
                ›
              </span>

            </button>
          `
          )
          .join("")}

      </div>
    `

  });

}


function usePromptTemplate(id) {

  const prompt =
    Galaxy.state.prompts.find(
      item =>
        item.id === id
    );

  if (!prompt) {
    return;
  }

  closeOverlay();

  switchMode("chat");

  const input =
    $("#promptInput");

  if (!input) {
    return;
  }

  input.value =
    `${prompt.prompt}\n\n`;

  autoResizeTextarea(input);

  input.focus();

}


/* =========================================================
   WORK MODE
   ========================================================= */

function ensureWorkDocument() {

  let doc =
    Galaxy.state.workDocuments.find(
      item =>
        item.id ===
        Galaxy.state
          .activeWorkDocumentId
    );

  if (!doc) {

    doc = {

      id:
        uid("work"),

      title:
        "Untitled Work",

      content:
        "# GALAXY Work\n\nStart creating here.",

      createdAt:
        now(),

      updatedAt:
        now()

    };

    Galaxy.state.workDocuments.unshift(
      doc
    );

    Galaxy.state.activeWorkDocumentId =
      doc.id;

    persistAll();

  }

  return doc;

}


function renderWorkDocument() {

  const doc =
    ensureWorkDocument();

  const root =
    $("#previewSurface");

  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="work-editor-shell">

      <div class="work-editor-toolbar">

        <input
          id="workDocumentTitle"
          class="work-title-input"
          value="${escapeHTML(doc.title)}"
        >

        <div>

          <button
            class="text-action"
            data-work-view="edit"
          >
            Edit
          </button>

          <button
            class="text-action"
            data-work-view="preview"
          >
            Preview
          </button>

        </div>

      </div>

      <textarea
        id="workDocumentEditor"
        class="work-document-editor"
      >${escapeHTML(doc.content)}</textarea>

    </div>
  `;

  on(
    $("#workDocumentEditor"),
    "input",
    event => {

      doc.content =
        event.target.value;

      doc.updatedAt =
        now();

      persistAll();

    }
  );

  on(
    $("#workDocumentTitle"),
    "input",
    event => {

      doc.title =
        event.target.value;

      doc.updatedAt =
        now();

      persistAll();

    }
  );

}


function previewWorkDocument() {

  const doc =
    ensureWorkDocument();

  const root =
    $("#previewSurface");

  if (root) {

    root.innerHTML = `
      <article class="work-document-preview">
        ${renderMarkdown(doc.content)}
      </article>
    `;

  }

}


async function sendWorkMessage() {

  const input =
    $("#workPrompt");

  const root =
    $("#workMessages");

  const text =
    input?.value.trim();

  if (
    !input ||
    !root ||
    !text
  ) {
    return;
  }

  input.value = "";

  root.insertAdjacentHTML(
    "beforeend",
    `
      <article class="message user">

        <div class="bubble">
          ${escapeHTML(text)}
        </div>

      </article>
    `
  );

  try {

    const reply =
      await fetchAIResponse(
        text,
        {
          mode: "work"
        }
      );

    root.insertAdjacentHTML(
      "beforeend",
      `
        <article class="message assistant">

          <div class="bubble">
            ${renderMarkdown(reply)}
          </div>

        </article>
      `
    );

  } catch (error) {

    root.insertAdjacentHTML(
      "beforeend",
      `
        <article class="message assistant">

          <div class="bubble">
            ${escapeHTML(error.message)}
          </div>

        </article>
      `
    );

  }

}


function switchMode(mode) {

  Galaxy.state.mode =
    mode;

  Galaxy.state.view =
    mode;

  $$(".mode-tab")
    .forEach(
      tab => {

        const active =
          tab.dataset.mode ===
          mode;

        tab.classList.toggle(
          "active",
          active
        );

        tab.setAttribute(
          "aria-selected",
          String(active)
        );

      }
    );

  $("#chatView")
    ?.classList.toggle(
      "active-view",
      mode === "chat"
    );

  $("#workView")
    ?.classList.toggle(
      "active-view",
      mode === "work"
    );

  $("#contentView")
    ?.classList.remove(
      "active-view"
    );

  if (mode === "work") {
    renderWorkDocument();
  }

}


/* =========================================================
   GAMING CENTER
   ========================================================= */

const GameCenter = {

  activeGame: "home",

  chess: null,

  ticTacToe: null,

  connectFour: null,

  memory: null

};


function renderGames() {

  GameCenter.activeGame =
    "home";

  renderContentHeader(
    "Play",
    "Gaming Center"
  );

  renderContentTabs(
    [
      ["featured", "Featured"],
      ["board", "Board"],
      ["arcade", "Arcade"],
      ["puzzle", "Puzzle"]
    ],
    "featured",
    "games"
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  root.innerHTML = `
    <section class="games-home">

      <div class="games-hero">

        <div>

          <span class="games-kicker">
            GALAXY GAMING
          </span>

          <h2>
            Play directly inside GALAXY
          </h2>

          <p>
            Visual games with real boards,
            pieces, turns and scores.
          </p>

        </div>

        <div
          class="games-hero-mark"
          aria-hidden="true"
        >
          ♛
        </div>

      </div>


      <div class="games-grid">

        <button
          class="game-card game-card-featured"
          data-game-open="chess"
        >

          <div class="game-card-visual chess-mini">

            <span>♜</span>
            <span>♞</span>
            <span>♝</span>
            <span>♛</span>

            <span>♙</span>
            <span>♘</span>
            <span>♗</span>
            <span>♕</span>

          </div>

          <div class="game-card-copy">

            <strong>
              Chess vs GALAXY
            </strong>

            <span>
              Play White against GALAXY
            </span>

          </div>

        </button>


        <button
          class="game-card"
          data-game-open="tictactoe"
        >

          <div class="game-card-visual ttt-mini">

            <span>✕</span>
            <span>○</span>
            <span>✕</span>

            <span>○</span>
            <span>✕</span>
            <span>○</span>

            <span>○</span>
            <span>✕</span>
            <span>○</span>

          </div>

          <div class="game-card-copy">

            <strong>
              Tic-Tac-Toe
            </strong>

            <span>
              Fast match against GALAXY
            </span>

          </div>

        </button>


        <button
          class="game-card"
          data-game-open="connect4"
        >

          <div class="game-card-visual connect-mini">

            ${Array.from(
              { length: 24 },
              (_, i) => `
                <span
                  class="${
                    [
                      15,
                      16,
                      21,
                      22,
                      23
                    ].includes(i)
                      ? "filled"
                      : ""
                  }"
                ></span>
              `
            ).join("")}

          </div>

          <div class="game-card-copy">

            <strong>
              Connect Four
            </strong>

            <span>
              Drop discs and beat GALAXY
            </span>

          </div>

        </button>


        <button
          class="game-card"
          data-game-open="memory"
        >

          <div class="game-card-visual memory-mini">

            <span>✦</span>
            <span>?</span>
            <span>?</span>
            <span>♞</span>

            <span>?</span>
            <span>◫</span>
            <span>?</span>
            <span>?</span>

          </div>

          <div class="game-card-copy">

            <strong>
              Memory
            </strong>

            <span>
              Match visual pairs
            </span>

          </div>

        </button>

      </div>

    </section>
  `;

}


function gameBackButton() {

  return `
    <button
      class="text-action game-back"
      data-game-back
    >
      ← Gaming Center
    </button>
  `;

}


/* =========================================================
   CHESS
   ========================================================= */

const CHESS_PIECES = {

  wr: "♖",
  wn: "♘",
  wb: "♗",
  wq: "♕",
  wk: "♔",
  wp: "♙",

  br: "♜",
  bn: "♞",
  bb: "♝",
  bq: "♛",
  bk: "♚",
  bp: "♟"

};


function initialChessBoard() {

  return [

    [
      "br",
      "bn",
      "bb",
      "bq",
      "bk",
      "bb",
      "bn",
      "br"
    ],

    [
      "bp",
      "bp",
      "bp",
      "bp",
      "bp",
      "bp",
      "bp",
      "bp"
    ],

    [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],

    [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],

    [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],

    [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],

    [
      "wp",
      "wp",
      "wp",
      "wp",
      "wp",
      "wp",
      "wp",
      "wp"
    ],

    [
      "wr",
      "wn",
      "wb",
      "wq",
      "wk",
      "wb",
      "wn",
      "wr"
    ]

  ];

}


function resetChess() {

  GameCenter.chess = {

    board:
      initialChessBoard(),

    selected:
      null,

    legal:
      [],

    turn:
      "w",

    status:
      "Your turn",

    gameOver:
      false,

    moveHistory:
      []

  };

}


function chessColor(piece) {

  return piece
    ? piece[0]
    : null;

}


function chessType(piece) {

  return piece
    ? piece[1]
    : null;

}


function inBoard(r, c) {

  return (
    r >= 0 &&
    r < 8 &&
    c >= 0 &&
    c < 8
  );

}


function chessMovesFor(
  board,
  r,
  c
) {

  const piece =
    board[r][c];

  if (!piece) {
    return [];
  }

  const color =
    chessColor(piece);

  const type =
    chessType(piece);

  const enemy =
    color === "w"
      ? "b"
      : "w";

  const moves = [];


  const pushIf = (
    nr,
    nc
  ) => {

    if (
      !inBoard(
        nr,
        nc
      )
    ) {
      return false;
    }

    const target =
      board[nr][nc];

    if (!target) {

      moves.push([
        nr,
        nc
      ]);

      return true;
    }

    if (
      chessColor(target) ===
      enemy
    ) {

      moves.push([
        nr,
        nc
      ]);

    }

    return false;

  };


  const slide =
    directions => {

      for (
        const [
          dr,
          dc
        ]
        of directions
      ) {

        let nr =
          r + dr;

        let nc =
          c + dc;

        while (
          inBoard(
            nr,
            nc
          )
        ) {

          const target =
            board[nr][nc];

          if (!target) {

            moves.push([
              nr,
              nc
            ]);

          } else {

            if (
              chessColor(target) ===
              enemy
            ) {

              moves.push([
                nr,
                nc
              ]);

            }

            break;

          }

          nr += dr;

          nc += dc;

        }

      }

    };


  if (
    type === "p"
  ) {

    const direction =
      color === "w"
        ? -1
        : 1;

    const startRow =
      color === "w"
        ? 6
        : 1;


    if (
      inBoard(
        r + direction,
        c
      ) &&
      !board[
        r + direction
      ][c]
    ) {

      moves.push([
        r + direction,
        c
      ]);


      if (
        r === startRow &&
        !board[
          r + 2 * direction
        ][c]
      ) {

        moves.push([
          r + 2 * direction,
          c
        ]);

      }

    }


    for (
      const dc
      of [-1, 1]
    ) {

      const nr =
        r + direction;

      const nc =
        c + dc;

      if (
        inBoard(
          nr,
          nc
        ) &&
        board[nr][nc] &&
        chessColor(
          board[nr][nc]
        ) === enemy
      ) {

        moves.push([
          nr,
          nc
        ]);

      }

    }

  } else if (
    type === "r"
  ) {

    slide([
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]);

  } else if (
    type === "b"
  ) {

    slide([
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1]
    ]);

  } else if (
    type === "q"
  ) {

    slide([
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1]
    ]);

  } else if (
    type === "n"
  ) {

    for (
      const [
        dr,
        dc
      ]
      of [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2]
      ]
    ) {

      pushIf(
        r + dr,
        c + dc
      );

    }

  } else if (
    type === "k"
  ) {

    for (
      const [
        dr,
        dc
      ]
      of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      ]
    ) {

      pushIf(
        r + dr,
        c + dc
      );

    }

  }

  return moves;

}


function chessSquareName(
  r,
  c
) {

  return `${
    "abcdefgh"[c]
  }${8 - r}`;

}


function renderChess() {

  GameCenter.activeGame =
    "chess";

  if (!GameCenter.chess) {
    resetChess();
  }

  renderContentHeader(
    "Games",
    "Chess vs GALAXY"
  );

  const tabs =
    $("#contentTabs");

  if (tabs) {
    tabs.innerHTML = "";
  }

  const game =
    GameCenter.chess;

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  root.innerHTML = `
    <section
      class="game-shell chess-shell"
    >

      <div class="game-topline">

        ${gameBackButton()}

        <div
          class="game-status ${
            game.gameOver
              ? "game-over"
              : ""
          }"
        >
          ${escapeHTML(game.status)}
        </div>

        <button
          class="text-action"
          data-chess-reset
        >
          ↻ New game
        </button>

      </div>


      <div class="chess-layout">

        <div class="chess-board-wrap">

          <div
            class="chess-board"
            role="grid"
            aria-label="Chess board"
          >

            ${game.board
              .map(
                (row, r) =>
                  row
                    .map(
                      (piece, c) => {

                        const selected =
                          game.selected &&
                          game.selected[0] === r &&
                          game.selected[1] === c;

                        const legal =
                          game.legal.some(
                            (
                              [
                                lr,
                                lc
                              ]
                            ) =>
                              lr === r &&
                              lc === c
                          );

                        const dark =
                          (
                            r + c
                          ) %
                          2 ===
                          1;

                        return `
                          <button
                            class="
                              chess-square
                              ${
                                dark
                                  ? "dark"
                                  : "light"
                              }
                              ${
                                selected
                                  ? "selected"
                                  : ""
                              }
                              ${
                                legal
                                  ? "legal"
                                  : ""
                              }
                            "
                            data-chess-square="${r},${c}"
                            aria-label="${
                              chessSquareName(
                                r,
                                c
                              )
                            } ${
                              piece
                                ? CHESS_PIECES[
                                    piece
                                  ]
                                : "empty"
                            }"
                          >

                            ${
                              piece

                                ? `
                                  <span
                                    class="
                                      chess-piece
                                      ${
                                        piece[0] ===
                                        "w"
                                          ? "white-piece"
                                          : "black-piece"
                                      }
                                    "
                                  >
                                    ${
                                      CHESS_PIECES[
                                        piece
                                      ]
                                    }
                                  </span>
                                `

                                : ""
                            }

                            ${
                              legal
                                ? `
                                  <span
                                    class="legal-dot"
                                  ></span>
                                `
                                : ""
                            }

                          </button>
                        `;

                      }
                    )
                    .join("")
              )
              .join("")}

          </div>


          <div class="chess-files">

            ${"abcdefgh"
              .split("")
              .map(
                letter => `
                  <span>
                    ${letter}
                  </span>
                `
              )
              .join("")}

          </div>

        </div>


        <aside class="game-side-panel">

          <div
            class="player-card active-player"
          >

            <span class="player-avatar">
              H
            </span>

            <div>

              <strong>
                You
              </strong>

              <span>
                White
              </span>

            </div>

          </div>


          <div class="player-card">

            <span
              class="player-avatar galaxy-avatar"
            >
              ✦
            </span>

            <div>

              <strong>
                GALAXY
              </strong>

              <span>
                Black
              </span>

            </div>

          </div>


          <div class="move-history">

            <strong>
              Moves
            </strong>

            <div class="move-history-list">

              ${
                game.moveHistory.length

                  ? game.moveHistory
                      .map(
                        (move, index) => `
                          <span>
                            ${
                              index + 1
                            }.
                            ${
                              escapeHTML(move)
                            }
                          </span>
                        `
                      )
                      .join("")

                  : `
                    <span>
                      No moves yet
                    </span>
                  `
              }

            </div>

          </div>


          <p class="game-note">
            Click one of your white pieces,
            then click a highlighted square.
          </p>

        </aside>

      </div>

    </section>
  `;

}


function chessMove(
  fromR,
  fromC,
  toR,
  toC,
  actor
) {

  const game =
    GameCenter.chess;

  if (
    !game ||
    game.gameOver
  ) {
    return;
  }

  const piece =
    game.board[
      fromR
    ][fromC];

  const captured =
    game.board[
      toR
    ][toC];

  game.board[
    toR
  ][toC] =
    piece;

  game.board[
    fromR
  ][fromC] =
    null;


  if (
    piece === "wp" &&
    toR === 0
  ) {

    game.board[
      toR
    ][toC] =
      "wq";

  }


  if (
    piece === "bp" &&
    toR === 7
  ) {

    game.board[
      toR
    ][toC] =
      "bq";

  }


  game.moveHistory.push(
    `${
      actor === "w"
        ? "You"
        : "GALAXY"
    }: ${
      chessSquareName(
        fromR,
        fromC
      )
    } → ${
      chessSquareName(
        toR,
        toC
      )
    }`
  );


  if (
    captured === "bk"
  ) {

    game.gameOver = true;

    game.status =
      "You win — Black king captured";

    return;

  }


  if (
    captured === "wk"
  ) {

    game.gameOver = true;

    game.status =
      "GALAXY wins — White king captured";

    return;

  }


  game.turn =
    actor === "w"
      ? "b"
      : "w";

  game.status =
    game.turn === "w"
      ? "Your turn"
      : "GALAXY is thinking…";

}


function handleChessSquare(
  r,
  c
) {

  const game =
    GameCenter.chess;

  if (
    !game ||
    game.gameOver ||
    game.turn !== "w"
  ) {
    return;
  }

  const piece =
    game.board[r][c];


  if (!game.selected) {

    if (
      piece &&
      chessColor(piece) ===
      "w"
    ) {

      game.selected = [
        r,
        c
      ];

      game.legal =
        chessMovesFor(
          game.board,
          r,
          c
        );

      renderChess();

    }

    return;

  }


  const [
    selectedR,
    selectedC
  ] =
    game.selected;


  const isLegal =
    game.legal.some(
      (
        [
          legalR,
          legalC
        ]
      ) =>
        legalR === r &&
        legalC === c
    );


  if (isLegal) {

    chessMove(
      selectedR,
      selectedC,
      r,
      c,
      "w"
    );

    game.selected = null;

    game.legal = [];

    renderChess();


    if (!game.gameOver) {

      setTimeout(
        galaxyChessMove,
        420
      );

    }

    return;

  }


  if (
    piece &&
    chessColor(piece) ===
    "w"
  ) {

    game.selected = [
      r,
      c
    ];

    game.legal =
      chessMovesFor(
        game.board,
        r,
        c
      );

  } else {

    game.selected = null;

    game.legal = [];

  }

  renderChess();

}


function galaxyChessMove() {

  const game =
    GameCenter.chess;

  if (
    !game ||
    game.gameOver ||
    game.turn !== "b"
  ) {
    return;
  }

  const options = [];


  for (
    let r = 0;
    r < 8;
    r++
  ) {

    for (
      let c = 0;
      c < 8;
      c++
    ) {

      const piece =
        game.board[r][c];

      if (
        piece &&
        chessColor(piece) ===
        "b"
      ) {

        for (
          const [
            targetR,
            targetC
          ]
          of chessMovesFor(
            game.board,
            r,
            c
          )
        ) {

          options.push([
            r,
            c,
            targetR,
            targetC
          ]);

        }

      }

    }

  }


  if (!options.length) {

    game.gameOver = true;

    game.status =
      "You win — GALAXY has no moves";

    renderChess();

    return;

  }


  const captures =
    options.filter(
      (
        [
          ,
          ,
          targetR,
          targetC
        ]
      ) =>
        game.board[
          targetR
        ][targetC]
    );


  const pool =
    captures.length
      ? captures
      : options;


  const [
    r,
    c,
    targetR,
    targetC
  ] =
    pool[
      Math.floor(
        Math.random() *
        pool.length
      )
    ];


  chessMove(
    r,
    c,
    targetR,
    targetC,
    "b"
  );

  renderChess();

}


/* =========================================================
   TIC TAC TOE
   ========================================================= */

function resetTicTacToe() {

  GameCenter.ticTacToe = {

    board:
      Array(9).fill(""),

    turn:
      "X",

    status:
      "Your turn",

    gameOver:
      false

  };

}


function tttWinner(board) {

  const lines = [

    [0, 1, 2],

    [3, 4, 5],

    [6, 7, 8],

    [0, 3, 6],

    [1, 4, 7],

    [2, 5, 8],

    [0, 4, 8],

    [2, 4, 6]

  ];


  for (
    const [
      a,
      b,
      c
    ]
    of lines
  ) {

    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {

      return board[a];

    }

  }


  return board.every(Boolean)
    ? "draw"
    : null;

}


function renderTicTacToe() {

  GameCenter.activeGame =
    "tictactoe";

  if (!GameCenter.ticTacToe) {
    resetTicTacToe();
  }


  renderContentHeader(
    "Games",
    "Tic-Tac-Toe"
  );


  const tabs =
    $("#contentTabs");

  if (tabs) {
    tabs.innerHTML = "";
  }


  const game =
    GameCenter.ticTacToe;


  const root =
    $("#contentBody");

  if (!root) {
    return;
  }


  root.innerHTML = `
    <section
      class="game-shell small-game-shell"
    >

      <div class="game-topline">

        ${gameBackButton()}

        <div class="game-status">
          ${escapeHTML(game.status)}
        </div>

        <button
          class="text-action"
          data-ttt-reset
        >
          ↻ New game
        </button>

      </div>


      <div class="ttt-board">

        ${game.board
          .map(
            (value, index) => `
              <button
                class="
                  ttt-cell
                  ${
                    value
                      ? "filled"
                      : ""
                  }
                "
                data-ttt-cell="${index}"
              >

                ${
                  value === "X"
                    ? "✕"
                    : value === "O"
                      ? "○"
                      : ""
                }

              </button>
            `
          )
          .join("")}

      </div>

    </section>
  `;

}


function handleTttCell(index) {

  const game =
    GameCenter.ticTacToe;

  if (
    !game ||
    game.gameOver ||
    game.turn !== "X" ||
    game.board[index]
  ) {
    return;
  }


  game.board[index] =
    "X";


  let winner =
    tttWinner(game.board);


  if (winner) {

    game.gameOver = true;

    game.status =
      winner === "draw"
        ? "Draw"
        : "You win";

    renderTicTacToe();

    return;

  }


  game.turn =
    "O";

  game.status =
    "GALAXY is thinking…";

  renderTicTacToe();


  setTimeout(
    () => {

      const empty =
        game.board
          .map(
            (value, index) =>
              value
                ? null
                : index
          )
          .filter(
            value =>
              value !== null
          );


      if (!empty.length) {
        return;
      }


      const choice =
        empty[
          Math.floor(
            Math.random() *
            empty.length
          )
        ];


      game.board[choice] =
        "O";


      winner =
        tttWinner(
          game.board
        );


      if (winner) {

        game.gameOver = true;

        game.status =
          winner === "draw"
            ? "Draw"
            : "GALAXY wins";

      } else {

        game.turn =
          "X";

        game.status =
          "Your turn";

      }


      renderTicTacToe();

    },
    350
  );

}


/* =========================================================
   CONNECT FOUR
   ========================================================= */

function resetConnectFour() {

  GameCenter.connectFour = {

    board:
      Array.from(
        { length: 6 },
        () =>
          Array(7).fill("")
      ),

    turn:
      "R",

    status:
      "Your turn",

    gameOver:
      false

  };

}


function inBoardConnect(
  r,
  c
) {

  return (
    r >= 0 &&
    r < 6 &&
    c >= 0 &&
    c < 7
  );

}


function connectWinner(board) {

  for (
    let r = 0;
    r < 6;
    r++
  ) {

    for (
      let c = 0;
      c < 7;
      c++
    ) {

      const piece =
        board[r][c];

      if (!piece) {
        continue;
      }


      for (
        const [
          dr,
          dc
        ]
        of [
          [0, 1],
          [1, 0],
          [1, 1],
          [1, -1]
        ]
      ) {

        let ok = true;


        for (
          let k = 1;
          k < 4;
          k++
        ) {

          const nr =
            r +
            dr * k;

          const nc =
            c +
            dc * k;


          if (
            !inBoardConnect(
              nr,
              nc
            ) ||
            board[nr][nc] !==
            piece
          ) {

            ok = false;

            break;

          }

        }


        if (ok) {
          return piece;
        }

      }

    }

  }

  return null;

}


function dropConnect(
  board,
  column,
  piece
) {

  for (
    let r = 5;
    r >= 0;
    r--
  ) {

    if (
      !board[r][column]
    ) {

      board[r][column] =
        piece;

      return r;

    }

  }

  return -1;

}


function renderConnectFour() {

  GameCenter.activeGame =
    "connect4";

  if (!GameCenter.connectFour) {
    resetConnectFour();
  }


  renderContentHeader(
    "Games",
    "Connect Four"
  );


  const tabs =
    $("#contentTabs");

  if (tabs) {
    tabs.innerHTML = "";
  }


  const game =
    GameCenter.connectFour;


  const root =
    $("#contentBody");

  if (!root) {
    return;
  }


  root.innerHTML = `
    <section
      class="game-shell connect-shell"
    >

      <div class="game-topline">

        ${gameBackButton()}

        <div class="game-status">
          ${escapeHTML(game.status)}
        </div>

        <button
          class="text-action"
          data-connect-reset
        >
          ↻ New game
        </button>

      </div>


      <div class="connect-columns">

        ${Array.from(
          { length: 7 },
          (_, column) => `
            <button
              data-connect-column="${column}"
              aria-label="Drop in column ${column + 1}"
            >
              ↓
            </button>
          `
        ).join("")}

      </div>


      <div class="connect-board">

        ${game.board
          .map(
            row =>
              row
                .map(
                  cell => `
                    <div class="connect-cell">

                      <span
                        class="
                          connect-disc
                          ${
                            cell === "R"
                              ? "player"
                              : cell === "Y"
                                ? "galaxy"
                                : ""
                          }
                        "
                      ></span>

                    </div>
                  `
                )
                .join("")
          )
          .join("")}

      </div>


      <div class="connect-legend">

        <span>

          <i
            class="legend-disc player"
          ></i>

          You

        </span>

        <span>

          <i
            class="legend-disc galaxy"
          ></i>

          GALAXY

        </span>

      </div>

    </section>
  `;

}


function handleConnectColumn(
  column
) {

  const game =
    GameCenter.connectFour;

  if (
    !game ||
    game.gameOver ||
    game.turn !== "R"
  ) {
    return;
  }


  if (
    dropConnect(
      game.board,
      column,
      "R"
    ) <
    0
  ) {
    return;
  }


  let winner =
    connectWinner(
      game.board
    );


  if (winner) {

    game.gameOver =
      true;

    game.status =
      "You win";

    renderConnectFour();

    return;

  }


  game.turn =
    "Y";

  game.status =
    "GALAXY is thinking…";

  renderConnectFour();


  setTimeout(
    () => {

      const openColumns = [];


      for (
        let c = 0;
        c < 7;
        c++
      ) {

        if (
          !game.board[0][c]
        ) {

          openColumns.push(c);

        }

      }


      if (!openColumns.length) {

        game.gameOver =
          true;

        game.status =
          "Draw";

        renderConnectFour();

        return;

      }


      const chosenColumn =
        openColumns[
          Math.floor(
            Math.random() *
            openColumns.length
          )
        ];


      dropConnect(
        game.board,
        chosenColumn,
        "Y"
      );


      winner =
        connectWinner(
          game.board
        );


      if (winner) {

        game.gameOver =
          true;

        game.status =
          "GALAXY wins";

      } else {

        game.turn =
          "R";

        game.status =
          "Your turn";

      }


      renderConnectFour();

    },
    350
  );

}


/* =========================================================
   MEMORY
   ========================================================= */

function resetMemory() {

  const values = [
    "♛",
    "♞",
    "✦",
    "◫",
    "⌘",
    "♜",
    "◇",
    "◉"
  ];


  const cards = [
    ...values,
    ...values
  ]
    .map(
      (value, index) => ({
        id: index,
        value,
        revealed: false,
        matched: false
      })
    )
    .sort(
      () =>
        Math.random() -
        0.5
    );


  GameCenter.memory = {

    cards,

    first:
      null,

    locked:
      false,

    moves:
      0,

    matches:
      0,

    status:
      "Find all matching pairs"

  };

}


function renderMemory() {

  GameCenter.activeGame =
    "memory";

  if (!GameCenter.memory) {
    resetMemory();
  }


  renderContentHeader(
    "Games",
    "Memory"
  );


  const tabs =
    $("#contentTabs");

  if (tabs) {
    tabs.innerHTML = "";
  }


  const game =
    GameCenter.memory;


  const root =
    $("#contentBody");

  if (!root) {
    return;
  }


  root.innerHTML = `
    <section
      class="game-shell memory-shell"
    >

      <div class="game-topline">

        ${gameBackButton()}

        <div class="game-status">
          ${escapeHTML(game.status)}
          ·
          ${game.moves}
          moves
        </div>

        <button
          class="text-action"
          data-memory-reset
        >
          ↻ New game
        </button>

      </div>


      <div class="memory-board">

        ${game.cards
          .map(
            (card, index) => `
              <button
                class="
                  memory-card
                  ${
                    card.revealed ||
                    card.matched
                      ? "revealed"
                      : ""
                  }
                  ${
                    card.matched
                      ? "matched"
                      : ""
                  }
                "
                data-memory-card="${index}"
              >

                <span class="memory-card-back">
                  ✦
                </span>

                <span class="memory-card-front">
                  ${escapeHTML(card.value)}
                </span>

              </button>
            `
          )
          .join("")}

      </div>

    </section>
  `;

}


function handleMemoryCard(index) {

  const game =
    GameCenter.memory;

  if (
    !game ||
    game.locked
  ) {
    return;
  }


  const card =
    game.cards[index];


  if (
    !card ||
    card.revealed ||
    card.matched
  ) {
    return;
  }


  card.revealed =
    true;


  if (
    game.first ===
    null
  ) {

    game.first =
      index;

    renderMemory();

    return;

  }


  game.moves++;


  const first =
    game.cards[
      game.first
    ];


  if (
    first.value ===
    card.value
  ) {

    first.matched =
      true;

    card.matched =
      true;

    game.matches++;

    game.first =
      null;


    game.status =
      game.matches === 8
        ? "Perfect — all pairs matched!"
        : "Match found";


    renderMemory();

    return;

  }


  const previous =
    game.first;


  game.first =
    null;

  game.locked =
    true;

  game.status =
    "Try again";


  renderMemory();


  setTimeout(
    () => {

      game.cards[
        previous
      ].revealed =
        false;


      game.cards[
        index
      ].revealed =
        false;


      game.locked =
        false;


      game.status =
        "Find all matching pairs";


      renderMemory();

    },
    650
  );

}


function openGame(name) {

  if (
    name === "chess"
  ) {

    renderChess();

  } else if (
    name === "tictactoe"
  ) {

    renderTicTacToe();

  } else if (
    name === "connect4"
  ) {

    renderConnectFour();

  } else if (
    name === "memory"
  ) {

    renderMemory();

  }

}


/* =========================================================
   TOOLS
   ========================================================= */

function renderTools() {

  renderContentHeader(
    "Power",
    "Tools"
  );

  renderContentTabs(
    [
      ["all", "All"],
      ["developer", "Developer"],
      ["creative", "Creative"],
      ["utilities", "Utilities"]
    ],
    "all",
    "tools"
  );

  const root =
    $("#contentBody");

  if (!root) {
    return;
  }

  const tools = [

    [
      "⌘",
      "Command Palette",
      "command"
    ],

    [
      "✦",
      "Prompt Templates",
      "prompt-templates"
    ],

    [
      "{}",
      "JSON Viewer",
      "json-viewer"
    ],

    [
      "⇄",
      "Diff Viewer",
      "diff-viewer"
    ],

    [
      "▦",
      "Scratchpad",
      "scratchpad"
    ],

    [
      "◌",
      "Focus Mode",
      "focus"
    ]

  ];

  root.innerHTML = `
    <div class="resource-grid">

      ${tools
        .map(
          ([icon, name, action]) => `
          <button
            class="resource-card"
            data-tool-action="${action}"
          >

            <div class="resource-icon">
              ${icon}
            </div>

            <div class="resource-copy">

              <strong>
                ${escapeHTML(name)}
              </strong>

              <span>
                Open tool
              </span>

            </div>

            <span class="resource-arrow">
              ›
            </span>

          </button>
        `
        )
        .join("")}

    </div>
  `;

}


/* =========================================================
   VIEW ROUTER
   ========================================================= */

function openWorkspaceView(view) {

  Galaxy.state.view =
    view;

  $("#chatView")
    ?.classList.remove(
      "active-view"
    );

  $("#workView")
    ?.classList.remove(
      "active-view"
    );

  $("#contentView")
    ?.classList.add(
      "active-view"
    );

  $$(".nav-row, .menu-row")
    .forEach(
      item =>
        item.classList.toggle(
          "active",
          item.dataset.view ===
            view
        )
    );

  const routes = {

    projects:
      renderProjects,

    library:
      renderLibrary,

    scheduled:
      renderScheduled,

    plugins:
      renderPlugins,

    packs:
      renderPacks,

    images:
      renderImages,

    sites:
      renderSites,

    gpts:
      renderAgents,

    games:
      renderGames,

    tools:
      renderTools

  };

  routes[view]?.();

}


/* =========================================================
   SEARCH
   ========================================================= */

function searchEverything(query) {

  const q =
    query
      .trim()
      .toLowerCase();

  if (!q) {
    return [];
  }

  const results = [];


  Galaxy.state.chats.forEach(
    chat => {

      if (
        chat.title
          .toLowerCase()
          .includes(q) ||

        chat.messages
          .some(
            message =>
              String(
                message.text
              )
                .toLowerCase()
                .includes(q)
          )
      ) {

        results.push({

          type:
            "chat",

          id:
            chat.id,

          title:
            chat.title,

          icon:
            "◌"

        });

      }

    }
  );


  Galaxy.state.projects
    .forEach(
      project => {

        if (
          project.name
            .toLowerCase()
            .includes(q)
        ) {

          results.push({

            type:
              "project",

            id:
              project.id,

            title:
              project.name,

            icon:
              "▱"

          });

        }

      }
    );


  Galaxy.state.packs
    .forEach(
      pack => {

        if (
          pack.name
            .toLowerCase()
            .includes(q) ||

          pack.items.some(
            item =>
              item
                .toLowerCase()
                .includes(q)
          )
        ) {

          results.push({

            type:
              "pack",

            id:
              pack.id,

            title:
              pack.name,

            icon:
              pack.icon

          });

        }

      }
    );


  Galaxy.state.library
    .forEach(
      item => {

        if (
          item.name
            .toLowerCase()
            .includes(q)
        ) {

          results.push({

            type:
              "library",

            id:
              item.id,

            title:
              item.name,

            icon:
              item.type ===
              "image"
                ? "◫"
                : item.type ===
                  "video"
                  ? "▷"
                  : "▱"

          });

        }

      }
    );


  Galaxy.state.agents
    .forEach(
      agent => {

        if (
          agent.name
            .toLowerCase()
            .includes(q)
        ) {

          results.push({

            type:
              "agent",

            id:
              agent.id,

            title:
              agent.name,

            icon:
              "✧"

          });

        }

      }
    );


  return results.slice(
    0,
    80
  );

}


/* =========================================================
   COMMAND PALETTE
   ========================================================= */

const COMMANDS = [

  {
    name:
      "New chat",

    shortcut:
      "Ctrl N",

    run:
      newChat
  },

  {
    name:
      "Search",

    shortcut:
      "Ctrl K",

    run:
      openSearch
  },

  {
    name:
      "Projects",

    run:
      () =>
        openWorkspaceView(
          "projects"
        )
  },

  {
    name:
      "Library",

    run:
      () =>
        openWorkspaceView(
          "library"
        )
  },

  {
    name:
      "Packs",

    run:
      () =>
        openWorkspaceView(
          "packs"
        )
  },

  {
    name:
      "Gaming Center",

    run:
      () =>
        openWorkspaceView(
          "games"
        )
  },

  {
    name:
      "Scheduled",

    run:
      () =>
        openWorkspaceView(
          "scheduled"
        )
  },

  {
    name:
      "Plugins",

    run:
      () =>
        openWorkspaceView(
          "plugins"
        )
  },

  {
    name:
      "Images",

    run:
      () =>
        openWorkspaceView(
          "images"
        )
  },

  {
    name:
      "Sites",

    run:
      () =>
        openWorkspaceView(
          "sites"
        )
  },

  {
    name:
      "GPTs",

    run:
      () =>
        openWorkspaceView(
          "gpts"
        )
  },

  {
    name:
      "Prompt templates",

    run:
      openPromptTemplates
  },

  {
    name:
      "Chat mode",

    shortcut:
      "Alt 1",

    run:
      () =>
        switchMode(
          "chat"
        )
  },

  {
    name:
      "Work mode",

    shortcut:
      "Alt 2",

    run:
      () =>
        switchMode(
          "work"
        )
  },

  {
    name:
      "Focus mode",

    shortcut:
      "Ctrl .",

    run:
      toggleFocusMode
  },

  {
    name:
      "Toggle theme",

    shortcut:
      "Ctrl /",

    run:
      toggleTheme
  },

  {
    name:
      "Settings",

    run:
      openSettings
  }

];


function openCommandPalette(
  mode = "command"
) {

  const root =
    $("#overlayRoot");

  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="overlay">

      <section
        class="command-palette"
        role="dialog"
        aria-modal="true"
      >

        <input
          id="commandInput"
          class="command-input"
          placeholder="${
            mode ===
            "search"
              ? "Search chats, projects, Packs, files..."
              : "Type a command..."
          }"
          autocomplete="off"
          data-command-mode="${mode}"
        >

        <div
          id="commandList"
          class="command-list"
        ></div>

      </section>

    </div>
  `;

  renderCommandResults(
    "",
    mode
  );

  setTimeout(
    () =>
      $("#commandInput")
        ?.focus(),
    0
  );

}


function openSearch() {

  openCommandPalette(
    "search"
  );

}


function renderCommandResults(
  query,
  mode
) {

  const root =
    $("#commandList");

  if (!root) {
    return;
  }


  if (
    mode === "search"
  ) {

    const results =
      searchEverything(
        query
      );


    root.innerHTML =
      query

        ? results.length

          ? results
              .map(
                item => `
                <button
                  class="command-row"
                  data-search-result="${item.type}"
                  data-search-id="${item.id}"
                >

                  <span class="command-icon">
                    ${item.icon}
                  </span>

                  <span>
                    ${escapeHTML(item.title)}
                  </span>

                  <small>
                    ${escapeHTML(item.type)}
                  </small>

                </button>
              `
              )
              .join("")

          : `
            <div class="empty-panel">
              No results.
            </div>
          `

        : `
          <div class="command-hint">
            Start typing to search GALAXY AI.
          </div>
        `;

    return;

  }


  const q =
    query.toLowerCase();


  root.innerHTML =
    COMMANDS

      .filter(
        item =>
          item.name
            .toLowerCase()
            .includes(q)
      )

      .map(
        item => `
          <button
            class="command-row"
            data-command-name="${escapeHTML(item.name)}"
          >

            <span>
              ${escapeHTML(item.name)}
            </span>

            ${
              item.shortcut

                ? `
                  <kbd>
                    ${escapeHTML(item.shortcut)}
                  </kbd>
                `

                : ""
            }

          </button>
        `
      )

      .join("");

}


function openSearchResult(
  type,
  id
) {

  closeOverlay();


  if (
    type === "chat"
  ) {

    Galaxy.state.currentChatId =
      id;

    persistAll();

    switchMode(
      "chat"
    );

    renderChat();

    renderRecentChats();

    return;

  }


  if (
    type === "project"
  ) {

    openWorkspaceView(
      "projects"
    );

    return;

  }


  if (
    type === "pack"
  ) {

    openWorkspaceView(
      "packs"
    );

    setTimeout(
      () =>
        openPack(id),
      0
    );

    return;

  }


  if (
    type === "library"
  ) {

    openWorkspaceView(
      "library"
    );

    setTimeout(
      () =>
        previewLibraryItem(id),
      0
    );

    return;

  }


  if (
    type === "agent"
  ) {

    openWorkspaceView(
      "gpts"
    );

  }

}


/* =========================================================
   WEB SEARCH STATE
   ========================================================= */

function toggleWebSearch() {

  Galaxy.state.webSearchState =
    Galaxy.state.webSearchState ===
    "off"
      ? "ready"
      : "off";

  persistAll();

  renderWebSearchState();

  toast(
    Galaxy.state.webSearchState ===
    "ready"
      ? "Web search enabled"
      : "Web search disabled"
  );

}


function renderWebSearchState() {

  const button =
    $('[data-action="web-search"]');

  if (!button) {
    return;
  }

  button.classList.toggle(
    "active",
    Galaxy.state.webSearchState ===
      "ready"
  );

  button.dataset.state =
    Galaxy.state.webSearchState;

}


/* =========================================================
   VOICE
   ========================================================= */

function toggleVoiceRecording() {

  if (
    Galaxy.state.voiceState ===
    "recording"
  ) {

    stopVoiceRecording();

  } else {

    startVoiceRecording();

  }

}


function startVoiceRecording() {

  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!Recognition) {

    toast(
      "Voice recognition is not supported."
    );

    return;
  }

  const recognition =
    new Recognition();

  recognition.lang =
    Galaxy.state.settings
      .voiceLanguage;

  recognition.continuous =
    true;

  recognition.interimResults =
    true;

  Galaxy.state.voiceRecognition =
    recognition;

  Galaxy.state.voiceState =
    "recording";

  renderVoiceState();


  recognition.onresult =
    event => {

      let transcript = "";


      for (
        let i =
          event.resultIndex;

        i <
        event.results.length;

        i++
      ) {

        transcript +=
          event.results[
            i
          ][0].transcript;

      }


      const input =
        $("#promptInput");


      if (input) {

        input.value =
          transcript;

        autoResizeTextarea(input);

      }

    };


  recognition.onerror =
    event => {

      Galaxy.state.voiceState =
        "error";

      renderVoiceState();

      toast(
        `Voice error: ${event.error}`,
        "error"
      );

    };


  recognition.onend =
    () => {

      Galaxy.state.voiceState =
        "idle";

      renderVoiceState();

    };


  recognition.start();

}


function stopVoiceRecording() {

  Galaxy.state
    .voiceRecognition
    ?.stop();

  Galaxy.state.voiceRecognition =
    null;

  Galaxy.state.voiceState =
    "idle";

  renderVoiceState();

}


function renderVoiceState() {

  const button =
    $('[data-action="voice"]');

  if (!button) {
    return;
  }

  button.classList.toggle(
    "recording",
    Galaxy.state.voiceState ===
      "recording"
  );

}


/* =========================================================
   TOOL ACTIVITY
   ========================================================= */

function showToolActivity(text) {

  const root =
    $("#toolActivity");

  if (!root) {
    return;
  }

  root.hidden = false;

  const label =
    $("#toolActivityText");

  if (label) {
    label.textContent =
      text;
  }

}


function hideToolActivity() {

  const root =
    $("#toolActivity");

  if (root) {
    root.hidden = true;
  }

}


/* =========================================================
   SEND / STOP STATE
   ========================================================= */

function updateSendButtonState() {

  const button =
    $("#sendButton");

  if (!button) {
    return;
  }

  button.classList.toggle(
    "is-stop",
    Galaxy.state.generation
      .active
  );

  button.textContent =
    Galaxy.state.generation.active
      ? "■"
      : "↑";

  button.setAttribute(
    "aria-label",
    Galaxy.state.generation.active
      ? "Stop"
      : "Send"
  );

}


function stopGeneration() {

  Galaxy.state.generation.stopped =
    true;

  Galaxy.state.generation
    .controller
    ?.abort();

  Galaxy.state.generation.active =
    false;

  updateSendButtonState();

  hideToolActivity();

}


/* =========================================================
   REAL AI BACKEND
   ========================================================= */

async function fetchAIResponse(
  prompt,
  extra = {}
) {

  const provider =
    $("#aiProvider")?.value ||
    "openai";


  const endpoint =
    provider === "gemini"
      ? "/api/gemini"
      : "/api/chat";


  const response =
    await fetch(
      endpoint,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            message:
              prompt,

            provider,

            webSearch:
              Galaxy.state.webSearchState ===
              "ready",

            mode:
              extra.mode ||
              Galaxy.state.mode,

            history:
              getCurrentChat()
                ?.messages
                ?.slice(-20)
                .map(
                  item => ({

                    role:
                      item.role,

                    content:
                      item.text

                  })
                ) ||
              []

          }),

        signal:
          Galaxy.state.generation
            .controller
            ?.signal

      }
    );


  let data;


  try {

    data =
      await response.json();

  } catch {

    throw new Error(
      "GALAXY received an invalid response."
    );

  }


  if (!response.ok) {

    throw new Error(
      data.error ||
      `AI request failed (${response.status})`
    );

  }


  return (
    data.reply ||
    data.message ||
    data.output ||
    data.text ||
    "No response received."
  );

}


/* =========================================================
   AI GENERATION
   ========================================================= */

async function generateAssistantReply(
  prompt
) {

  const chat =
    ensureCurrentChat();


  Galaxy.state.generation.active =
    true;


  Galaxy.state.generation.stopped =
    false;


  Galaxy.state.generation.controller =
    new AbortController();


  const message = {

    id:
      uid("msg"),

    role:
      "assistant",

    text: "",

    createdAt:
      now(),

    updatedAt:
      now()

  };


  Galaxy.state.generation.messageId =
    message.id;


  chat.messages.push(message);


  renderChat();


  updateSendButtonState();


  showToolActivity(
    Galaxy.state.webSearchState ===
    "ready"
      ? "Searching and thinking…"
      : "Thinking…"
  );


  try {

    const fullText =
      await fetchAIResponse(
        prompt
      );


    if (
      !Galaxy.state.settings
        .streaming
    ) {

      message.text =
        fullText;

    } else {

      const chunks =
        fullText.match(
          /.{1,12}/gs
        ) ||
        [fullText];


      for (
        const chunk
        of chunks
      ) {

        if (
          Galaxy.state.generation
            .stopped
        ) {
          break;
        }


        message.text +=
          chunk;


        message.updatedAt =
          now();


        renderChat();


        await sleep(
          Galaxy.state.settings
            .streamSpeed
        );

      }

    }


    chat.updatedAt =
      now();


    persistAll();

  } catch (error) {

    if (
      error.name !==
      "AbortError"
    ) {

      message.text = `
I couldn't reach the GALAXY AI backend.

${error.message}

Make sure your selected Vercel AI route is deployed: **/api/chat** for OpenAI or **/api/gemini** for Gemini.
`.trim();


      handleError(
        error,
        "AI"
      );

    }

  } finally {

    Galaxy.state.generation.active =
      false;


    Galaxy.state.generation.controller =
      null;


    hideToolActivity();


    updateSendButtonState();


    renderChat();


    persistAll();

  }

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

  if (
    Galaxy.state.generation.active
  ) {

    stopGeneration();

    return;
  }


  const input =
    $("#promptInput");


  if (!input) {
    return;
  }


  const text =
    input.value.trim();


  if (
    !text &&
    !Galaxy.state.attachments
      .length
  ) {
    return;
  }


  const chat =
    ensureCurrentChat();


  const messageText =
    text ||
    describeAttachments();


  chat.messages.push({

    id:
      uid("msg"),

    role:
      "user",

    text:
      messageText,

    createdAt:
      now(),

    updatedAt:
      now()

  });


  if (
    chat.title ===
    "New conversation"
  ) {

    chat.title =
      messageText.slice(
        0,
        48
      );

  }


  chat.updatedAt =
    now();


  input.value = "";


  autoResizeTextarea(input);


  DB.remove("draft");


  Galaxy.state.attachments =
    [];


  renderAttachments();


  persistAll();


  renderRecentChats();


  renderChat();


  await generateAssistantReply(
    messageText
  );

}


/* =========================================================
   SIDEBAR
   ========================================================= */

function toggleSidebar() {

  const app =
    $("#app");

  if (!app) {
    return;
  }

  if (
    window.innerWidth <= 900
  ) {

    app.classList.toggle(
      "mobile-sidebar-open"
    );

  } else {

    app.classList.toggle(
      "sidebar-collapsed"
    );

  }

}


/* =========================================================
   SHARE
   ========================================================= */

function shareWorkspace() {

  if (navigator.share) {

    navigator.share({

      title:
        "GALAXY AI",

      text:
        "GALAXY AI Workspace",

      url:
        location.href

    })
    .catch(
      () => {}
    );

  } else {

    copyText(
      location.href
    );

  }

}


/* =========================================================
   JSON VIEWER
   ========================================================= */

function openJSONViewer() {

  openModal({

    title:
      "JSON Viewer",

    body: `
      <div class="form-stack">

        <textarea
          id="jsonViewerInput"
          class="field textarea-field"
          placeholder='{"hello":"GALAXY"}'
        ></textarea>

        <button
          id="formatJSONButton"
          class="text-action primary"
        >
          Format JSON
        </button>

        <pre
          id="jsonViewerOutput"
          class="code-block"
        ></pre>

      </div>
    `

  });


  setTimeout(
    () => {

      on(
        $("#formatJSONButton"),
        "click",
        () => {

          try {

            $("#jsonViewerOutput")
              .textContent =
              JSON.stringify(
                JSON.parse(
                  $("#jsonViewerInput")
                    .value
                ),
                null,
                2
              );

          } catch (error) {

            $("#jsonViewerOutput")
              .textContent =
              `Invalid JSON: ${error.message}`;

          }

        }
      );

    },
    0
  );

}


/* =========================================================
   DIFF VIEWER
   ========================================================= */

function openDiffViewer() {

  openModal({

    title:
      "Diff Viewer",

    width:
      "900px",

    body: `
      <div class="diff-grid">

        <textarea
          id="diffLeft"
          class="field textarea-field"
          placeholder="Original text"
        ></textarea>

        <textarea
          id="diffRight"
          class="field textarea-field"
          placeholder="Changed text"
        ></textarea>

      </div>

      <button
        id="compareDiffButton"
        class="text-action primary"
      >
        Compare
      </button>

      <div
        id="diffOutput"
        class="diff-output"
      ></div>
    `

  });


  setTimeout(
    () => {

      on(
        $("#compareDiffButton"),
        "click",
        () => {

          const left =
            $("#diffLeft")
              ?.value ||
            "";


          const right =
            $("#diffRight")
              ?.value ||
            "";


          $("#diffOutput")
            .innerHTML =
            left === right

              ? `
                <div class="empty-panel">
                  Text is identical.
                </div>
              `

              : `
                <div class="diff-result">

                  <div>

                    <strong>
                      Original
                    </strong>

                    <pre>${escapeHTML(left)}</pre>

                  </div>

                  <div>

                    <strong>
                      Changed
                    </strong>

                    <pre>${escapeHTML(right)}</pre>

                  </div>

                </div>
              `;

        }
      );

    },
    0
  );

}


/* =========================================================
   SCRATCHPAD
   ========================================================= */

function openScratchpad() {

  openModal({

    title:
      "Scratchpad",

    body: `
      <textarea
        id="scratchpadInput"
        class="field textarea-field scratchpad-field"
        placeholder="Write anything..."
      >${escapeHTML(
        DB.get(
          "scratchpad",
          ""
        )
      )}</textarea>
    `

  });


  setTimeout(
    () => {

      on(
        $("#scratchpadInput"),
        "input",
        event => {

          DB.set(
            "scratchpad",
            event.target.value
          );

        }
      );

    },
    0
  );

}


function handleToolAction(action) {

  if (
    action === "command"
  ) {

    openCommandPalette();

  } else if (
    action ===
    "prompt-templates"
  ) {

    openPromptTemplates();

  } else if (
    action ===
    "json-viewer"
  ) {

    openJSONViewer();

  } else if (
    action ===
    "diff-viewer"
  ) {

    openDiffViewer();

  } else if (
    action ===
    "scratchpad"
  ) {

    openScratchpad();

  } else if (
    action ===
    "focus"
  ) {

    toggleFocusMode();

  }

}


/* =========================================================
   CONTEXT MENU
   ========================================================= */

function closeContextMenu() {

  $$(".context-menu")
    .forEach(
      menu =>
        menu.remove()
    );

}


function openContextMenu(
  type,
  id,
  x,
  y
) {

  closeContextMenu();


  const menu =
    document.createElement(
      "div"
    );


  menu.className =
    "context-menu";


  menu.style.left =
    `${x}px`;


  menu.style.top =
    `${y}px`;


  if (
    type === "chat"
  ) {

    const chat =
      Galaxy.state.chats.find(
        item =>
          item.id === id
      );


    if (!chat) {
      return;
    }


    menu.innerHTML = `
      <button
        class="context-row"
        data-context-action="rename-chat"
        data-context-id="${id}"
      >
        ✎
        <span>
          Rename
        </span>
      </button>

      <button
        class="context-row"
        data-context-action="pin-chat"
        data-context-id="${id}"
      >
        ◉
        <span>
          ${
            chat.pinned
              ? "Unpin"
              : "Pin"
          }
        </span>
      </button>

      <button
        class="context-row"
        data-context-action="archive-chat"
        data-context-id="${id}"
      >
        ▱
        <span>
          ${
            chat.archived
              ? "Restore"
              : "Archive"
          }
        </span>
      </button>

      <button
        class="context-row"
        data-context-action="export-chat"
        data-context-id="${id}"
      >
        ↗
        <span>
          Export
        </span>
      </button>

      <button
        class="context-row danger"
        data-context-action="delete-chat"
        data-context-id="${id}"
      >
        ×
        <span>
          Delete
        </span>
      </button>
    `;

  }


  if (
    type === "project"
  ) {

    menu.innerHTML = `
      <button
        class="context-row"
        data-context-action="edit-project"
        data-context-id="${id}"
      >
        ✎
        <span>
          Edit
        </span>
      </button>

      <button
        class="context-row danger"
        data-context-action="delete-project"
        data-context-id="${id}"
      >
        ×
        <span>
          Delete
        </span>
      </button>
    `;

  }


  document.body.appendChild(
    menu
  );

}


function handleContextAction(
  action,
  id
) {

  closeContextMenu();


  if (
    action ===
    "rename-chat"
  ) {

    renameChat(id);

  } else if (
    action ===
    "pin-chat"
  ) {

    togglePinChat(id);

  } else if (
    action ===
    "archive-chat"
  ) {

    toggleArchiveChat(id);

  } else if (
    action ===
    "export-chat"
  ) {

    exportConversation(id);

  } else if (
    action ===
    "delete-chat"
  ) {

    deleteChat(id);

  } else if (
    action ===
    "edit-project"
  ) {

    editProject(id);

  } else if (
    action ===
    "delete-project"
  ) {

    deleteProject(id);

  }

}


/* =========================================================
   CONTENT TABS
   ========================================================= */

function handleContentTab(
  group,
  tab
) {

  if (
    group === "library"
  ) {

    renderLibrary(tab);

  } else if (
    group === "packs"
  ) {

    renderPacks(tab);

  }


  $$(".flat-tab")
    .forEach(
      button =>
        button.classList.toggle(
          "active",
          button.dataset.contentTab ===
            tab
        )
    );

}


/* =========================================================
   FILE INPUTS
   ========================================================= */

function bindFileInputs() {

  on(
    $("#fileInput"),
    "change",
    event => {

      addFiles(
        event.target.files
      );

      event.target.value = "";

    }
  );


  on(
    $("#imageInput"),
    "change",
    event => {

      addFiles(
        event.target.files
      );


      Array.from(
        event.target.files ||
        []
      )
        .forEach(
          addLibraryFile
        );


      event.target.value =
        "";

    }
  );


  on(
    $("#videoInput"),
    "change",
    event => {

      addFiles(
        event.target.files
      );


      Array.from(
        event.target.files ||
        []
      )
        .forEach(
          addLibraryFile
        );


      event.target.value =
        "";

    }
  );


  on(
    $("#libraryInput"),
    "change",
    event => {

      Array.from(
        event.target.files ||
        []
      )
        .forEach(
          addLibraryFile
        );


      event.target.value =
        "";

    }
  );


  on(
    $("#conversationImportInput"),
    "change",
    event => {

      const file =
        event.target.files?.[0];


      if (file) {

        importConversation(file);

      }


      event.target.value =
        "";

    }
  );

}


/* =========================================================
   CLICK ROUTER
   ========================================================= */

function handleClick(event) {

  const action =
    event.target.closest(
      "[data-action]"
    )?.dataset.action;


  const view =
    event.target.closest(
      "[data-view]"
    )?.dataset.view;


  const chatOpen =
    event.target.closest(
      "[data-chat-open]"
    )?.dataset.chatOpen;


  const contextOpen =
    event.target.closest(
      "[data-context-open]"
    );


  const contextAction =
    event.target.closest(
      "[data-context-action]"
    );


  const contentTab =
    event.target.closest(
      "[data-content-tab]"
    );


  const searchResult =
    event.target.closest(
      "[data-search-result]"
    );


  const command =
    event.target.closest(
      "[data-command-name]"
    );


  const toolAction =
    event.target.closest(
      "[data-tool-action]"
    )?.dataset.toolAction;


  const copyCode =
    event.target.closest(
      "[data-copy-code]"
    )?.dataset.copyCode;


  const copyMessage =
    event.target.closest(
      "[data-copy-message]"
    )?.dataset.copyMessage;


  const editMessageId =
    event.target.closest(
      "[data-edit-message]"
    )?.dataset.editMessage;


  const retryMessageId =
    event.target.closest(
      "[data-retry-message]"
    )?.dataset.retryMessage;


  const readMessageId =
    event.target.closest(
      "[data-read-message]"
    )?.dataset.readMessage;


  const branchMessageId =
    event.target.closest(
      "[data-branch-message]"
    )?.dataset.branchMessage;


  const removeAttachmentId =
    event.target.closest(
      "[data-remove-attachment]"
    )?.dataset.removeAttachment;


  const previewLibraryId =
    event.target.closest(
      "[data-preview-library]"
    )?.dataset.previewLibrary;


  const favoriteId =
    event.target.closest(
      "[data-library-favorite]"
    )?.dataset.libraryFavorite;


  const deleteLibraryId =
    event.target.closest(
      "[data-delete-library]"
    )?.dataset.deleteLibrary;


  const editProjectId =
    event.target.closest(
      "[data-edit-project]"
    )?.dataset.editProject;


  const toggleScheduledId =
    event.target.closest(
      "[data-toggle-scheduled]"
    )?.dataset.toggleScheduled;


  const deleteScheduledId =
    event.target.closest(
      "[data-delete-scheduled]"
    )?.dataset.deleteScheduled;


  const pluginInstallId =
    event.target.closest(
      "[data-plugin-install]"
    )?.dataset.pluginInstall;


  const pluginConnectId =
    event.target.closest(
      "[data-plugin-connect]"
    )?.dataset.pluginConnect;


  const editAgentId =
    event.target.closest(
      "[data-edit-agent]"
    )?.dataset.editAgent;


  const openSiteId =
    event.target.closest(
      "[data-open-site]"
    )?.dataset.openSite;


  const siteTab =
    event.target.closest(
      "[data-site-tab]"
    )?.dataset.siteTab;


  const openPackId =
    event.target.closest(
      "[data-open-pack]"
    )?.dataset.openPack;


  const packInstallId =
    event.target.closest(
      "[data-pack-install-toggle]"
    )?.dataset.packInstallToggle;


  const packItem =
    event.target.closest(
      "[data-pack-item]"
    )?.dataset.packItem;


  const promptId =
    event.target.closest(
      "[data-use-prompt]"
    )?.dataset.usePrompt;


  const workView =
    event.target.closest(
      "[data-work-view]"
    )?.dataset.workView;


  const gameOpen =
    event.target.closest(
      "[data-game-open]"
    )?.dataset.gameOpen;


  const gameBack =
    event.target.closest(
      "[data-game-back]"
    );


  const chessSquare =
    event.target.closest(
      "[data-chess-square]"
    )?.dataset.chessSquare;


  const tttCell =
    event.target.closest(
      "[data-ttt-cell]"
    )?.dataset.tttCell;


  const connectColumn =
    event.target.closest(
      "[data-connect-column]"
    )?.dataset.connectColumn;


  const memoryCard =
    event.target.closest(
      "[data-memory-card]"
    )?.dataset.memoryCard;


  const chessReset =
    event.target.closest(
      "[data-chess-reset]"
    );


  const tttReset =
    event.target.closest(
      "[data-ttt-reset]"
    );


  const connectReset =
    event.target.closest(
      "[data-connect-reset]"
    );


  const memoryReset =
    event.target.closest(
      "[data-memory-reset]"
    );


  if (
    event.target
      .classList
      .contains(
        "overlay"
      )
  ) {

    closeOverlay();

  }


  if (view) {

    openWorkspaceView(view);

  }


  if (chatOpen) {

    Galaxy.state.currentChatId =
      chatOpen;

    persistAll();

    switchMode("chat");

    renderRecentChats();

    renderChat();

  }


  if (contextOpen) {

    const rect =
      contextOpen
        .getBoundingClientRect();

    openContextMenu(
      contextOpen.dataset
        .contextOpen,
      contextOpen.dataset
        .contextId,
      rect.right,
      rect.bottom
    );

  }


  if (contextAction) {

    handleContextAction(
      contextAction.dataset
        .contextAction,
      contextAction.dataset
        .contextId
    );

  }


  if (contentTab) {

    handleContentTab(
      contentTab.dataset
        .contentGroup,
      contentTab.dataset
        .contentTab
    );

  }


  if (searchResult) {

    openSearchResult(
      searchResult.dataset
        .searchResult,
      searchResult.dataset
        .searchId
    );

  }


  if (command) {

    const item =
      COMMANDS.find(
        entry =>
          entry.name ===
          command.dataset
            .commandName
      );

    closeOverlay();

    item?.run?.();

  }


  if (toolAction) {

    handleToolAction(
      toolAction
    );

  }


  if (copyCode) {

    copyText(
      decodeURIComponent(
        copyCode
      )
    );

  }


  if (copyMessage) {

    const message =
      getCurrentChat()
        ?.messages
        .find(
          item =>
            item.id ===
            copyMessage
        );

    if (message) {
      copyText(message.text);
    }

  }


  if (editMessageId) {
    editMessage(editMessageId);
  }


  if (retryMessageId) {
    retryMessage(retryMessageId);
  }


  if (readMessageId) {
    readAloud(readMessageId);
  }


  if (branchMessageId) {
    branchConversation(
      branchMessageId
    );
  }


  if (removeAttachmentId) {
    removeAttachment(
      removeAttachmentId
    );
  }


  if (previewLibraryId) {
    previewLibraryItem(
      previewLibraryId
    );
  }


  if (favoriteId) {
    toggleLibraryFavorite(
      favoriteId
    );
  }


  if (deleteLibraryId) {
    deleteLibraryItem(
      deleteLibraryId
    );
  }


  if (editProjectId) {
    editProject(
      editProjectId
    );
  }


  if (toggleScheduledId) {
    toggleScheduledTask(
      toggleScheduledId
    );
  }


  if (deleteScheduledId) {
    deleteScheduledTask(
      deleteScheduledId
    );
  }


  if (pluginInstallId) {
    togglePluginInstall(
      pluginInstallId
    );
  }


  if (pluginConnectId) {
    togglePluginConnection(
      pluginConnectId
    );
  }


  if (editAgentId) {

    const agent =
      Galaxy.state.agents.find(
        item =>
          item.id ===
          editAgentId
      );

    if (agent) {
      openAgentEditor(agent);
    }

  }


  if (openSiteId) {
    openSiteEditor(openSiteId);
  }


  if (siteTab) {
    switchSiteEditorTab(
      siteTab
    );
  }


  if (openPackId) {
    openPack(openPackId);
  }


  if (packInstallId) {
    togglePackInstall(
      packInstallId
    );
  }


  if (packItem) {

    switchMode("chat");

    const input =
      $("#promptInput");

    if (input) {

      input.value =
        packItem;

      autoResizeTextarea(input);

      input.focus();

    }

  }


  if (promptId) {
    usePromptTemplate(
      promptId
    );
  }


  if (
    workView ===
    "preview"
  ) {

    previewWorkDocument();

  }


  if (
    workView ===
    "edit"
  ) {

    renderWorkDocument();

  }


  if (gameOpen) {

    openGame(gameOpen);

  }


  if (gameBack) {

    renderGames();

  }


  if (chessSquare) {

    const [r, c] =
      chessSquare
        .split(",")
        .map(Number);

    handleChessSquare(
      r,
      c
    );

  }


  if (
    tttCell !== undefined
  ) {

    handleTttCell(
      Number(tttCell)
    );

  }


  if (
    connectColumn !== undefined
  ) {

    handleConnectColumn(
      Number(connectColumn)
    );

  }


  if (
    memoryCard !== undefined
  ) {

    handleMemoryCard(
      Number(memoryCard)
    );

  }


  if (chessReset) {

    resetChess();

    renderChess();

  }


  if (tttReset) {

    resetTicTacToe();

    renderTicTacToe();

  }


  if (connectReset) {

    resetConnectFour();

    renderConnectFour();

  }


  if (memoryReset) {

    resetMemory();

    renderMemory();

  }


  if (action) {

    if (
      action === "home"
    ) {

      switchMode("chat");

    } else if (
      action === "new-chat"
    ) {

      newChat();

    } else if (
      action === "search"
    ) {

      openSearch();

    } else if (
      action === "command"
    ) {

      openCommandPalette();

    } else if (
      action ===
      "toggle-sidebar"
    ) {

      toggleSidebar();

    } else if (
      action ===
      "toggle-more"
    ) {

      const menu =
        $("#moreMenu");

      if (menu) {
        menu.hidden =
          !menu.hidden;
      }

    } else if (
      action === "attach"
    ) {

      $("#fileInput")
        ?.click();

    } else if (
      action === "image"
    ) {

      $("#imageInput")
        ?.click();

    } else if (
      action === "video"
    ) {

      $("#videoInput")
        ?.click();

    } else if (
      action === "voice"
    ) {

      toggleVoiceRecording();

    } else if (
      action ===
      "web-search"
    ) {

      toggleWebSearch();

    } else if (
      action === "send"
    ) {

      sendMessage();

    } else if (
      action ===
      "send-work"
    ) {

      sendWorkMessage();

    } else if (
      action === "focus"
    ) {

      toggleFocusMode();

    } else if (
      action ===
      "notifications"
    ) {

      openNotifications();

    } else if (
      action ===
      "settings"
    ) {

      openSettings();

    } else if (
      action === "share"
    ) {

      shareWorkspace();

    } else if (
      action ===
      "close-overlay"
    ) {

      closeOverlay();

    } else if (
      action ===
      "new-project"
    ) {

      createProject();

    } else if (
      action ===
      "new-scheduled"
    ) {

      createScheduledTask();

    } else if (
      action ===
      "new-agent"
    ) {

      createAgent();

    } else if (
      action ===
      "new-site"
    ) {

      createSite();

    } else if (
      action ===
      "new-image"
    ) {

      createImageConcept();

    } else if (
      action ===
      "save-site"
    ) {

      saveActiveSite();

    } else if (
      action ===
      "preview-site"
    ) {

      previewActiveSite();

    } else if (
      action ===
      "prompt-templates"
    ) {

      openPromptTemplates();

    } else if (
      action ===
      "library-upload"
    ) {

      $("#libraryInput")
        ?.click();

    } else if (
      action ===
      "refresh-preview"
    ) {

      renderWorkDocument();

    } else if (
      action ===
      "fullscreen-preview"
    ) {

      $("#previewSurface")
        ?.requestFullscreen
        ?.();

    } else if (
      action ===
      "reset-data"
    ) {

      confirmAction({

        title:
          "Reset GALAXY",

        message:
          "Delete all locally saved GALAXY data?",

        confirmLabel:
          "Reset",

        onConfirm() {

          DB.clear();

          location.reload();

        }

      });

    }

  }

}


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {

  document.addEventListener(
    "click",
    handleClick
  );


  document.addEventListener(
    "contextmenu",
    event => {

      const target =
        event.target.closest(
          "[data-context-type]"
        );

      if (!target) {
        return;
      }

      event.preventDefault();

      openContextMenu(
        target.dataset
          .contextType,
        target.dataset
          .contextId,
        event.clientX,
        event.clientY
      );

    }
  );


  document.addEventListener(
    "input",
    event => {

      if (
        event.target.id ===
        "promptInput"
      ) {

        autoResizeTextarea(
          event.target
        );

        if (
          Galaxy.state.settings
            .autosave
        ) {

          clearTimeout(
            bindEvents.draftTimer
          );

          bindEvents.draftTimer =
            setTimeout(
              () => {

                DB.set(
                  "draft",
                  event.target.value
                );

              },
              Galaxy.state.settings
                .autosaveDelay
            );

        }

      }


      if (
        event.target.id ===
        "commandInput"
      ) {

        renderCommandResults(
          event.target.value,
          event.target.dataset
            .commandMode
        );

      }

    }
  );


  document.addEventListener(
    "change",
    event => {

      const select =
        event.target.closest(
          "[data-setting-select]"
        );

      if (!select) {
        return;
      }

      Galaxy.state.settings[
        select.dataset
          .settingSelect
      ] =
        select.value;

      persistAll();

      applyTheme();

    }
  );


  document.addEventListener(
    "click",
    event => {

      const toggle =
        event.target.closest(
          "[data-setting-toggle]"
        );

      if (!toggle) {
        return;
      }

      const key =
        toggle.dataset
          .settingToggle;

      Galaxy.state.settings[
        key
      ] =
        !Galaxy.state.settings[
          key
        ];

      persistAll();

      applyTheme();

      toggle.classList.toggle(
        "active",
        !!Galaxy.state.settings[
          key
        ]
      );

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.target.id ===
        "promptInput" &&
        event.key ===
        "Enter" &&
        !event.shiftKey &&
        Galaxy.state.settings
          .enterToSend
      ) {

        event.preventDefault();

        sendMessage();

        return;
      }


      const mod =
        event.ctrlKey ||
        event.metaKey;


      if (
        event.key ===
        "Escape"
      ) {

        closeOverlay();

        closeContextMenu();

      } else if (
        mod &&
        event.key
          .toLowerCase() ===
        "k"
      ) {

        event.preventDefault();

        openSearch();

      } else if (
        mod &&
        event.key
          .toLowerCase() ===
        "n"
      ) {

        event.preventDefault();

        newChat();

      } else if (
        mod &&
        event.key === "."
      ) {

        event.preventDefault();

        toggleFocusMode();

      } else if (
        mod &&
        event.key === "/"
      ) {

        event.preventDefault();

        toggleTheme();

      } else if (
        event.altKey &&
        event.key === "1"
      ) {

        event.preventDefault();

        switchMode("chat");

      } else if (
        event.altKey &&
        event.key === "2"
      ) {

        event.preventDefault();

        switchMode("work");

      }

    }
  );


  $$(".mode-tab")
    .forEach(
      tab => {

        on(
          tab,
          "click",
          () =>
            switchMode(
              tab.dataset.mode
            )
        );

      }
    );


  [
    "dragenter",
    "dragover"
  ]
    .forEach(
      type => {

        document.addEventListener(
          type,
          event => {

            event.preventDefault();

            Galaxy.state.dragCounter++;

            document.body
              .classList
              .add(
                "dragging"
              );

          }
        );

      }
    );


  document.addEventListener(
    "dragleave",
    event => {

      event.preventDefault();

      Galaxy.state.dragCounter =
        Math.max(
          0,
          Galaxy.state.dragCounter -
          1
        );

      if (
        !Galaxy.state.dragCounter
      ) {

        document.body
          .classList
          .remove(
            "dragging"
          );

      }

    }
  );


  document.addEventListener(
    "drop",
    event => {

      event.preventDefault();

      Galaxy.state.dragCounter =
        0;

      document.body
        .classList
        .remove(
          "dragging"
        );

      if (
        event.dataTransfer
          ?.files
          ?.length
      ) {

        addFiles(
          event.dataTransfer
            .files
        );

      }

    }
  );


  window.addEventListener(
    "resize",
    () => {

      if (
        window.innerWidth >
        900
      ) {

        $("#app")
          ?.classList
          .remove(
            "mobile-sidebar-open"
          );

      }

    }
  );


  window.addEventListener(
    "blur",
    closeContextMenu
  );


  bindFileInputs();

}


/* =========================================================
   START
   ========================================================= */

function initGalaxy() {

  seedData();

  applyTheme();


  if (
    Galaxy.state.currentChatId &&
    !Galaxy.state.chats.some(
      chat =>
        chat.id ===
        Galaxy.state.currentChatId
    )
  ) {

    Galaxy.state.currentChatId =
      null;

  }


  if (
    !Galaxy.state.currentChatId &&
    Galaxy.state.chats.length
  ) {

    Galaxy.state.currentChatId =
      Galaxy.state.chats[0].id;

  }


  const draft =
    DB.get(
      "draft",
      ""
    );


  const input =
    $("#promptInput");


  if (input) {

    input.value =
      draft;

    autoResizeTextarea(input);

  }


  renderRecentChats();


  renderChat();


  renderWebSearchState();


  renderVoiceState();


  updateNotificationIndicator();


  updateSendButtonState();


  bindEvents();


  switchMode("chat");


  console.log(
    `GALAXY AI ${Galaxy.version} ready`
  );

}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initGalaxy,
    {
      once: true
    }
  );

} else {

  initGalaxy();

}
