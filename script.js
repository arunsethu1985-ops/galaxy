"use strict";

/* =========================================================
   GALAXY AI
   COMPLETE FRONT-END APPLICATION CONTROLLER
   ========================================================= */

/* =========================================================
   SECTION 01 — DOM HELPERS
   ========================================================= */

const $ = (selector, root = document) => {
  return root.querySelector(selector);
};

const $$ = (selector, root = document) => {
  return Array.from(root.querySelectorAll(selector));
};

const on = (target, type, handler, options) => {
  if (!target) return;
  target.addEventListener(type, handler, options);
};

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

const now = () => {
  return Date.now();
};

const uid = prefix => {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const escapeHTML = value => {
  return String(value).replace(
    /[&<>"']/g,
    character =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
  );
};

const formatBytes = bytes => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDate = timestamp => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
};

const formatTime = timestamp => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
};

/* =========================================================
   SECTION 02 — LOCAL DATABASE HELPERS
   ========================================================= */

const DB = {
  prefix: "galaxy.ai.",

  key(name) {
    return `${this.prefix}${name}`;
  },

  get(name, fallback = null) {
    try {
      const raw = localStorage.getItem(this.key(name));

      if (raw === null) {
        return fallback;
      }

      return JSON.parse(raw);
    } catch (error) {
      console.error("GALAXY DB GET ERROR:", name, error);
      return fallback;
    }
  },

  set(name, value) {
    try {
      localStorage.setItem(this.key(name), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("GALAXY DB SET ERROR:", name, error);
      return false;
    }
  },

  remove(name) {
    try {
      localStorage.removeItem(this.key(name));
      return true;
    } catch (error) {
      console.error("GALAXY DB REMOVE ERROR:", name, error);
      return false;
    }
  },

  clear() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));

      return true;
    } catch (error) {
      console.error("GALAXY DB CLEAR ERROR:", error);
      return false;
    }
  },

  backup() {
    const data = {};

    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => {
        data[key] = localStorage.getItem(key);
      });

    return data;
  }
};

/* =========================================================
   SECTION 03 — DEFAULT SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {
  theme: "dark",
  accent: "violet",
  compactSidebar: false,
  focusMode: false,
  enterToSend: true,
  autosave: true,
  autosaveDelay: 350,
  sound: false,
  reducedMotion: false,
  showTimestamps: false,
  autoTitleChats: true,
  rememberChats: true,
  streaming: true,
  streamSpeed: 14,
  webSearchDefault: false,
  voiceLanguage: "en-US",
  notifications: true,
  previewFiles: true,
  confirmDeletes: true
};

/* =========================================================
   SECTION 04 — APPLICATION STATE
   ========================================================= */

const Galaxy = {
  version: "3.0.0",

  state: {
    mode: "chat",
    view: "chat",

    sidebarOpen: true,

    settings: {
      ...DEFAULT_SETTINGS,
      ...DB.get("settings", {})
    },

    chats: DB.get("chats", []),

    currentChatId: DB.get("currentChatId", null),

    projects: DB.get("projects", []),

    library: DB.get("library", []),

    packs: DB.get("packs", []),

    scheduled: DB.get("scheduled", []),

    plugins: DB.get("plugins", []),

    agents: DB.get("agents", []),

    sites: DB.get("sites", []),

    images: DB.get("images", []),

    prompts: DB.get("prompts", []),

    notifications: DB.get("notifications", []),

    attachments: [],

    activeSearch: "",

    activeSearchFilter: "all",

    activeLibraryFilter: "all",

    activePackFilter: "all",

    activeProjectId: null,

    activeSiteId: null,

    activeAgentId: null,

    activeWorkDocumentId: null,

    webSearchState: "off",

    voiceState: "idle",

    voiceRecognition: null,

    generation: {
      active: false,
      stopped: false,
      controller: null,
      messageId: null
    },

    dragCounter: 0,

    contextTarget: null,

    workDocuments: DB.get("workDocuments", [])
  }
};

/* =========================================================
   SECTION 05 — DEFAULT PACKS
   ========================================================= */

const DEFAULT_PACKS = [
  {
    id: "pack_prompt_master",
    name: "Ultimate Prompt Pack",
    category: "prompt",
    icon: "✦",
    description: "Advanced prompts for research, writing, planning and analysis.",
    tags: ["prompt", "productivity", "research"],
    installed: true,
    featured: true,
    items: [
      "Deep Research Prompt",
      "Executive Summary Prompt",
      "Business Strategy Prompt",
      "Critical Thinking Prompt",
      "Decision Matrix Prompt",
      "Learning Tutor Prompt",
      "Idea Expansion Prompt",
      "Professional Rewrite Prompt",
      "Comparison Analysis Prompt",
      "Step-by-Step Planner"
    ]
  },

  {
    id: "pack_website_builder",
    name: "Website Builder Pack",
    category: "website",
    icon: "⌘",
    description: "Prompts, structures and workflows for creating modern websites.",
    tags: ["website", "code", "design"],
    installed: true,
    featured: true,
    items: [
      "Landing Page Builder",
      "Portfolio Builder",
      "Business Website Builder",
      "SaaS Website Builder",
      "Dashboard Builder",
      "Documentation Builder",
      "Responsive Layout Prompt",
      "Accessibility Review Prompt",
      "SEO Page Prompt",
      "UI Improvement Prompt"
    ]
  },

  {
    id: "pack_creator",
    name: "Creator Power Pack",
    category: "creator",
    icon: "◫",
    description: "Content creation workflows for posts, videos and campaigns.",
    tags: ["creator", "video", "social"],
    installed: true,
    featured: true,
    items: [
      "YouTube Script",
      "Short Video Script",
      "Instagram Caption",
      "Content Calendar",
      "Hook Generator",
      "Thumbnail Idea Generator",
      "Video Storyboard",
      "Voiceover Script",
      "Viral Rewrite",
      "Campaign Generator"
    ]
  },

  {
    id: "pack_productivity",
    name: "Productivity Pack",
    category: "productivity",
    icon: "✓",
    description: "Organize tasks, meetings, goals and schedules.",
    tags: ["productivity", "planning"],
    installed: true,
    featured: false,
    items: [
      "Daily Planner",
      "Weekly Planner",
      "Meeting Summary",
      "Action Item Extractor",
      "Priority Matrix",
      "Goal Breakdown",
      "Time Block Planner",
      "Project Checklist",
      "Risk Register",
      "Decision Log"
    ]
  },

  {
    id: "pack_research",
    name: "Research Intelligence Pack",
    category: "research",
    icon: "⌕",
    description: "Advanced research, comparison and evidence workflows.",
    tags: ["research", "analysis"],
    installed: true,
    featured: true,
    items: [
      "Research Question Builder",
      "Source Comparison",
      "Evidence Table",
      "Fact Verification",
      "Timeline Builder",
      "Market Research",
      "Competitor Research",
      "Paper Summarizer",
      "Claim Analyzer",
      "Research Report"
    ]
  },

  {
    id: "pack_business",
    name: "Business Strategy Pack",
    category: "business",
    icon: "▱",
    description: "Professional strategy, planning and management workflows.",
    tags: ["business", "strategy"],
    installed: true,
    featured: false,
    items: [
      "SWOT Analysis",
      "Market Entry Plan",
      "Business Model",
      "Pricing Strategy",
      "Growth Strategy",
      "Customer Persona",
      "Sales Plan",
      "Operations Plan",
      "Risk Analysis",
      "Executive Memo"
    ]
  },

  {
    id: "pack_coding",
    name: "Developer Pack",
    category: "developer",
    icon: "</>",
    description: "Coding, debugging and software architecture workflows.",
    tags: ["code", "developer"],
    installed: true,
    featured: true,
    items: [
      "Code Generator",
      "Bug Finder",
      "Code Reviewer",
      "Refactor Assistant",
      "API Designer",
      "Database Designer",
      "System Architect",
      "Security Review",
      "Performance Review",
      "Test Generator"
    ]
  },

  {
    id: "pack_design",
    name: "Design System Pack",
    category: "design",
    icon: "◇",
    description: "UI systems, product design and visual direction.",
    tags: ["design", "ui", "ux"],
    installed: true,
    featured: false,
    items: [
      "Design System Generator",
      "UI Audit",
      "UX Review",
      "Color System",
      "Typography System",
      "Spacing System",
      "Component Planner",
      "Mobile UI Planner",
      "Dashboard Designer",
      "Accessibility Audit"
    ]
  },

  {
    id: "pack_video",
    name: "Video Creator Pack",
    category: "video",
    icon: "▷",
    description: "Video ideas, scenes, scripts and production plans.",
    tags: ["video", "creator"],
    installed: true,
    featured: false,
    items: [
      "30 Second Video",
      "60 Second Video",
      "Scene Generator",
      "Shot List",
      "Character Prompt",
      "Camera Prompt",
      "Lighting Prompt",
      "Voiceover Generator",
      "Video Caption",
      "Video Title Generator"
    ]
  },

  {
    id: "pack_startup",
    name: "Startup Launch Pack",
    category: "startup",
    icon: "↗",
    description: "Launch ideas, validate products and prepare go-to-market plans.",
    tags: ["startup", "business"],
    installed: true,
    featured: true,
    items: [
      "Idea Validator",
      "Problem Statement",
      "MVP Planner",
      "Feature Prioritizer",
      "Launch Checklist",
      "Pitch Deck Outline",
      "Investor Q&A",
      "Go-To-Market Plan",
      "User Interview Guide",
      "Growth Experiment"
    ]
  },

  {
    id: "pack_data",
    name: "Data Analysis Pack",
    category: "data",
    icon: "▦",
    description: "Analyze tables, trends, metrics and structured data.",
    tags: ["data", "analysis"],
    installed: true,
    featured: false,
    items: [
      "Dataset Summary",
      "Trend Detection",
      "Anomaly Detection",
      "Metric Explanation",
      "KPI Builder",
      "Dashboard Planner",
      "Forecast Prompt",
      "CSV Analyzer",
      "Data Cleaning Plan",
      "Insight Generator"
    ]
  },

  {
    id: "pack_learning",
    name: "Learning Pack",
    category: "education",
    icon: "◎",
    description: "Tutoring, quizzes, explanations and study workflows.",
    tags: ["education", "study"],
    installed: true,
    featured: false,
    items: [
      "Teach Me Simply",
      "Quiz Me",
      "Flashcard Generator",
      "Study Plan",
      "Exam Revision",
      "Explain Like I'm 10",
      "Step-by-Step Math",
      "Vocabulary Trainer",
      "Practice Questions",
      "Concept Comparison"
    ]
  }
];

/* =========================================================
   SECTION 06 — DEFAULT PROMPT TEMPLATES
   ========================================================= */

const DEFAULT_PROMPTS = [
  {
    id: "prompt_build_site",
    title: "Build a modern website",
    category: "website",
    prompt:
      "Build a modern responsive website with excellent typography, spacing, accessibility and mobile behavior."
  },

  {
    id: "prompt_research",
    title: "Deep research",
    category: "research",
    prompt:
      "Research this topic deeply. Separate facts, assumptions, uncertainties, risks and conclusions."
  },

  {
    id: "prompt_project",
    title: "Project planner",
    category: "project",
    prompt:
      "Create a structured project plan with scope, milestones, tasks, owners, risks and next actions."
  },

  {
    id: "prompt_improve",
    title: "Improve my idea",
    category: "creative",
    prompt:
      "Analyze this idea, identify weaknesses and propose a much stronger version."
  },

  {
    id: "prompt_compare",
    title: "Compare options",
    category: "analysis",
    prompt:
      "Compare these options across cost, quality, risk, usability, scalability and long-term value."
  },

  {
    id: "prompt_video",
    title: "Video creator",
    category: "video",
    prompt:
      "Create a complete short-video plan with hook, scenes, dialogue, camera instructions and ending."
  },

  {
    id: "prompt_code",
    title: "Code builder",
    category: "developer",
    prompt:
      "Build production-quality code for this requirement. Keep the architecture clean and explain important tradeoffs."
  },

  {
    id: "prompt_debug",
    title: "Debug code",
    category: "developer",
    prompt:
      "Find the problem in this code, explain the root cause and provide a corrected version."
  }
];

/* =========================================================
   SECTION 07 — DEFAULT PLUGINS
   ========================================================= */

const DEFAULT_PLUGINS = [
  {
    id: "plugin_mail",
    name: "Mail",
    description: "Search messages and draft replies.",
    icon: "✉",
    installed: false,
    connected: false
  },

  {
    id: "plugin_calendar",
    name: "Calendar",
    description: "Find events and manage meetings.",
    icon: "◷",
    installed: false,
    connected: false
  },

  {
    id: "plugin_drive",
    name: "Drive",
    description: "Find and work with cloud files.",
    icon: "▱",
    installed: false,
    connected: false
  },

  {
    id: "plugin_github",
    name: "GitHub",
    description: "Explore repositories and development workflows.",
    icon: "⌘",
    installed: false,
    connected: false
  },

  {
    id: "plugin_slack",
    name: "Slack",
    description: "Search team conversations and channels.",
    icon: "#",
    installed: false,
    connected: false
  }
];

/* =========================================================
   SECTION 08 — INITIAL DATA SEEDING
   ========================================================= */

function seedGalaxyData() {
  if (!Galaxy.state.packs.length) {
    Galaxy.state.packs = structuredClone(DEFAULT_PACKS);
    DB.set("packs", Galaxy.state.packs);
  }

  if (!Galaxy.state.prompts.length) {
    Galaxy.state.prompts = structuredClone(DEFAULT_PROMPTS);
    DB.set("prompts", Galaxy.state.prompts);
  }

  if (!Galaxy.state.plugins.length) {
    Galaxy.state.plugins = structuredClone(DEFAULT_PLUGINS);
    DB.set("plugins", Galaxy.state.plugins);
  }
}

/* =========================================================
   SECTION 09 — PERSISTENCE
   ========================================================= */

function persistAll() {
  if (Galaxy.state.settings.rememberChats) {
    DB.set("chats", Galaxy.state.chats);
  }

  DB.set("currentChatId", Galaxy.state.currentChatId);

  DB.set("settings", Galaxy.state.settings);

  DB.set("projects", Galaxy.state.projects);

  DB.set("library", Galaxy.state.library);

  DB.set("packs", Galaxy.state.packs);

  DB.set("scheduled", Galaxy.state.scheduled);

  DB.set("plugins", Galaxy.state.plugins);

  DB.set("agents", Galaxy.state.agents);

  DB.set("sites", Galaxy.state.sites);

  DB.set("images", Galaxy.state.images);

  DB.set("prompts", Galaxy.state.prompts);

  DB.set("notifications", Galaxy.state.notifications);

  DB.set("workDocuments", Galaxy.state.workDocuments);
}

/* =========================================================
   SECTION 10 — TOASTS
   ========================================================= */

function toast(message, type = "default") {
  const root = $("#toastRoot");

  if (!root) return;

  const toastElement = document.createElement("div");

  toastElement.className = `toast toast-${type}`;

  toastElement.textContent = message;

  root.appendChild(toastElement);

  setTimeout(() => {
    toastElement.classList.add("toast-out");
  }, 2200);

  setTimeout(() => {
    toastElement.remove();
  }, 2600);
}

/* =========================================================
   SECTION 11 — ERROR HANDLING
   ========================================================= */

function handleError(error, context = "GALAXY AI") {
  console.error(`[${context}]`, error);

  toast(
    error?.message || "Something went wrong.",
    "error"
  );

  addNotification({
    title: "Error",
    message:
      error?.message ||
      "An unexpected error occurred.",
    type: "error"
  });
}

window.addEventListener("error", event => {
  handleError(event.error || new Error(event.message), "Window");
});

window.addEventListener("unhandledrejection", event => {
  handleError(event.reason, "Promise");
});

/* =========================================================
   SECTION 12 — NOTIFICATIONS
   ========================================================= */

function addNotification({
  title,
  message,
  type = "info"
}) {
  const notification = {
    id: uid("notification"),
    title,
    message,
    type,
    read: false,
    createdAt: now()
  };

  Galaxy.state.notifications.unshift(notification);

  Galaxy.state.notifications =
    Galaxy.state.notifications.slice(0, 100);

  DB.set("notifications", Galaxy.state.notifications);

  updateNotificationIndicator();
}

function updateNotificationIndicator() {
  const unread =
    Galaxy.state.notifications.filter(
      notification => !notification.read
    ).length;

  const button = $('[data-action="notifications"]');

  if (!button) return;

  button.dataset.count = String(unread);

  button.classList.toggle(
    "has-notifications",
    unread > 0
  );
}

function openNotifications() {
  Galaxy.state.notifications.forEach(
    notification => {
      notification.read = true;
    }
  );

  persistAll();

  updateNotificationIndicator();

  const items =
    Galaxy.state.notifications.length
      ? Galaxy.state.notifications
          .map(
            notification => `
            <article class="notification-row">

              <div class="notification-icon">
                ${notification.type === "error" ? "!" : "◔"}
              </div>

              <div class="notification-copy">

                <strong>
                  ${escapeHTML(notification.title)}
                </strong>

                <span>
                  ${escapeHTML(notification.message)}
                </span>

                <small>
                  ${formatDate(notification.createdAt)}
                  ${formatTime(notification.createdAt)}
                </small>

              </div>

            </article>
          `
          )
          .join("")
      : `
          <div class="empty-panel">
            No notifications yet.
          </div>
        `;

  openModal({
    title: "Notifications",
    body: `
      <div class="notification-list">
        ${items}
      </div>
    `
  });
}

/* =========================================================
   SECTION 13 — MODAL SYSTEM
   ========================================================= */

function closeOverlay() {
  const root = $("#overlayRoot");

  if (root) {
    root.innerHTML = "";
  }
}

function openModal({
  title,
  body,
  width = "680px"
}) {
  const root = $("#overlayRoot");

  if (!root) return;

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

/* =========================================================
   SECTION 14 — CONFIRM DIALOG
   ========================================================= */

function confirmAction({
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Delete",
  onConfirm
}) {
  if (!Galaxy.state.settings.confirmDeletes) {
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

  setTimeout(() => {
    $("#confirmActionButton")?.addEventListener(
      "click",
      () => {
        closeOverlay();
        onConfirm?.();
      }
    );
  }, 0);
}

/* =========================================================
   SECTION 15 — THEME SYSTEM
   ========================================================= */

function applyTheme() {
  const settings = Galaxy.state.settings;

  document.body.dataset.theme = settings.theme;

  document.body.classList.toggle(
    "light",
    settings.theme === "light"
  );

  document.body.classList.toggle(
    "dark",
    settings.theme === "dark"
  );

  document.body.classList.toggle(
    "reduced-motion",
    settings.reducedMotion
  );

  document.documentElement.dataset.accent =
    settings.accent;
}

function setTheme(theme) {
  Galaxy.state.settings.theme = theme;

  persistAll();

  applyTheme();

  toast(`Theme changed to ${theme}`);
}

function toggleTheme() {
  setTheme(
    Galaxy.state.settings.theme === "dark"
      ? "light"
      : "dark"
  );
}

/* =========================================================
   SECTION 16 — SETTINGS
   ========================================================= */

function openSettings() {
  const settings = Galaxy.state.settings;

  openModal({
    title: "Settings",

    body: `
      <div class="settings-list">

        ${renderSettingSelect(
          "Theme",
          "theme",
          settings.theme,
          [
            ["dark", "Dark"],
            ["light", "Light"]
          ]
        )}

        ${renderSettingSelect(
          "Accent",
          "accent",
          settings.accent,
          [
            ["violet", "Violet"],
            ["blue", "Blue"],
            ["green", "Green"],
            ["orange", "Orange"]
          ]
        )}

        ${renderSettingToggle(
          "Focus mode",
          "focusMode",
          settings.focusMode
        )}

        ${renderSettingToggle(
          "Enter to send",
          "enterToSend",
          settings.enterToSend
        )}

        ${renderSettingToggle(
          "Autosave",
          "autosave",
          settings.autosave
        )}

        ${renderSettingToggle(
          "Streaming responses",
          "streaming",
          settings.streaming
        )}

        ${renderSettingToggle(
          "Default web search",
          "webSearchDefault",
          settings.webSearchDefault
        )}

        ${renderSettingToggle(
          "Show timestamps",
          "showTimestamps",
          settings.showTimestamps
        )}

        ${renderSettingToggle(
          "Reduced motion",
          "reducedMotion",
          settings.reducedMotion
        )}

        <div class="setting-row">

          <div>
            <strong>Reset GALAXY data</strong>
            <span>Remove locally saved workspace data.</span>
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
          value ? "active" : ""
        }"
        data-setting-toggle="${escapeHTML(key)}"
        aria-pressed="${value}"
      >
        <span></span>
      </button>

    </div>
  `;
}

function renderSettingSelect(
  title,
  key,
  value,
  options
) {
  return `
    <div class="setting-row">

      <strong>
        ${escapeHTML(title)}
      </strong>

      <select
        data-setting-select="${escapeHTML(key)}"
      >

        ${options
          .map(
            ([optionValue, label]) => `
            <option
              value="${escapeHTML(optionValue)}"
              ${
                optionValue === value
                  ? "selected"
                  : ""
              }
            >
              ${escapeHTML(label)}
            </option>
          `
          )
          .join("")}

      </select>

    </div>
  `;
}

/* =========================================================
   SECTION 17 — CHAT HELPERS
   ========================================================= */

function getCurrentChat() {
  return (
    Galaxy.state.chats.find(
      chat =>
        chat.id ===
        Galaxy.state.currentChatId
    ) || null
  );
}

function ensureCurrentChat() {
  let chat = getCurrentChat();

  if (!chat) {
    chat = createChat();
  }

  return chat;
}

function createChat({
  title = "New conversation",
  messages = []
} = {}) {
  const chat = {
    id: uid("chat"),

    title,

    messages,

    pinned: false,

    archived: false,

    createdAt: now(),

    updatedAt: now(),

    branchOf: null,

    tags: []
  };

  Galaxy.state.chats.unshift(chat);

  Galaxy.state.currentChatId = chat.id;

  persistAll();

  renderRecentChats();

  renderChat();

  return chat;
}

function newChat() {
  createChat();

  switchMode("chat");

  $("#promptInput")?.focus();
}

/* =========================================================
   SECTION 18 — CHAT RENAME
   ========================================================= */

function renameChat(chatId) {
  const chat =
    Galaxy.state.chats.find(
      item => item.id === chatId
    );

  if (!chat) return;

  openModal({
    title: "Rename chat",

    body: `
      <div class="form-stack">

        <input
          id="renameChatInput"
          class="field"
          value="${escapeHTML(chat.title)}"
        >

        <button
          class="text-action primary"
          id="renameChatSave"
        >
          Save
        </button>

      </div>
    `
  });

  setTimeout(() => {
    const input = $("#renameChatInput");

    input?.focus();

    input?.select();

    $("#renameChatSave")?.addEventListener(
      "click",
      () => {
        const value = input.value.trim();

        if (!value) return;

        chat.title = value;

        chat.updatedAt = now();

        persistAll();

        renderRecentChats();

        closeOverlay();

        toast("Chat renamed");
      }
    );
  }, 0);
}

/* =========================================================
   SECTION 19 — CHAT DELETE
   ========================================================= */

function deleteChat(chatId) {
  const chat =
    Galaxy.state.chats.find(
      item => item.id === chatId
    );

  if (!chat) return;

  confirmAction({
    title: "Delete chat",

    message: `Delete “${chat.title}”?`,

    onConfirm() {
      Galaxy.state.chats =
        Galaxy.state.chats.filter(
          item => item.id !== chatId
        );

      if (
        Galaxy.state.currentChatId ===
        chatId
      ) {
        Galaxy.state.currentChatId =
          Galaxy.state.chats[0]?.id ||
          null;
      }

      persistAll();

      renderRecentChats();

      renderChat();

      toast("Chat deleted");
    }
  });
}

/* =========================================================
   SECTION 20 — CHAT PIN
   ========================================================= */

function togglePinChat(chatId) {
  const chat =
    Galaxy.state.chats.find(
      item => item.id === chatId
    );

  if (!chat) return;

  chat.pinned = !chat.pinned;

  chat.updatedAt = now();

  sortChats();

  persistAll();

  renderRecentChats();

  toast(chat.pinned ? "Chat pinned" : "Chat unpinned");
}

/* =========================================================
   SECTION 21 — CHAT ARCHIVE
   ========================================================= */

function toggleArchiveChat(chatId) {
  const chat =
    Galaxy.state.chats.find(
      item => item.id === chatId
    );

  if (!chat) return;

  chat.archived = !chat.archived;

  chat.updatedAt = now();

  persistAll();

  renderRecentChats();

  toast(
    chat.archived
      ? "Chat archived"
      : "Chat restored"
  );
}

function sortChats() {
  Galaxy.state.chats.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    return b.updatedAt - a.updatedAt;
  });
}

/* =========================================================
   SECTION 22 — CHAT BRANCHING
   ========================================================= */

function branchConversation(messageId) {
  const source = getCurrentChat();

  if (!source) return;

  const index =
    source.messages.findIndex(
      message => message.id === messageId
    );

  if (index === -1) return;

  const newChat = {
    id: uid("chat"),

    title: `${source.title} — Branch`,

    messages: structuredClone(
      source.messages.slice(0, index + 1)
    ),

    pinned: false,

    archived: false,

    createdAt: now(),

    updatedAt: now(),

    branchOf: source.id,

    tags: ["branch"]
  };

  Galaxy.state.chats.unshift(newChat);

  Galaxy.state.currentChatId = newChat.id;

  persistAll();

  renderRecentChats();

  renderChat();

  toast("Conversation branched");
}

/* =========================================================
   SECTION 23 — CHAT EXPORT
   ========================================================= */

function exportConversation(chatId) {
  const chat =
    Galaxy.state.chats.find(
      item => item.id === chatId
    );

  if (!chat) return;

  const data = JSON.stringify(
    {
      galaxyVersion: Galaxy.version,
      exportedAt: new Date().toISOString(),
      chat
    },
    null,
    2
  );

  downloadText(
    `${safeFilename(chat.title)}.galaxy.json`,
    data,
    "application/json"
  );

  toast("Conversation exported");
}

/* =========================================================
   SECTION 24 — CHAT IMPORT
   ========================================================= */

function importConversation(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed =
        JSON.parse(reader.result);

      const imported =
        parsed.chat || parsed;

      if (!Array.isArray(imported.messages)) {
        throw new Error("Invalid GALAXY conversation.");
      }

      imported.id = uid("chat");

      imported.title =
        imported.title ||
        "Imported conversation";

      imported.createdAt = now();

      imported.updatedAt = now();

      Galaxy.state.chats.unshift(imported);

      Galaxy.state.currentChatId =
        imported.id;

      persistAll();

      renderRecentChats();

      renderChat();

      toast("Conversation imported");
    } catch (error) {
      handleError(error, "Import conversation");
    }
  };

  reader.readAsText(file);
}

function safeFilename(value) {
  return String(value)
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function downloadText(
  filename,
  content,
  type = "text/plain"
) {
  const blob = new Blob([content], {
    type
  });

  const url = URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;

  anchor.download = filename;

  anchor.click();

  URL.revokeObjectURL(url);
}

/* =========================================================
   SECTION 25 — RECENT CHAT RENDER
   ========================================================= */

function renderRecentChats() {
  const root = $("#recentChats");

  if (!root) return;

  sortChats();

  const visibleChats =
    Galaxy.state.chats.filter(
      chat => !chat.archived
    );

  root.innerHTML = visibleChats
    .slice(0, 40)
    .map(
      chat => `
        <div
          class="recent-chat-row ${
            chat.id === Galaxy.state.currentChatId
              ? "active"
              : ""
          }"
          data-chat-id="${chat.id}"
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
   SECTION 26 — MARKDOWN RENDERER
   ========================================================= */

function renderMarkdown(input) {
  let html = escapeHTML(input);

  html = html.replace(
    /```([\w-]*)\n([\s\S]*?)```/g,
    (_, language, code) => {
      const encoded =
        encodeURIComponent(code);

      return `
        <div class="code-block">

          <div class="code-head">

            <span>
              ${escapeHTML(language || "code")}
            </span>

            <button
              class="code-copy"
              data-copy-code="${encoded}"
            >
              Copy
            </button>

          </div>

          <pre><code>${code}</code></pre>

        </div>
      `;
    }
  );

  html = html.replace(
    /`([^`\n]+)`/g,
    "<code class=\"inline-code\">$1</code>"
  );

  html = html.replace(
    /^### (.+)$/gm,
    "<h3>$1</h3>"
  );

  html = html.replace(
    /^## (.+)$/gm,
    "<h2>$1</h2>"
  );

  html = html.replace(
    /^# (.+)$/gm,
    "<h1>$1</h1>"
  );

  html = html.replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>"
  );

  html = html.replace(
    /\*(.+?)\*/g,
    "<em>$1</em>"
  );

  html = html.replace(
    /^> (.+)$/gm,
    "<blockquote>$1</blockquote>"
  );

  html = html.replace(
    /^- (.+)$/gm,
    "<div class=\"markdown-list-item\">• $1</div>"
  );

  html = html.replace(
    /^\d+\. (.+)$/gm,
    "<div class=\"markdown-list-item numbered\">$1</div>"
  );

  html = html.replace(
    /\n{2,}/g,
    "<br><br>"
  );

  html = html.replace(
    /\n/g,
    "<br>"
  );

  return html;
}

/* =========================================================
   SECTION 27 — CHAT MESSAGE RENDER
   ========================================================= */

function renderChat() {
  const root = $("#messages");

  const empty = $("#emptyState");

  if (!root) return;

  const chat = getCurrentChat();

  const messages = chat?.messages || [];

  if (empty) {
    empty.style.display =
      messages.length ? "none" : "";
  }

  root.innerHTML =
    messages
      .map(renderMessage)
      .join("");

  requestAnimationFrame(() => {
    const scroller =
      $("#chatScroller");

    if (scroller) {
      scroller.scrollTop =
        scroller.scrollHeight;
    }
  });
}

function renderMessage(message) {
  const isUser =
    message.role === "user";

  const actions =
    isUser
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
            data-like-message="${message.id}"
            title="Like"
          >
            ♡
          </button>

          <button
            class="message-action"
            data-dislike-message="${message.id}"
            title="Dislike"
          >
            ⌄
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

  const timestamp =
    Galaxy.state.settings.showTimestamps
      ? `
        <time class="message-time">
          ${formatTime(message.createdAt)}
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

      ${timestamp}

      ${actions}

    </article>
  `;
}

/* =========================================================
   SECTION 28 — MESSAGE EDITING
   ========================================================= */

function editMessage(messageId) {
  const chat = getCurrentChat();

  if (!chat) return;

  const message =
    chat.messages.find(
      item => item.id === messageId
    );

  if (!message) return;

  openModal({
    title: "Edit message",

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

  setTimeout(() => {
    $("#saveEditedMessage")?.addEventListener(
      "click",
      async () => {
        const value =
          $("#editMessageField")
            ?.value
            .trim();

        if (!value) return;

        const index =
          chat.messages.findIndex(
            item => item.id === messageId
          );

        message.text = value;

        message.updatedAt = now();

        chat.messages =
          chat.messages.slice(0, index + 1);

        persistAll();

        renderChat();

        closeOverlay();

        await generateAssistantReply(value);
      }
    );
  }, 0);
}

/* =========================================================
   SECTION 29 — RETRY MESSAGE
   ========================================================= */

async function retryMessage(messageId) {
  const chat = getCurrentChat();

  if (!chat) return;

  const index =
    chat.messages.findIndex(
      item => item.id === messageId
    );

  if (index === -1) return;

  const previousUser =
    [...chat.messages]
      .slice(0, index)
      .reverse()
      .find(
        item =>
          item.role === "user"
      );

  if (!previousUser) return;

  chat.messages =
    chat.messages.slice(0, index);

  persistAll();

  renderChat();

  await generateAssistantReply(
    previousUser.text
  );
}

/* =========================================================
   SECTION 30 — COPY
   ========================================================= */

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);

    toast("Copied");
  } catch {
    const textarea =
      document.createElement("textarea");

    textarea.value = text;

    document.body.appendChild(textarea);

    textarea.select();

    document.execCommand("copy");

    textarea.remove();

    toast("Copied");
  }
}

/* =========================================================
   SECTION 31 — VOICE READ ALOUD
   ========================================================= */

function readAloud(messageId) {
  const chat = getCurrentChat();

  const message =
    chat?.messages.find(
      item => item.id === messageId
    );

  if (!message) return;

  if (!("speechSynthesis" in window)) {
    toast("Read aloud is not supported.");
    return;
  }

  speechSynthesis.cancel();

  const speech =
    new SpeechSynthesisUtterance(
      message.text
    );

  speech.lang =
    Galaxy.state.settings.voiceLanguage;

  speechSynthesis.speak(speech);
}

/* =========================================================
   SECTION 32 — WEB SEARCH STATES
   ========================================================= */

function toggleWebSearch() {
  Galaxy.state.webSearchState =
    Galaxy.state.webSearchState === "off"
      ? "ready"
      : "off";

  renderWebSearchState();

  toast(
    Galaxy.state.webSearchState === "ready"
      ? "Web search enabled"
      : "Web search disabled"
  );
}

function renderWebSearchState() {
  const button =
    $('[data-action="web-search"]');

  if (!button) return;

  button.classList.toggle(
    "active",
    Galaxy.state.webSearchState !== "off"
  );

  button.dataset.state =
    Galaxy.state.webSearchState;
}

function setWebSearchState(state) {
  Galaxy.state.webSearchState =
    state;

  renderWebSearchState();
}

/* =========================================================
   SECTION 33 — VOICE RECORDING
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
    toast("Voice recognition is not supported.");
    return;
  }

  const recognition =
    new Recognition();

  recognition.lang =
    Galaxy.state.settings.voiceLanguage;

  recognition.continuous = true;

  recognition.interimResults = true;

  Galaxy.state.voiceRecognition =
    recognition;

  Galaxy.state.voiceState =
    "recording";

  renderVoiceState();

  recognition.onresult = event => {
    let transcript = "";

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      transcript +=
        event.results[i][0].transcript;
    }

    const input = $("#promptInput");

    if (input) {
      input.value = transcript;
      autoResizeTextarea(input);
    }
  };

  recognition.onerror = event => {
    Galaxy.state.voiceState =
      "error";

    renderVoiceState();

    toast(
      `Voice error: ${event.error}`,
      "error"
    );
  };

  recognition.onend = () => {
    Galaxy.state.voiceState =
      "idle";

    renderVoiceState();
  };

  recognition.start();

  toast("Listening…");
}

function stopVoiceRecording() {
  Galaxy.state.voiceRecognition?.stop();

  Galaxy.state.voiceRecognition =
    null;

  Galaxy.state.voiceState =
    "idle";

  renderVoiceState();

  toast("Voice recording stopped");
}

function renderVoiceState() {
  const button =
    $('[data-action="voice"]');

  if (!button) return;

  button.dataset.state =
    Galaxy.state.voiceState;

  button.classList.toggle(
    "recording",
    Galaxy.state.voiceState ===
      "recording"
  );
}

/* =========================================================
   SECTION 34 — STOP GENERATION
   ========================================================= */

function stopGeneration() {
  if (!Galaxy.state.generation.active) {
    return;
  }

  Galaxy.state.generation.stopped =
    true;

  Galaxy.state.generation.controller?.abort();

  Galaxy.state.generation.active =
    false;

  updateSendButtonState();

  toast("Generation stopped");
}

/* =========================================================
   SECTION 35 — DEMO AI RESPONSE
   ========================================================= */

function buildDemoResponse(prompt) {
  const webNotice =
    Galaxy.state.webSearchState === "ready"
      ? "\n\n**Web search:** enabled in the interface. Connect your search backend for live results."
      : "";

  return `
## GALAXY AI

I can work with that.

You asked:

> ${prompt}

This GALAXY interface now supports chat history, projects, Packs, media library, scheduling, plugins, GPT agents, sites, images, Work mode, previews, command palette and advanced chat actions.

${webNotice}

\`\`\`javascript
// Connect your real AI backend here:
const response = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: prompt
  })
});
\`\`\`

The front end is ready for your real model connection.
`.trim();
}

/* =========================================================
   SECTION 36 — STREAMING RESPONSE
   ========================================================= */

async function generateAssistantReply(prompt) {
  const chat = ensureCurrentChat();

  Galaxy.state.generation.active = true;

  Galaxy.state.generation.stopped = false;

  Galaxy.state.generation.controller =
    new AbortController();

  const assistantMessage = {
    id: uid("msg"),

    role: "assistant",

    text: "",

    createdAt: now(),

    updatedAt: now()
  };

  Galaxy.state.generation.messageId =
    assistantMessage.id;

  chat.messages.push(assistantMessage);

  renderChat();

  updateSendButtonState();

  showToolActivity(
    Galaxy.state.webSearchState === "ready"
      ? "Searching and thinking…"
      : "Thinking…"
  );

  try {
    const fullText =
      buildDemoResponse(prompt);

    if (!Galaxy.state.settings.streaming) {
      assistantMessage.text =
        fullText;

      await sleep(250);
    } else {
      const chunks =
        splitStreamingText(fullText);

      for (const chunk of chunks) {
        if (
          Galaxy.state.generation.stopped
        ) {
          break;
        }

        assistantMessage.text +=
          chunk;

        assistantMessage.updatedAt =
          now();

        renderChat();

        await sleep(
          Galaxy.state.settings.streamSpeed
        );
      }
    }

    chat.updatedAt = now();

    persistAll();
  } catch (error) {
    if (error.name !== "AbortError") {
      assistantMessage.text +=
        "\n\nGeneration failed.";

      handleError(
        error,
        "Generate response"
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
  }
}

function splitStreamingText(text) {
  return text.match(/.{1,10}/gs) || [];
}

/* =========================================================
   SECTION 37 — SEND MESSAGE
   ========================================================= */

async function sendMessage() {
  if (Galaxy.state.generation.active) {
    stopGeneration();
    return;
  }

  const input = $("#promptInput");

  if (!input) return;

  const text = input.value.trim();

  if (
    !text &&
    Galaxy.state.attachments.length === 0
  ) {
    return;
  }

  const chat =
    ensureCurrentChat();

  const message = {
    id: uid("msg"),

    role: "user",

    text:
      text ||
      describeAttachments(),

    attachments:
      Galaxy.state.attachments.map(
        item => ({ ...item })
      ),

    createdAt: now(),

    updatedAt: now()
  };

  chat.messages.push(message);

  chat.updatedAt = now();

  if (
    Galaxy.state.settings.autoTitleChats &&
    chat.title === "New conversation"
  ) {
    chat.title =
      (text || "File discussion")
        .slice(0, 48);
  }

  input.value = "";

  autoResizeTextarea(input);

  DB.remove("draft");

  Galaxy.state.attachments = [];

  renderAttachments();

  persistAll();

  renderRecentChats();

  renderChat();

  await generateAssistantReply(
    text ||
    "Analyze the attached content."
  );
}

function describeAttachments() {
  return Galaxy.state.attachments
    .map(item => `Attached: ${item.name}`)
    .join("\n");
}

/* =========================================================
   SECTION 38 — SEND BUTTON STATE
   ========================================================= */

function updateSendButtonState() {
  const button = $("#sendButton");

  if (!button) return;

  if (Galaxy.state.generation.active) {
    button.textContent = "■";

    button.dataset.action =
      "stop-generation";

    button.setAttribute(
      "aria-label",
      "Stop generation"
    );
  } else {
    button.textContent = "↑";

    button.dataset.action = "send";

    button.setAttribute(
      "aria-label",
      "Send"
    );
  }
}

/* =========================================================
   SECTION 39 — TOOL ACTIVITY DISPLAY
   ========================================================= */

function showToolActivity(text) {
  let activity = $("#toolActivity");

  if (!activity) {
    activity =
      document.createElement("div");

    activity.id = "toolActivity";

    activity.className =
      "tool-activity";

    $(".composer-dock")
      ?.prepend(activity);
  }

  activity.innerHTML = `
    <span class="activity-dot"></span>
    <span>${escapeHTML(text)}</span>
  `;

  activity.hidden = false;
}

function hideToolActivity() {
  const activity =
    $("#toolActivity");

  if (activity) {
    activity.hidden = true;
  }
}

/* =========================================================
   SECTION 40 — TEXTAREA AUTOSIZE
   ========================================================= */

function autoResizeTextarea(textarea) {
  if (!textarea) return;

  textarea.style.height = "auto";

  textarea.style.height =
    `${Math.min(
      textarea.scrollHeight,
      190
    )}px`;
}

/* =========================================================
   SECTION 41 — AUTOSAVE
   ========================================================= */

let autosaveTimer = null;

function scheduleAutosave() {
  if (!Galaxy.state.settings.autosave) {
    return;
  }

  clearTimeout(autosaveTimer);

  autosaveTimer = setTimeout(() => {
    saveDraft();
  }, Galaxy.state.settings.autosaveDelay);
}

function saveDraft() {
  const input = $("#promptInput");

  if (!input) return;

  DB.set("draft", input.value);

  const indicator =
    $("#draftState");

  if (indicator) {
    indicator.textContent =
      input.value
        ? "Draft autosaved"
        : "Ready";
  }
}

function restoreDraft() {
  const input = $("#promptInput");

  if (!input) return;

  const draft =
    DB.get("draft", "");

  input.value = draft;

  autoResizeTextarea(input);
}

/* =========================================================
   SECTION 42 — ATTACHMENTS
   ========================================================= */

function addFiles(files) {
  const fileArray =
    Array.from(files || []);

  for (const file of fileArray) {
    const type =
      detectFileType(file);

    const item = {
      id: uid("attachment"),

      name: file.name,

      type,

      mime: file.type,

      size: file.size,

      file,

      createdAt: now(),

      previewUrl:
        URL.createObjectURL(file)
    };

    Galaxy.state.attachments.push(item);
  }

  renderAttachments();
}

function detectFileType(file) {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  return "file";
}

function removeAttachment(id) {
  const item =
    Galaxy.state.attachments.find(
      attachment =>
        attachment.id === id
    );

  if (item?.previewUrl) {
    URL.revokeObjectURL(
      item.previewUrl
    );
  }

  Galaxy.state.attachments =
    Galaxy.state.attachments.filter(
      attachment =>
        attachment.id !== id
    );

  renderAttachments();
}

function renderAttachments() {
  const strip =
    $("#attachmentStrip");

  if (!strip) return;

  if (!Galaxy.state.attachments.length) {
    strip.hidden = true;

    strip.innerHTML = "";

    return;
  }

  strip.hidden = false;

  strip.innerHTML =
    Galaxy.state.attachments
      .map(
        attachment => `
        <article
          class="attachment-chip"
          data-attachment-id="${attachment.id}"
        >

          ${
            attachment.type === "image"
              ? `
                <img
                  class="attachment-thumb"
                  src="${attachment.previewUrl}"
                  alt=""
                >
              `
              : attachment.type === "video"
              ? `
                <span class="attachment-type">
                  ▷
                </span>
              `
              : `
                <span class="attachment-type">
                  ▱
                </span>
              `
          }

          <div class="attachment-copy">

            <strong>
              ${escapeHTML(attachment.name)}
            </strong>

            <small>
              ${formatBytes(attachment.size)}
            </small>

          </div>

          <button
            class="icon-btn"
            data-remove-attachment="${attachment.id}"
          >
            ×
          </button>

        </article>
      `
      )
      .join("");
}

/* =========================================================
   SECTION 43 — DRAG AND DROP
   ========================================================= */

function initializeDragAndDrop() {
  ["dragenter", "dragover"].forEach(
    eventName => {
      document.addEventListener(
        eventName,
        event => {
          event.preventDefault();

          Galaxy.state.dragCounter++;

          document.body.classList.add(
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
          Galaxy.state.dragCounter - 1
        );

      if (
        Galaxy.state.dragCounter === 0
      ) {
        document.body.classList.remove(
          "dragging"
        );
      }
    }
  );

  document.addEventListener(
    "drop",
    event => {
      event.preventDefault();

      Galaxy.state.dragCounter = 0;

      document.body.classList.remove(
        "dragging"
      );

      if (
        event.dataTransfer?.files?.length
      ) {
        addFiles(
          event.dataTransfer.files
        );

        toast(
          `${event.dataTransfer.files.length} file(s) attached`
        );
      }
    }
  );
}

/* =========================================================
   SECTION 44 — LIBRARY MANAGEMENT
   ========================================================= */

function addLibraryFile(file) {
  const type =
    detectFileType(file);

  const item = {
    id: uid("library"),

    name: file.name,

    type,

    mime: file.type,

    size: file.size,

    createdAt: now(),

    favorite: false,

    tags: [],

    dataUrl: null
  };

  const reader = new FileReader();

  reader.onload = () => {
    item.dataUrl =
      reader.result;

    Galaxy.state.library.unshift(item);

    persistAll();

    renderLibrary();

    toast("Added to Library");
  };

  reader.onerror = () => {
    handleError(
      new Error(
        "Could not read the selected file."
      ),
      "Library"
    );
  };

  reader.readAsDataURL(file);
}

function deleteLibraryItem(id) {
  const item =
    Galaxy.state.library.find(
      entry => entry.id === id
    );

  if (!item) return;

  confirmAction({
    title: "Delete library item",

    message: `Delete “${item.name}”?`,

    onConfirm() {
      Galaxy.state.library =
        Galaxy.state.library.filter(
          entry => entry.id !== id
        );

      persistAll();

      renderLibrary();

      toast("Library item deleted");
    }
  });
}

function toggleLibraryFavorite(id) {
  const item =
    Galaxy.state.library.find(
      entry => entry.id === id
    );

  if (!item) return;

  item.favorite =
    !item.favorite;

  persistAll();

  renderLibrary();
}

function renderLibrary(filter = null) {
  if (filter) {
    Galaxy.state.activeLibraryFilter =
      filter;
  }

  const filterValue =
    Galaxy.state.activeLibraryFilter;

  const items =
    Galaxy.state.library.filter(
      item => {
        if (
          filterValue === "all"
        ) {
          return true;
        }

        if (
          filterValue === "photos"
        ) {
          return item.type === "image";
        }

        if (
          filterValue === "videos"
        ) {
          return item.type === "video";
        }

        if (
          filterValue === "files"
        ) {
          return item.type === "file";
        }

        if (
          filterValue === "favorites"
        ) {
          return item.favorite;
        }

        return true;
      }
    );

  renderContentHeader(
    "Your content",
    "Library"
  );

  renderContentTabs([
    ["all", "All"],
    ["photos", "Photos"],
    ["videos", "Videos"],
    ["packs", "Packs"],
    ["files", "Files"],
    ["favorites", "Favorites"]
  ], filterValue, "library");

  const root = $("#contentBody");

  if (!root) return;

  if (!items.length) {
    root.innerHTML = `
      <div class="empty-panel">

        <span class="empty-icon">
          ▣
        </span>

        <h3>
          Your Library is empty
        </h3>

        <p>
          Upload photos, videos and files from chat.
        </p>

      </div>
    `;

    return;
  }

  root.innerHTML = `
    <div class="media-grid">

      ${items
        .map(renderLibraryCard)
        .join("")}

    </div>
  `;
}

function renderLibraryCard(item) {
  const preview =
    item.type === "image"
      ? `
        <img
          src="${item.dataUrl}"
          alt="${escapeHTML(item.name)}"
        >
      `
      : item.type === "video"
      ? `
        <video
          src="${item.dataUrl}"
          muted
          preload="metadata"
        ></video>

        <span class="video-overlay">
          ▷
        </span>
      `
      : `
        <div class="file-placeholder">
          ▱
        </div>
      `;

  return `
    <article
      class="media-card"
      data-context-type="library"
      data-context-id="${item.id}"
    >

      <button
        class="media-preview"
        data-preview-library="${item.id}"
      >
        ${preview}
      </button>

      <div class="media-meta">

        <div>

          <strong>
            ${escapeHTML(item.name)}
          </strong>

          <small>
            ${formatBytes(item.size)}
          </small>

        </div>

        <button
          class="icon-btn ${
            item.favorite ? "active" : ""
          }"
          data-library-favorite="${item.id}"
        >
          ♡
        </button>

      </div>

    </article>
  `;
}

/* =========================================================
   SECTION 45 — FILE PREVIEW
   ========================================================= */

function previewLibraryItem(id) {
  const item =
    Galaxy.state.library.find(
      entry => entry.id === id
    );

  if (!item) return;

  if (item.type === "image") {
    previewImage(item);
    return;
  }

  if (item.type === "video") {
    previewVideo(item);
    return;
  }

  previewFile(item);
}

function previewImage(item) {
  openModal({
    title: item.name,

    width: "1000px",

    body: `
      <div class="image-preview">

        <img
          src="${item.dataUrl}"
          alt="${escapeHTML(item.name)}"
        >

      </div>

      <div class="preview-meta">

        <span>
          ${formatBytes(item.size)}
        </span>

        <button
          class="text-action"
          data-download-library="${item.id}"
        >
          Download
        </button>

      </div>
    `
  });
}

function previewVideo(item) {
  openModal({
    title: item.name,

    width: "1000px",

    body: `
      <div class="video-preview">

        <video
          src="${item.dataUrl}"
          controls
          autoplay
        ></video>

      </div>

      <div class="preview-meta">

        <span>
          ${formatBytes(item.size)}
        </span>

      </div>
    `
  });
}

function previewFile(item) {
  openModal({
    title: item.name,

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

        <span>
          ${formatBytes(item.size)}
        </span>

        <button
          class="text-action primary"
          data-download-library="${item.id}"
        >
          Download
        </button>

      </div>
    `
  });
}

/* =========================================================
   SECTION 46 — PROJECT CRUD
   ========================================================= */

function createProject() {
  openProjectEditor();
}

function openProjectEditor(
  project = null
) {
  const editing =
    Boolean(project);

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
                  project.description || ""
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
                    project?.status === status
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

  setTimeout(() => {
    $("#projectForm")?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const form =
          new FormData(event.currentTarget);

        const data = {
          name:
            form.get("name").trim(),

          description:
            form.get("description").trim(),

          status:
            form.get("status")
        };

        if (!data.name) return;

        if (editing) {
          project.name = data.name;

          project.description =
            data.description;

          project.status =
            data.status;

          project.updatedAt =
            now();
        } else {
          Galaxy.state.projects.unshift({
            id: uid("project"),

            ...data,

            createdAt: now(),

            updatedAt: now(),

            pinned: false,

            files: [],

            chats: []
          });
        }

        persistAll();

        renderProjects();

        closeOverlay();

        toast(
          editing
            ? "Project updated"
            : "Project created"
        );
      }
    );
  }, 0);
}

function editProject(id) {
  const project =
    Galaxy.state.projects.find(
      item => item.id === id
    );

  if (!project) return;

  openProjectEditor(project);
}

function deleteProject(id) {
  const project =
    Galaxy.state.projects.find(
      item => item.id === id
    );

  if (!project) return;

  confirmAction({
    title: "Delete project",

    message: `Delete “${project.name}”?`,

    onConfirm() {
      Galaxy.state.projects =
        Galaxy.state.projects.filter(
          item => item.id !== id
        );

      persistAll();

      renderProjects();

      toast("Project deleted");
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

  renderContentTabs([
    ["all", "All"],
    ["active", "Active"],
    ["planning", "Planning"],
    ["complete", "Complete"]
  ], "all", "projects");

  const root = $("#contentBody");

  if (!root) return;

  if (!Galaxy.state.projects.length) {
    root.innerHTML = `
      <div class="empty-panel">
        <span>▱</span>
        <h3>No projects yet</h3>
        <p>Create your first GALAXY project.</p>
      </div>
    `;

    return;
  }

  root.innerHTML = `
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
  `;
}

/* =========================================================
   SECTION 47 — SCHEDULED TASK UI
   ========================================================= */

function createScheduledTask() {
  openModal({
    title: "New scheduled task",

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

  setTimeout(() => {
    $("#scheduleForm")?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const form =
          new FormData(event.currentTarget);

        Galaxy.state.scheduled.unshift({
          id: uid("schedule"),

          name:
            form.get("name").trim(),

          prompt:
            form.get("prompt").trim(),

          frequency:
            form.get("frequency"),

          datetime:
            form.get("datetime"),

          enabled: true,

          createdAt: now()
        });

        persistAll();

        renderScheduled();

        closeOverlay();

        toast("Task scheduled");
      }
    );
  }, 0);
}

function toggleScheduledTask(id) {
  const task =
    Galaxy.state.scheduled.find(
      item => item.id === id
    );

  if (!task) return;

  task.enabled =
    !task.enabled;

  persistAll();

  renderScheduled();
}

function deleteScheduledTask(id) {
  Galaxy.state.scheduled =
    Galaxy.state.scheduled.filter(
      item => item.id !== id
    );

  persistAll();

  renderScheduled();

  toast("Scheduled task deleted");
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

  renderContentTabs([
    ["upcoming", "Upcoming"],
    ["recurring", "Recurring"],
    ["completed", "Completed"]
  ], "upcoming", "scheduled");

  const root = $("#contentBody");

  if (!root) return;

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
                    task.enabled ? "active" : ""
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
          <span>◷</span>
          <h3>No scheduled tasks</h3>
          <p>Create recurring AI workflows.</p>
        </div>
      `;
}

/* =========================================================
   SECTION 48 — PLUGIN MANAGER
   ========================================================= */

function togglePluginInstall(id) {
  const plugin =
    Galaxy.state.plugins.find(
      item => item.id === id
    );

  if (!plugin) return;

  plugin.installed =
    !plugin.installed;

  if (!plugin.installed) {
    plugin.connected = false;
  }

  persistAll();

  renderPlugins();

  toast(
    plugin.installed
      ? `${plugin.name} installed`
      : `${plugin.name} removed`
  );
}

function togglePluginConnection(id) {
  const plugin =
    Galaxy.state.plugins.find(
      item => item.id === id
    );

  if (!plugin) return;

  if (!plugin.installed) {
    plugin.installed = true;
  }

  plugin.connected =
    !plugin.connected;

  persistAll();

  renderPlugins();

  toast(
    plugin.connected
      ? `${plugin.name} connected`
      : `${plugin.name} disconnected`
  );
}

function renderPlugins() {
  renderContentHeader(
    "Connections",
    "Plugins"
  );

  renderContentTabs([
    ["installed", "Installed"],
    ["discover", "Discover"],
    ["permissions", "Permissions"]
  ], "discover", "plugins");

  const root = $("#contentBody");

  if (!root) return;

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
   SECTION 49 — GPT / AGENT CREATOR
   ========================================================= */

function createAgent() {
  openAgentEditor();
}

function openAgentEditor(agent = null) {
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
              ? escapeHTML(agent.instructions)
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

        <label>
          Capabilities

          <div class="checkbox-list">

            <label>
              <input
                type="checkbox"
                name="web"
              >
              Web search
            </label>

            <label>
              <input
                type="checkbox"
                name="images"
              >
              Images
            </label>

            <label>
              <input
                type="checkbox"
                name="files"
              >
              Files
            </label>

            <label>
              <input
                type="checkbox"
                name="code"
              >
              Code
            </label>

          </div>

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

  setTimeout(() => {
    $("#agentForm")?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const form =
          new FormData(event.currentTarget);

        const data = {
          name:
            form.get("name").trim(),

          instructions:
            form.get("instructions").trim(),

          personality:
            form.get("personality"),

          capabilities: {
            web: form.has("web"),
            images: form.has("images"),
            files: form.has("files"),
            code: form.has("code")
          }
        };

        if (agent) {
          Object.assign(
            agent,
            data,
            {
              updatedAt: now()
            }
          );
        } else {
          Galaxy.state.agents.unshift({
            id: uid("agent"),

            ...data,

            createdAt: now(),

            updatedAt: now()
          });
        }

        persistAll();

        renderAgents();

        closeOverlay();

        toast(
          agent
            ? "GPT updated"
            : "GPT created"
        );
      }
    );
  }, 0);
}

function deleteAgent(id) {
  Galaxy.state.agents =
    Galaxy.state.agents.filter(
      item => item.id !== id
    );

  persistAll();

  renderAgents();

  toast("GPT deleted");
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

  renderContentTabs([
    ["mine", "Mine"],
    ["favorites", "Favorites"],
    ["explore", "Explore"]
  ], "mine", "gpts");

  const root = $("#contentBody");

  if (!root) return;

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
          <span>✧</span>
          <h3>Create your first GPT</h3>
          <p>Build specialized GALAXY agents.</p>
        </div>
      `;
}

/* =========================================================
   SECTION 50 — SITES WORKSPACE
   ========================================================= */

function createSite() {
  const site = {
    id: uid("site"),

    name: "Untitled Site",

    html:
      "<h1>GALAXY Site</h1><p>Start building here.</p>",

    css:
      "body { font-family: system-ui; padding: 40px; }",

    js: "",

    status: "draft",

    createdAt: now(),

    updatedAt: now()
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
      item => item.id === id
    );

  if (!site) return;

  Galaxy.state.activeSiteId = id;

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

  const root = $("#contentBody");

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

  if (!site || !editor) return;

  const language =
    editor.dataset.language;

  site[language] =
    editor.value;

  site.updatedAt = now();

  persistAll();

  toast("Site saved");
}

function previewActiveSite() {
  saveActiveSite();

  const site =
    Galaxy.state.sites.find(
      item =>
        item.id ===
        Galaxy.state.activeSiteId
    );

  if (!site) return;

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
    title: site.name,

    width: "1100px",

    body: `
      <iframe
        class="site-preview-frame"
        id="sitePreviewFrame"
      ></iframe>
    `
  });

  setTimeout(() => {
    const frame =
      $("#sitePreviewFrame");

    if (frame) {
      frame.srcdoc = source;
    }
  }, 0);
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

  renderContentTabs([
    ["drafts", "Drafts"],
    ["published", "Published"],
    ["templates", "Templates"]
  ], "drafts", "sites");

  const root = $("#contentBody");

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
          <span>⌘</span>
          <h3>No sites yet</h3>
          <p>Create a website in GALAXY Work.</p>
        </div>
      `;
}

/* =========================================================
   SECTION 51 — IMAGE WORKSPACE
   ========================================================= */

function createImageConcept() {
  openModal({
    title: "Create image",

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
            placeholder="A futuristic city at sunset..."
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

  setTimeout(() => {
    $("#imageConceptForm")
      ?.addEventListener(
        "submit",
        event => {
          event.preventDefault();

          const form =
            new FormData(
              event.currentTarget
            );

          Galaxy.state.images.unshift({
            id: uid("image"),

            prompt:
              form.get("prompt").trim(),

            ratio:
              form.get("ratio"),

            status: "concept",

            createdAt: now()
          });

          persistAll();

          closeOverlay();

          renderImages();

          toast(
            "Image concept saved. Connect your image API to render it."
          );
        }
      );
  }, 0);
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

  renderContentTabs([
    ["recent", "Recent"],
    ["collections", "Collections"],
    ["references", "References"]
  ], "recent", "images");

  const root = $("#contentBody");

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
                    image.prompt.slice(0, 60)
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
          <span>◫</span>
          <h3>Create images</h3>
          <p>Generate concepts and connect an image model later.</p>
        </div>
      `;
}

/* =========================================================
   SECTION 52 — PACKS SYSTEM
   ========================================================= */

function installPack(id) {
  const pack =
    Galaxy.state.packs.find(
      item => item.id === id
    );

  if (!pack) return;

  pack.installed = true;

  persistAll();

  renderPacks();

  toast(`${pack.name} installed`);
}

function removePack(id) {
  const pack =
    Galaxy.state.packs.find(
      item => item.id === id
    );

  if (!pack) return;

  pack.installed = false;

  persistAll();

  renderPacks();

  toast(`${pack.name} removed`);
}

function usePackItem(
  packId,
  itemName
) {
  const pack =
    Galaxy.state.packs.find(
      item => item.id === packId
    );

  if (!pack) return;

  const input =
    $("#promptInput");

  switchMode("chat");

  if (input) {
    input.value =
      `Use the ${itemName} workflow from the ${pack.name}.\n\n`;

    autoResizeTextarea(input);

    input.focus();
  }

  toast(`${itemName} loaded`);
}

function openPack(id) {
  const pack =
    Galaxy.state.packs.find(
      item => item.id === id
    );

  if (!pack) return;

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

  const root = $("#contentBody");

  root.innerHTML = `
    <div class="pack-detail">

      <div class="pack-hero">

        <span class="pack-large-icon">
          ${pack.icon}
        </span>

        <div>

          <h2>
            ${escapeHTML(pack.name)}
          </h2>

          <p>
            ${escapeHTML(pack.description)}
          </p>

          <div class="pack-tags">

            ${pack.tags
              .map(
                tag => `
                <span>
                  ${escapeHTML(tag)}
                </span>
              `
              )
              .join("")}

          </div>

        </div>

      </div>

      <div class="pack-workflow-list">

        ${pack.items
          .map(
            item => `
            <button
              class="pack-workflow"
              data-use-pack="${pack.id}"
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

    </div>
  `;
}

function renderPacks(filter = "all") {
  Galaxy.state.activePackFilter =
    filter;

  renderContentHeader(
    "Collections",
    "Packs"
  );

  const categories = [
    ["all", "All"],
    ["prompt", "Prompts"],
    ["website", "Websites"],
    ["creator", "Creator"],
    ["productivity", "Productivity"],
    ["research", "Research"],
    ["business", "Business"],
    ["developer", "Developer"],
    ["design", "Design"],
    ["video", "Video"],
    ["startup", "Startup"],
    ["data", "Data"],
    ["education", "Learning"]
  ];

  renderContentTabs(
    categories,
    filter,
    "packs"
  );

  const packs =
    Galaxy.state.packs.filter(
      pack =>
        filter === "all" ||
        pack.category === filter
    );

  const root = $("#contentBody");

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
   SECTION 53 — PROMPT TEMPLATES
   ========================================================= */

function openPromptTemplates() {
  openModal({
    title: "Prompt templates",

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
      item => item.id === id
    );

  if (!prompt) return;

  closeOverlay();

  switchMode("chat");

  const input =
    $("#promptInput");

  input.value =
    `${prompt.prompt}\n\n`;

  autoResizeTextarea(input);

  input.focus();
}

/* =========================================================
   SECTION 54 — WORK MODE EDITOR
   ========================================================= */

function switchMode(mode) {
  Galaxy.state.mode = mode;

  Galaxy.state.view = mode;

  $$(".mode-tab").forEach(tab => {
    const active =
      tab.dataset.mode === mode;

    tab.classList.toggle(
      "active",
      active
    );

    tab.setAttribute(
      "aria-selected",
      String(active)
    );
  });

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
    ensureWorkDocument();

    renderWorkDocument();
  }
}

function ensureWorkDocument() {
  let document =
    Galaxy.state.workDocuments.find(
      item =>
        item.id ===
        Galaxy.state.activeWorkDocumentId
    );

  if (!document) {
    document = {
      id: uid("work"),

      title: "Untitled Work",

      type: "document",

      content:
        "# GALAXY Work\n\nStart creating here.",

      createdAt: now(),

      updatedAt: now()
    };

    Galaxy.state.workDocuments.unshift(
      document
    );

    Galaxy.state.activeWorkDocumentId =
      document.id;

    persistAll();
  }

  return document;
}

function renderWorkDocument() {
  const document =
    ensureWorkDocument();

  const preview =
    $("#previewSurface");

  if (!preview) return;

  preview.innerHTML = `
    <div class="work-editor-shell">

      <div class="work-editor-toolbar">

        <input
          id="workDocumentTitle"
          class="work-title-input"
          value="${escapeHTML(document.title)}"
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
      >${escapeHTML(document.content)}</textarea>

    </div>
  `;

  on(
    $("#workDocumentEditor"),
    "input",
    () => {
      document.content =
        $("#workDocumentEditor").value;

      document.updatedAt =
        now();

      persistAll();
    }
  );

  on(
    $("#workDocumentTitle"),
    "input",
    () => {
      document.title =
        $("#workDocumentTitle").value;

      document.updatedAt =
        now();

      persistAll();
    }
  );
}

function previewWorkDocument() {
  const document =
    ensureWorkDocument();

  const preview =
    $("#previewSurface");

  preview.innerHTML = `
    <article class="work-document-preview">
      ${renderMarkdown(document.content)}
    </article>
  `;
}

/* =========================================================
   SECTION 55 — WORK CHAT
   ========================================================= */

async function sendWorkMessage() {
  const input =
    $("#workPrompt");

  const root =
    $("#workMessages");

  if (!input || !root) return;

  const value =
    input.value.trim();

  if (!value) return;

  root.insertAdjacentHTML(
    "beforeend",
    `
      <article class="message user">
        <div class="bubble">
          ${escapeHTML(value)}
        </div>
      </article>
    `
  );

  input.value = "";

  await sleep(250);

  root.insertAdjacentHTML(
    "beforeend",
    `
      <article class="message assistant">
        <div class="bubble">
          I can modify the Work document once your real AI backend is connected.
        </div>
      </article>
    `
  );

  root.scrollTop =
    root.scrollHeight;
}

/* =========================================================
   SECTION 56 — SEARCH SYSTEM
   ========================================================= */

function openSearch() {
  openCommandPalette({
    mode: "search"
  });
}

function searchEverything(query) {
  const q =
    query.trim().toLowerCase();

  if (!q) {
    return [];
  }

  const results = [];

  Galaxy.state.chats.forEach(chat => {
    if (
      chat.title
        .toLowerCase()
        .includes(q) ||
      chat.messages.some(message =>
        message.text
          .toLowerCase()
          .includes(q)
      )
    ) {
      results.push({
        type: "chat",
        id: chat.id,
        title: chat.title,
        icon: "◌"
      });
    }
  });

  Galaxy.state.projects.forEach(
    project => {
      if (
        project.name
          .toLowerCase()
          .includes(q)
      ) {
        results.push({
          type: "project",
          id: project.id,
          title: project.name,
          icon: "▱"
        });
      }
    }
  );

  Galaxy.state.packs.forEach(pack => {
    if (
      pack.name
        .toLowerCase()
        .includes(q) ||
      pack.items.some(item =>
        item
          .toLowerCase()
          .includes(q)
      )
    ) {
      results.push({
        type: "pack",
        id: pack.id,
        title: pack.name,
        icon: pack.icon
      });
    }
  });

  Galaxy.state.library.forEach(item => {
    if (
      item.name
        .toLowerCase()
        .includes(q)
    ) {
      results.push({
        type: "library",
        id: item.id,
        title: item.name,
        icon:
          item.type === "image"
            ? "◫"
            : item.type === "video"
            ? "▷"
            : "▱"
      });
    }
  });

  Galaxy.state.agents.forEach(agent => {
    if (
      agent.name
        .toLowerCase()
        .includes(q)
    ) {
      results.push({
        type: "agent",
        id: agent.id,
        title: agent.name,
        icon: "✧"
      });
    }
  });

  return results.slice(0, 80);
}

/* =========================================================
   SECTION 57 — COMMAND PALETTE
   ========================================================= */

const COMMANDS = [
  {
    name: "New chat",
    shortcut: "Ctrl N",
    run: newChat
  },

  {
    name: "Search",
    shortcut: "Ctrl K",
    run: openSearch
  },

  {
    name: "Projects",
    run: () => openWorkspaceView("projects")
  },

  {
    name: "Library",
    run: () => openWorkspaceView("library")
  },

  {
    name: "Packs",
    run: () => openWorkspaceView("packs")
  },

  {
    name: "Scheduled",
    run: () => openWorkspaceView("scheduled")
  },

  {
    name: "Plugins",
    run: () => openWorkspaceView("plugins")
  },

  {
    name: "Images",
    run: () => openWorkspaceView("images")
  },

  {
    name: "Sites",
    run: () => openWorkspaceView("sites")
  },

  {
    name: "GPTs",
    run: () => openWorkspaceView("gpts")
  },

  {
    name: "Prompt templates",
    run: openPromptTemplates
  },

  {
    name: "Chat mode",
    shortcut: "Alt 1",
    run: () => switchMode("chat")
  },

  {
    name: "Work mode",
    shortcut: "Alt 2",
    run: () => switchMode("work")
  },

  {
    name: "Focus mode",
    shortcut: "Ctrl .",
    run: toggleFocusMode
  },

  {
    name: "Toggle theme",
    shortcut: "Ctrl /",
    run: toggleTheme
  },

  {
    name: "Settings",
    run: openSettings
  }
];

function openCommandPalette({
  mode = "command"
} = {}) {
  const placeholder =
    mode === "search"
      ? "Search chats, projects, Packs, files..."
      : "Type a command...";

  const root = $("#overlayRoot");

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
          placeholder="${escapeHTML(placeholder)}"
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

  renderCommandResults("", mode);

  setTimeout(() => {
    $("#commandInput")?.focus();
  }, 0);
}

function renderCommandResults(
  query,
  mode
) {
  const root =
    $("#commandList");

  if (!root) return;

  if (mode === "search") {
    const results =
      searchEverything(query);

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

  const commands =
    COMMANDS.filter(command =>
      command.name
        .toLowerCase()
        .includes(q)
    );

  root.innerHTML =
    commands
      .map(
        command => `
        <button
          class="command-row"
          data-command-name="${escapeHTML(command.name)}"
        >

          <span>
            ${escapeHTML(command.name)}
          </span>

          ${
            command.shortcut
              ? `
                <kbd>
                  ${escapeHTML(command.shortcut)}
                </kbd>
              `
              : ""
          }

        </button>
      `
      )
      .join("");
}

/* =========================================================
   SECTION 58 — SEARCH FILTERS
   ========================================================= */

function setSearchFilter(filter) {
  Galaxy.state.activeSearchFilter =
    filter;

  $("[data-search-filter].active")
    ?.classList.remove("active");

  $(
    `[data-search-filter="${filter}"]`
  )?.classList.add
   ("active");
("active");

  const input = $("#commandInput");

  if (
    input &&
    input.dataset.commandMode === "search"
  ) {
    renderFilteredSearchResults(
      input.value,
      filter
    );
  }
}


/* =========================================================
   SECTION 59 — CONTENT HEADER
   ========================================================= */

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
      eyebrow || "Workspace";
  }

  if (titleElement) {
    titleElement.textContent =
      title || "GALAXY";
  }

  if (actionsElement) {
    actionsElement.innerHTML =
      actions || "";
  }
}


/* =========================================================
   SECTION 60 — CONTENT TABS
   ========================================================= */

function renderContentTabs(
  tabs = [],
  active = "",
  group = ""
) {
  const root =
    $("#contentTabs");

  if (!root) return;

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


/* =========================================================
   SECTION 61 — FILTERED SEARCH RESULTS
   ========================================================= */

function renderFilteredSearchResults(
  query,
  filter = Galaxy.state.activeSearchFilter
) {
  const root =
    $("#commandList");

  if (!root) return;

  const results =
    searchEverything(query);

  const filtered =
    filter === "all"
      ? results
      : results.filter(
          item =>
            item.type === filter
        );

  if (!query.trim()) {
    root.innerHTML = `
      <div class="command-hint">
        Start typing to search GALAXY AI.
      </div>
    `;

    return;
  }

  if (!filtered.length) {
    root.innerHTML = `
      <div class="empty-panel">
        No results.
      </div>
    `;

    return;
  }

  root.innerHTML =
    filtered
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
      .join("");
}


/* =========================================================
   SECTION 62 — WORKSPACE ROUTER
   ========================================================= */

function openWorkspaceView(
  view
) {
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

  document
    .querySelectorAll(
      "[data-view]"
    )
    .forEach(
      item => {
        item.classList.toggle(
          "active",
          item.dataset.view ===
            view
        );
      }
    );

  switch (view) {
    case "projects":
      renderProjects();
      break;

    case "library":
      renderLibrary();
      break;

    case "packs":
      renderPacks(
        Galaxy.state.activePackFilter ||
          "all"
      );
      break;

    case "scheduled":
      renderScheduled();
      break;

    case "plugins":
      renderPlugins();
      break;

    case "gpts":
      renderAgents();
      break;

    case "sites":
      renderSites();
      break;

    case "images":
      renderImages();
      break;

    case "tools":
      renderTools();
      break;

    default:
      renderFallbackView(
        view
      );
  }

  if (
    window.innerWidth <=
    900
  ) {
    $("#app")
      ?.classList.remove(
        "mobile-sidebar-open"
      );
  }
}


/* =========================================================
   SECTION 63 — FALLBACK VIEW
   ========================================================= */

function renderFallbackView(
  view
) {
  renderContentHeader(
    "Workspace",
    view
      ? view
          .charAt(0)
          .toUpperCase() +
        view.slice(1)
      : "GALAXY"
  );

  const root =
    $("#contentBody");

  if (!root) return;

  root.innerHTML = `
    <div class="empty-panel">

      <span>
        ✦
      </span>

      <h3>
        ${escapeHTML(view || "Workspace")}
      </h3>

      <p>
        This workspace is ready.
      </p>

    </div>
  `;
}


/* =========================================================
   SECTION 64 — TOOLS
   ========================================================= */

function renderTools() {
  renderContentHeader(
    "Power",
    "Tools"
  );

  renderContentTabs(
    [
      [
        "all",
        "All"
      ],
      [
        "developer",
        "Developer"
      ],
      [
        "creative",
        "Creative"
      ],
      [
        "utilities",
        "Utilities"
      ]
    ],
    "all",
    "tools"
  );

  const root =
    $("#contentBody");

  if (!root) return;

  const tools = [
    {
      icon: "⌘",
      name:
        "Command Palette",
      description:
        "Search and run GALAXY commands.",
      action:
        "command"
    },

    {
      icon: "✦",
      name:
        "Prompt Templates",
      description:
        "Use powerful saved prompts.",
      action:
        "prompt-templates"
    },

    {
      icon: "{}",
      name:
        "JSON Viewer",
      description:
        "Format and inspect JSON.",
      action:
        "json-viewer"
    },

    {
      icon: "⇄",
      name:
        "Diff Viewer",
      description:
        "Compare two pieces of text.",
      action:
        "diff-viewer"
    },

    {
      icon: "▦",
      name:
        "Scratchpad",
      description:
        "Quick notes and data workspace.",
      action:
        "scratchpad"
    },

    {
      icon: "◌",
      name:
        "Focus Mode",
      description:
        "Hide distractions.",
      action:
        "focus"
    }
  ];

  root.innerHTML = `
    <div class="resource-grid">

      ${tools
        .map(
          tool => `
          <button
            class="resource-card"
            data-tool-action="${tool.action}"
          >

            <div class="resource-icon">
              ${tool.icon}
            </div>

            <div class="resource-copy">

              <strong>
                ${escapeHTML(tool.name)}
              </strong>

              <span>
                ${escapeHTML(tool.description)}
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
   SECTION 65 — SEARCH RESULT OPENING
   ========================================================= */

function openSearchResult(
  type,
  id
) {
  closeOverlay();

  switch (type) {
    case "chat":
      Galaxy.state.currentChatId =
        id;

      persistAll();

      switchMode(
        "chat"
      );

      renderChat();

      renderRecentChats();

      break;

    case "project":
      openWorkspaceView(
        "projects"
      );

      break;

    case "pack":
      openWorkspaceView(
        "packs"
      );

      setTimeout(
        () => {
          openPack?.(
            id
          );
        },
        0
      );

      break;

    case "library":
      openWorkspaceView(
        "library"
      );

      setTimeout(
        () => {
          previewLibraryItem?.(
            id
          );
        },
        0
      );

      break;

    case "agent":
      openWorkspaceView(
        "gpts"
      );

      break;

    default:
      toast(
        "Opened"
      );
  }
}


/* =========================================================
   SECTION 66 — FOCUS MODE
   ========================================================= */

function toggleFocusMode() {
  Galaxy.state.settings.focusMode =
    !Galaxy.state.settings.focusMode;

  document.body.classList.toggle(
    "focus-mode",
    Galaxy.state.settings.focusMode
  );

  persistAll();

  toast(
    Galaxy.state.settings.focusMode
      ? "Focus mode on"
      : "Focus mode off"
  );
}


function applyFocusMode() {
  document.body.classList.toggle(
    "focus-mode",
    Boolean(
      Galaxy.state.settings.focusMode
    )
  );
}


/* =========================================================
   SECTION 67 — SIDEBAR
   ========================================================= */

function toggleSidebar() {
  const app =
    $("#app");

  if (!app) return;

  if (
    window.innerWidth <=
    900
  ) {
    app.classList.toggle(
      "mobile-sidebar-open"
    );

    Galaxy.state.sidebarOpen =
      app.classList.contains(
        "mobile-sidebar-open"
      );

    return;
  }

  app.classList.toggle(
    "sidebar-collapsed"
  );

  Galaxy.state.sidebarOpen =
    !app.classList.contains(
      "sidebar-collapsed"
    );
}


/* =========================================================
   SECTION 68 — SHARE
   ========================================================= */

async function shareWorkspace() {
  const data = {
    title:
      "GALAXY AI",

    text:
      "GALAXY AI Workspace",

    url:
      window.location.href
  };

  try {
    if (
      navigator.share
    ) {
      await navigator.share(
        data
      );
    } else {
      await copyText(
        window.location.href
      );
    }
  } catch (error) {
    if (
      error?.name !==
      "AbortError"
    ) {
      handleError(
        error,
        "Share"
      );
    }
  }
}


/* =========================================================
   SECTION 69 — CHAT CONTEXT MENU
   ========================================================= */

function closeContextMenu() {
  document
    .querySelectorAll(
      ".context-menu"
    )
    .forEach(
      menu =>
        menu.remove()
    );

  Galaxy.state.contextTarget =
    null;
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

  Galaxy.state.contextTarget =
    {
      type,
      id
    };

  if (
    type === "chat"
  ) {
    const chat =
      Galaxy.state.chats.find(
        item =>
          item.id === id
      );

    if (!chat) return;

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


/* =========================================================
   SECTION 70 — CONTEXT ACTIONS
   ========================================================= */

function handleContextAction(
  action,
  id
) {
  closeContextMenu();

  switch (action) {
    case "rename-chat":
      renameChat(
        id
      );
      break;

    case "pin-chat":
      togglePinChat(
        id
      );
      break;

    case "archive-chat":
      toggleArchiveChat(
        id
      );
      break;

    case "export-chat":
      exportConversation(
        id
      );
      break;

    case "delete-chat":
      deleteChat(
        id
      );
      break;

    case "edit-project":
      editProject(
        id
      );
      break;

    case "delete-project":
      deleteProject(
        id
      );
      break;
  }
}


/* =========================================================
   SECTION 71 — JSON VIEWER
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
      $("#formatJSONButton")
        ?.addEventListener(
          "click",
          () => {
            const input =
              $("#jsonViewerInput");

            const output =
              $("#jsonViewerOutput");

            try {
              const parsed =
                JSON.parse(
                  input.value
                );

              output.textContent =
                JSON.stringify(
                  parsed,
                  null,
                  2
                );
            } catch (error) {
              output.textContent =
                `Invalid JSON: ${error.message}`;
            }
          }
        );
    },
    0
  );
}


/* =========================================================
   SECTION 72 — DIFF VIEWER
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
      $("#compareDiffButton")
        ?.addEventListener(
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

            const output =
              $("#diffOutput");

            if (
              left === right
            ) {
              output.innerHTML = `
                <div class="empty-panel">
                  Text is identical.
                </div>
              `;

              return;
            }

            output.innerHTML = `
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
   SECTION 73 — SCRATCHPAD
   ========================================================= */

function openScratchpad() {
  const saved =
    DB.get(
      "scratchpad",
      ""
    );

  openModal({
    title:
      "Scratchpad",

    body: `
      <textarea
        id="scratchpadInput"
        class="field textarea-field scratchpad-field"
        placeholder="Write anything..."
      >${escapeHTML(saved)}</textarea>
    `
  });

  setTimeout(
    () => {
      $("#scratchpadInput")
        ?.addEventListener(
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


/* =========================================================
   SECTION 74 — TOOL ACTION ROUTER
   ========================================================= */

function handleToolAction(
  action
) {
  switch (action) {
    case "command":
      openCommandPalette();
      break;

    case "prompt-templates":
      openPromptTemplates();
      break;

    case "json-viewer":
      openJSONViewer();
      break;

    case "diff-viewer":
      openDiffViewer();
      break;

    case "scratchpad":
      openScratchpad();
      break;

    case "focus":
      toggleFocusMode();
      break;
  }
}


/* =========================================================
   SECTION 75 — SITE EDITOR TAB
   ========================================================= */

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

  const oldLanguage =
    editor.dataset.language;

  if (
    oldLanguage &&
    site[
      oldLanguage
    ] !== undefined
  ) {
    site[
      oldLanguage
    ] =
      editor.value;
  }

  editor.dataset.language =
    language;

  editor.value =
    site[
      language
    ] ||
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


/* =========================================================
   SECTION 76 — PACK INSTALL TOGGLE
   ========================================================= */

function togglePackInstall(
  id
) {
  const pack =
    Galaxy.state.packs.find(
      item =>
        item.id === id
    );

  if (!pack) return;

  if (
    pack.installed
  ) {
    removePack(
      id
    );
  } else {
    installPack(
      id
    );
  }
}


/* =========================================================
   SECTION 77 — CONTENT TAB ROUTING
   ========================================================= */

function handleContentTab(
  group,
  tab
) {
  switch (group) {
    case "library":
      renderLibrary(
        tab
      );
      break;

    case "packs":
      renderPacks(
        tab
      );
      break;

    case "projects":
      renderProjects();
      break;

    case "scheduled":
      renderScheduled();
      break;

    case "plugins":
      renderPlugins();
      break;

    case "gpts":
      renderAgents();
      break;

    case "sites":
      renderSites();
      break;

    case "images":
      renderImages();
      break;

    case "tools":
      renderTools();
      break;
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
   SECTION 78 — GENERAL CLICK ROUTER
   ========================================================= */

function handleDocumentClick(
  event
) {
  const actionElement =
    event.target.closest(
      "[data-action]"
    );

  const action =
    actionElement
      ?.dataset.action;

  const viewElement =
    event.target.closest(
      "[data-view]"
    );

  const view =
    viewElement
      ?.dataset.view;

  const chatOpen =
    event.target.closest(
      "[data-chat-open]"
    );

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
    );

  const codeCopy =
    event.target.closest(
      "[data-copy-code]"
    );

  const copyMessage =
    event.target.closest(
      "[data-copy-message]"
    );

  const editMessageButton =
    event.target.closest(
      "[data-edit-message]"
    );

  const retryMessageButton =
    event.target.closest(
      "[data-retry-message]"
    );

  const readMessageButton =
    event.target.closest(
      "[data-read-message]"
    );

  const branchMessageButton =
    event.target.closest(
      "[data-branch-message]"
    );

  const previewLibrary =
    event.target.closest(
      "[data-preview-library]"
    );

  const libraryFavorite =
    event.target.closest(
      "[data-library-favorite]"
    );

  const deleteLibrary =
    event.target.closest(
      "[data-delete-library]"
    );

  const editProjectButton =
    event.target.closest(
      "[data-edit-project]"
    );

  const toggleScheduled =
    event.target.closest(
      "[data-toggle-scheduled]"
    );

  const deleteScheduled =
    event.target.closest(
      "[data-delete-scheduled]"
    );

  const pluginInstall =
    event.target.closest(
      "[data-plugin-install]"
    );

  const pluginConnect =
    event.target.closest(
      "[data-plugin-connect]"
    );

  const editAgentButton =
    event.target.closest(
      "[data-edit-agent]"
    );

  const openSiteButton =
    event.target.closest(
      "[data-open-site]"
    );

  const siteTab =
    event.target.closest(
      "[data-site-tab]"
    );

  const openPackButton =
    event.target.closest(
      "[data-open-pack]"
    );

  const packInstall =
    event.target.closest(
      "[data-pack-install-toggle]"
    );

  const packItem =
    event.target.closest(
      "[data-pack-item]"
    );

  const promptTemplate =
    event.target.closest(
      "[data-use-prompt]"
    );

  const workView =
    event.target.closest(
      "[data-work-view]"
    );


  if (
    event.target.classList.contains(
      "overlay"
    )
  ) {
    closeOverlay();
  }


  if (view) {
    openWorkspaceView(
      view
    );
  }


  if (action) {
    switch (action) {
      case "home":
        switchMode(
          "chat"
        );
        break;

      case "new-chat":
        newChat();
        break;

      case "search":
        openSearch();
        break;

      case "command":
        openCommandPalette();
        break;

      case "toggle-sidebar":
        toggleSidebar();
        break;

      case "toggle-more": {
        const menu =
          $("#moreMenu");

        if (menu) {
          menu.hidden =
            !menu.hidden;

          actionElement.setAttribute(
            "aria-expanded",
            String(
              !menu.hidden
            )
          );
        }

        break;
      }

      case "attach":
        $("#fileInput")
          ?.click();
        break;

      case "image":
        $("#imageInput")
          ?.click();
        break;

      case "video":
        $("#videoInput")
          ?.click();
        break;

      case "voice":
        toggleVoiceRecording();
        break;

      case "web-search":
        toggleWebSearch();
        break;

      case "send":
        sendMessage();
        break;

      case "send-work":
        sendWorkMessage();
        break;

      case "focus":
        toggleFocusMode();
        break;

      case "notifications":
        openNotifications();
        break;

      case "settings":
        openSettings();
        break;

      case "share":
        shareWorkspace();
        break;

      case "close-overlay":
        closeOverlay();
        break;

      case "new-project":
        createProject();
        break;

      case "new-scheduled":
        createScheduledTask();
        break;

      case "new-agent":
        createAgent();
        break;

      case "new-site":
        createSite();
        break;

      case "new-image":
        createImageConcept();
        break;

      case "save-site":
        saveActiveSite();
        break;

      case "preview-site":
        previewActiveSite();
        break;

      case "prompt-templates":
        openPromptTemplates();
        break;

      case "refresh-preview":
        renderWorkDocument();
        break;

      case "fullscreen-preview":
        $("#previewSurface")
          ?.requestFullscreen
          ?.();
        break;

      case "reset-data":
        confirmAction({
          title:
            "Reset GALAXY",

          message:
            "Delete all locally saved GALAXY data?",

          confirmLabel:
            "Reset",

          onConfirm() {
            DB.clear();

            window.location.reload();
          }
        });

        break;
    }
  }


  if (chatOpen) {
    Galaxy.state.currentChatId =
      chatOpen.dataset.chatOpen;

    persistAll();

    switchMode(
      "chat"
    );

    renderChat();

    renderRecentChats();
  }


  if (contextOpen) {
    const type =
      contextOpen.dataset.contextOpen;

    const id =
      contextOpen.dataset.contextId;

    const rect =
      contextOpen.getBoundingClientRect();

    openContextMenu(
      type,
      id,
      rect.right,
      rect.bottom
    );
  }


  if (contextAction) {
    handleContextAction(
      contextAction.dataset.contextAction,
      contextAction.dataset.contextId
    );
  }


  if (contentTab) {
    handleContentTab(
      contentTab.dataset.contentGroup,
      contentTab.dataset.contentTab
    );
  }


  if (searchResult) {
    openSearchResult(
      searchResult.dataset.searchResult,
      searchResult.dataset.searchId
    );
  }


  if (command) {
    const item =
      COMMANDS.find(
        commandItem =>
          commandItem.name ===
          command.dataset.commandName
      );

    closeOverlay();

    item?.run?.();
  }


  if (toolAction) {
    handleToolAction(
      toolAction.dataset.toolAction
    );
  }


  if (codeCopy) {
    copyText(
      decodeURIComponent(
        codeCopy.dataset.copyCode
      )
    );
  }


  if (copyMessage) {
    const chat =
      getCurrentChat();

    const message =
      chat?.messages.find(
        item =>
          item.id ===
          copyMessage.dataset.copyMessage
      );

    if (message) {
      copyText(
        message.text
      );
    }
  }


  if (editMessageButton) {
    editMessage(
      editMessageButton.dataset.editMessage
    );
  }


  if (retryMessageButton) {
    retryMessage(
      retryMessageButton.dataset.retryMessage
    );
  }


  if (readMessageButton) {
    readAloud(
      readMessageButton.dataset.readMessage
    );
  }


  if (branchMessageButton) {
    branchConversation(
      branchMessageButton.dataset.branchMessage
    );
  }


  if (previewLibrary) {
    previewLibraryItem(
      previewLibrary.dataset.previewLibrary
    );
  }


  if (libraryFavorite) {
    toggleLibraryFavorite(
      libraryFavorite.dataset.libraryFavorite
    );
  }


  if (deleteLibrary) {
    deleteLibraryItem(
      deleteLibrary.dataset.deleteLibrary
    );
  }


  if (editProjectButton) {
    editProject(
      editProjectButton.dataset.editProject
    );
  }


  if (toggleScheduled) {
    toggleScheduledTask(
      toggleScheduled.dataset.toggleScheduled
    );
  }


  if (deleteScheduled) {
    deleteScheduledTask(
      deleteScheduled.dataset.deleteScheduled
    );
  }


  if (pluginInstall) {
    togglePluginInstall(
      pluginInstall.dataset.pluginInstall
    );
  }


  if (pluginConnect) {
    togglePluginConnection(
      pluginConnect.dataset.pluginConnect
    );
  }


  if (editAgentButton) {
    const agent =
      Galaxy.state.agents.find(
        item =>
          item.id ===
          editAgentButton.dataset.editAgent
      );

    if (agent) {
      openAgentEditor(
        agent
      );
    }
  }


  if (openSiteButton) {
    openSiteEditor(
      openSiteButton.dataset.openSite
    );
  }


  if (siteTab) {
    switchSiteEditorTab(
      siteTab.dataset.siteTab
    );
  }


  if (openPackButton) {
    openPack(
      openPackButton.dataset.openPack
    );
  }


  if (packInstall) {
    togglePackInstall(
      packInstall.dataset.packInstallToggle
    );
  }


  if (packItem) {
    const input =
      $("#promptInput");

    if (input) {
      input.value =
        packItem.dataset.packItem;

      switchMode(
        "chat"
      );

      autoResizeTextarea(
        input
      );

      input.focus();
    }
  }


  if (promptTemplate) {
    usePromptTemplate(
      promptTemplate.dataset.usePrompt
    );
  }


  if (workView) {
    if (
      workView.dataset.workView ===
      "preview"
    ) {
      previewWorkDocument();
    }

    if (
      workView.dataset.workView ===
      "edit"
    ) {
      renderWorkDocument();
    }
  }
}


/* =========================================================
   SECTION 79 — RIGHT CLICK
   ========================================================= */

function handleContextMenuEvent(
  event
) {
  const target =
    event.target.closest(
      "[data-context-type]"
    );

  if (!target) return;

  event.preventDefault();

  openContextMenu(
    target.dataset.contextType,
    target.dataset.contextId,
    event.clientX,
    event.clientY
  );
}


/* =========================================================
   SECTION 80 — INPUT EVENTS
   ========================================================= */

function handleDocumentInput(
  event
) {
  if (
    event.target.id ===
    "promptInput"
  ) {
    autoResizeTextarea(
      event.target
    );

    if (
      Galaxy.state.settings.autosave
    ) {
      clearTimeout(
        handleDocumentInput.autosaveTimer
      );

      handleDocumentInput.autosaveTimer =
        setTimeout(
          () => {
            DB.set(
              "draft",
              event.target.value
            );

            const state =
              $("#draftState");

            if (state) {
              state.textContent =
                event.target.value
                  ? "Draft saved"
                  : "Ready";
            }
          },
          Galaxy.state.settings.autosaveDelay
        );
    }
  }


  if (
    event.target.id ===
    "commandInput"
  ) {
    const mode =
      event.target.dataset.commandMode;

    if (
      mode === "search"
    ) {
      renderFilteredSearchResults(
        event.target.value
      );
    } else {
      renderCommandResults(
        event.target.value,
        mode
      );
    }
  }
}


/* =========================================================
   SECTION 81 — MESSAGE INPUT KEYDOWN
   ========================================================= */

function handlePromptKeydown(
  event
) {
  if (
    event.target.id !==
    "promptInput"
  ) {
    return;
  }

  if (
    event.key ===
      "Enter" &&
    !event.shiftKey &&
    Galaxy.state.settings.enterToSend
  ) {
    event.preventDefault();

    sendMessage();
  }
}


/* =========================================================
   SECTION 82 — GLOBAL KEYBOARD SHORTCUTS
   ========================================================= */

function handleKeyboardShortcuts(
  event
) {
  const key =
    event.key.toLowerCase();

  const modifier =
    event.ctrlKey ||
    event.metaKey;

  if (
    event.key ===
    "Escape"
  ) {
    closeOverlay();

    closeContextMenu();

    return;
  }


  if (
    modifier &&
    key === "k"
  ) {
    event.preventDefault();

    openSearch();

    return;
  }


  if (
    modifier &&
    key === "n"
  ) {
    event.preventDefault();

    newChat();

    return;
  }


  if (
    modifier &&
    event.key === "."
  ) {
    event.preventDefault();

    toggleFocusMode();

    return;
  }


  if (
    modifier &&
    event.key === "/"
  ) {
    event.preventDefault();

    toggleTheme();

    return;
  }


  if (
    event.altKey &&
    event.key === "1"
  ) {
    event.preventDefault();

    switchMode(
      "chat"
    );

    return;
  }


  if (
    event.altKey &&
    event.key === "2"
  ) {
    event.preventDefault();

    switchMode(
      "work"
    );
  }
}


/* =========================================================
   SECTION 83 — FILE INPUT EVENTS
   ========================================================= */

function bindFileInputs() {
  on(
    $("#fileInput"),
    "change",
    event => {
      if (
        event.target.files
          ?.length
      ) {
        addFiles(
          event.target.files
        );
      }

      event.target.value =
        "";
    }
  );


  on(
    $("#imageInput"),
    "change",
    event => {
      if (
        event.target.files
          ?.length
      ) {
        addFiles(
          event.target.files
        );

        Array.from(
          event.target.files
        )
          .forEach(
            file =>
              addLibraryFile(
                file
              )
          );
      }

      event.target.value =
        "";
    }
  );


  on(
    $("#videoInput"),
    "change",
    event => {
      if (
        event.target.files
          ?.length
      ) {
        addFiles(
          event.target.files
        );

        Array.from(
          event.target.files
        )
          .forEach(
            file =>
              addLibraryFile(
                file
              )
          );
      }

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
          file =>
            addLibraryFile(
              file
            )
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
        event.target.files?.[
          0
        ];

      if (file) {
        importConversation(
          file
        );
      }

      event.target.value =
        "";
    }
  );
}


/* =========================================================
   SECTION 84 — MODE TABS
   ========================================================= */

function bindModeTabs() {
  $$(".mode-tab")
    .forEach(
      tab => {
        on(
          tab,
          "click",
          () => {
            switchMode(
              tab.dataset.mode
            );
          }
        );
      }
    );
}


/* =========================================================
   SECTION 85 — WINDOW RESIZE
   ========================================================= */

function handleResize() {
  if (
    window.innerWidth >
    900
  ) {
    $("#app")
      ?.classList.remove(
        "mobile-sidebar-open"
      );
  }
}


/* =========================================================
   SECTION 86 — SETTINGS CHANGE EVENTS
   ========================================================= */

function bindSettingsEvents() {
  document.addEventListener(
    "click",
    event => {
      const toggle =
        event.target.closest(
          "[data-setting-toggle]"
        );

      if (!toggle) return;

      const key =
        toggle.dataset.settingToggle;

      Galaxy.state.settings[
        key
      ] =
        !Galaxy.state.settings[
          key
        ];

      persistAll();

      applyTheme();

      applyFocusMode();

      toggle.classList.toggle(
        "active",
        Galaxy.state.settings[
          key
        ]
      );

      toggle.setAttribute(
        "aria-pressed",
        String(
          Galaxy.state.settings[
            key
          ]
        )
      );
    }
  );


  document.addEventListener(
    "change",
    event => {
      const select =
        event.target.closest(
          "[data-setting-select]"
        );

      if (!select) return;

      Galaxy.state.settings[
        select.dataset.settingSelect
      ] =
        select.value;

      persistAll();

      applyTheme();
    }
  );
}


/* =========================================================
   SECTION 87 — INITIAL CHAT
   ========================================================= */

function ensureInitialChatState() {
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
}


/* =========================================================
   SECTION 88 — RESTORE DRAFT
   ========================================================= */

function restoreDraft() {
  const input =
    $("#promptInput");

  if (!input) return;

  const draft =
    DB.get(
      "draft",
      ""
    );

  input.value =
    draft || "";

  autoResizeTextarea(
    input
  );

  const status =
    $("#draftState");

  if (
    status &&
    draft
  ) {
    status.textContent =
      "Draft restored";
  }
}


/* =========================================================
   SECTION 89 — INITIAL VIEW
   ========================================================= */

function restoreView() {
  if (
    Galaxy.state.mode ===
    "work"
  ) {
    switchMode(
      "work"
    );

    return;
  }

  switchMode(
    "chat"
  );
}


/* =========================================================
   SECTION 90 — INITIALIZE GALAXY
   ========================================================= */

function initGalaxy() {
  try {
    seedGalaxyData();

    ensureInitialChatState();

    applyTheme();

    applyFocusMode();

    restoreDraft();

    renderRecentChats();

    renderChat();

    renderWebSearchState();

    renderVoiceState();

    updateNotificationIndicator();

    updateSendButtonState();

    bindModeTabs();

    bindFileInputs();

    bindSettingsEvents();

    document.addEventListener(
      "click",
      handleDocumentClick
    );

    document.addEventListener(
      "contextmenu",
      handleContextMenuEvent
    );

    document.addEventListener(
      "input",
      handleDocumentInput
    );

    document.addEventListener(
      "keydown",
      handlePromptKeydown
    );

    document.addEventListener(
      "keydown",
      handleKeyboardShortcuts
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    window.addEventListener(
      "blur",
      closeContextMenu
    );

    restoreView();

    addNotification({
      title:
        "GALAXY ready",

      message:
        "Your AI workspace is ready.",

      type:
        "info"
    });

    console.log(
      `GALAXY AI ${Galaxy.version} ready`
    );
  } catch (error) {
    handleError(
      error,
      "Initialization"
    );
  }
}


/* =========================================================
   SECTION 91 — START APPLICATION
   ========================================================= */

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
