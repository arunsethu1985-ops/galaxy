"use strict";

/* =========================================================
   GALAXY AI
   FINAL FRONTEND SCRIPT
   index.html + style.css + script.js

   IMPORTANT:
   API KEYS MUST NEVER BE PUT IN THIS FILE.

   Backend endpoints:
   OpenAI -> /api/chat
   Gemini -> /api/gemini
   Image  -> /api/image
   Video  -> /api/video
   ========================================================= */


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

const uid = (prefix = "galaxy") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

const Storage = {
  prefix: "galaxy.ai.final.",

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(
        this.prefix + key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.warn("GALAXY storage error:", error);
    }
  },

  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }
};


/* =========================================================
   MAIN STATE
   ========================================================= */

const Galaxy = {
  version: "5.0.0",

  state: {
    view: "chat",
    provider: Storage.get("provider", "openai"),
    webSearch: false,
    generating: false,

    chats: Storage.get("chats", []),

    activeChatId:
      Storage.get("activeChatId", null),

    projects:
      Storage.get("projects", []),

    assets:
      Storage.get("assets", []),

    generations:
      Storage.get("generations", []),

    creativeProjects:
      Storage.get("creativeProjects", []),

    scheduled:
      Storage.get("scheduled", []),

    selectedStudioMode: "text-video",
    selectedCamera: "Static",

    studioReferences: []
  }
};


/* =========================================================
   DEFAULT DATA
   ========================================================= */

const DEFAULT_PACKS = [
  {
    icon: "⌕",
    name: "Research Pack",
    description:
      "Research topics, compare sources and organize findings."
  },
  {
    icon: "✎",
    name: "Writing Pack",
    description:
      "Draft, rewrite, summarize and improve written content."
  },
  {
    icon: "▣",
    name: "Developer Pack",
    description:
      "Build websites, apps and software projects."
  },
  {
    icon: "◈",
    name: "Design Pack",
    description:
      "Plan interfaces, visuals and creative projects."
  },
  {
    icon: "▷",
    name: "Video Pack",
    description:
      "Develop scenes, prompts, shots and video concepts."
  },
  {
    icon: "▤",
    name: "Data Pack",
    description:
      "Analyze structured information and reports."
  }
];

const DEFAULT_AGENTS = [
  {
    icon: "◇",
    name: "Research Agent",
    description:
      "Investigates topics and organizes findings."
  },
  {
    icon: "⌘",
    name: "Coding Agent",
    description:
      "Helps build, debug and improve software."
  },
  {
    icon: "✦",
    name: "Creative Agent",
    description:
      "Creates visual concepts, prompts and stories."
  },
  {
    icon: "▣",
    name: "Project Agent",
    description:
      "Plans projects, milestones and tasks."
  }
];

const DEFAULT_PLUGINS = [
  {
    icon: "✉",
    name: "Mail",
    description:
      "Connect email workflows."
  },
  {
    icon: "◷",
    name: "Calendar",
    description:
      "Work with schedules and events."
  },
  {
    icon: "▤",
    name: "Drive",
    description:
      "Work with cloud files."
  },
  {
    icon: "⌘",
    name: "GitHub",
    description:
      "Work with repositories and code."
  },
  {
    icon: "◇",
    name: "Slack",
    description:
      "Work with team conversations."
  }
];


/* =========================================================
   SAVE STATE
   ========================================================= */

function saveState() {
  Storage.set("provider", Galaxy.state.provider);
  Storage.set("chats", Galaxy.state.chats);
  Storage.set("activeChatId", Galaxy.state.activeChatId);
  Storage.set("projects", Galaxy.state.projects);
  Storage.set("assets", Galaxy.state.assets);
  Storage.set("generations", Galaxy.state.generations);
  Storage.set(
    "creativeProjects",
    Galaxy.state.creativeProjects
  );
  Storage.set("scheduled", Galaxy.state.scheduled);
}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {
  const root = $("#toastRoot");

  if (!root) return;

  const item = document.createElement("div");

  item.className = "toast";
  item.textContent = message;

  root.appendChild(item);

  setTimeout(() => {
    item.remove();
  }, 2800);
}


/* =========================================================
   VIEW ROUTING
   ========================================================= */

function hideAllViews() {
  $$(".view").forEach(view =>
    view.classList.remove("active-view")
  );
}

function updateNavigation(view) {
  $$("[data-view]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });

  $$(".mode").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });
}

function openView(view) {
  Galaxy.state.view = view;

  hideAllViews();
  updateNavigation(view);

  if (view === "chat") {
    $("#chatView")?.classList.add("active-view");
    renderChat();
  }

  else if (view === "work") {
    $("#workView")?.classList.add("active-view");
  }

  else if (view === "create") {
    $("#createView")?.classList.add("active-view");
  }

  else {
    $("#contentView")?.classList.add("active-view");
    renderWorkspace(view);
  }

  $("#sidebar")?.classList.remove("open");
}


/* =========================================================
   CHAT
   ========================================================= */

function getActiveChat() {
  return Galaxy.state.chats.find(
    chat => chat.id === Galaxy.state.activeChatId
  );
}

function createChat() {
  const chat = {
    id: uid("chat"),
    title: "New chat",
    createdAt: Date.now(),
    messages: []
  };

  Galaxy.state.chats.unshift(chat);
  Galaxy.state.activeChatId = chat.id;

  saveState();
  renderRecentChats();
  openView("chat");

  setTimeout(() => {
    $("#promptInput")?.focus();
  }, 50);
}

function ensureChat() {
  let chat = getActiveChat();

  if (!chat) {
    createChat();
    chat = getActiveChat();
  }

  return chat;
}

function renderRecentChats() {
  const root = $("#recentChats");

  if (!root) return;

  const chats = Galaxy.state.chats.slice(0, 15);

  if (!chats.length) {
    root.innerHTML = "";
    return;
  }

  root.innerHTML = chats.map(chat => `
    <button
      class="recent-btn"
      data-chat-id="${chat.id}"
      title="${escapeHTML(chat.title)}"
    >
      ${escapeHTML(chat.title)}
    </button>
  `).join("");
}

function renderChat() {
  const messagesRoot = $("#messages");
  const empty = $("#chatEmpty");

  if (!messagesRoot || !empty) return;

  const chat = getActiveChat();

  if (!chat || !chat.messages.length) {
    messagesRoot.innerHTML = "";
    empty.style.display = "";
    return;
  }

  empty.style.display = "none";

  messagesRoot.innerHTML =
    chat.messages.map(message => `
      <article class="message ${message.role}">
        <div class="bubble">
          ${
            message.role === "assistant"
              ? renderMarkdown(message.content)
              : escapeHTML(message.content)
          }
        </div>

        <div class="message-meta">
          ${escapeHTML(message.time || "")}
        </div>
      </article>
    `).join("");

  requestAnimationFrame(() => {
    messagesRoot.lastElementChild?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  });
}

function addMessage(role, content) {
  const chat = ensureChat();

  chat.messages.push({
    id: uid("message"),
    role,
    content,
    time: formatTime()
  });

  if (
    role === "user" &&
    (
      chat.title === "New chat" ||
      !chat.title
    )
  ) {
    chat.title =
      content.length > 38
        ? content.slice(0, 38) + "…"
        : content;
  }

  saveState();
  renderChat();
  renderRecentChats();
}


/* =========================================================
   BASIC MARKDOWN
   ========================================================= */

function renderMarkdown(text = "") {
  let output = escapeHTML(text);

  output = output.replace(
    /```([\s\S]*?)```/g,
    "<pre><code>$1</code></pre>"
  );

  output = output.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  output = output.replace(
    /^### (.*)$/gm,
    "<h3>$1</h3>"
  );

  output = output.replace(
    /^## (.*)$/gm,
    "<h2>$1</h2>"
  );

  output = output.replace(
    /^# (.*)$/gm,
    "<h1>$1</h1>"
  );

  output = output.replace(/\n/g, "<br>");

  return output;
}


/* =========================================================
   BACKEND AI
   ========================================================= */

async function fetchAIResponse(prompt) {
  const provider =
    $("#aiProvider")?.value ||
    Galaxy.state.provider ||
    "openai";

  Galaxy.state.provider = provider;

  saveState();

  const endpoint =
    provider === "gemini"
      ? "/api/gemini"
      : "/api/chat";

  const chat = getActiveChat();

  const messages =
    chat?.messages.map(message => ({
      role: message.role,
      content: message.content
    })) || [];

  const response = await fetch(endpoint, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      prompt,
      messages,
      webSearch: Galaxy.state.webSearch
    })
  });

  if (!response.ok) {
    let message =
      `GALAXY API error (${response.status})`;

    try {
      const data = await response.json();

      message =
        data.error ||
        data.message ||
        message;
    } catch {}

    throw new Error(message);
  }

  const data = await response.json();

  return (
    data.reply ||
    data.text ||
    data.output ||
    data.output_text ||
    data.message ||
    "GALAXY received an empty response."
  );
}

async function sendChatMessage() {
  if (Galaxy.state.generating) return;

  const input = $("#promptInput");

  if (!input) return;

  const prompt = input.value.trim();

  if (!prompt) return;

  input.value = "";
  resizePrompt();

  addMessage("user", prompt);

  Galaxy.state.generating = true;

  $("#sendBtn")?.setAttribute("disabled", "");

  try {
    const reply =
      await fetchAIResponse(prompt);

    addMessage("assistant", reply);
  }

  catch (error) {
    addMessage(
      "assistant",
      `I couldn't reach the GALAXY backend.\n\n${error.message}`
    );
  }

  finally {
    Galaxy.state.generating = false;

    $("#sendBtn")?.removeAttribute("disabled");
  }
}

function resizePrompt() {
  const input = $("#promptInput");

  if (!input) return;

  input.style.height = "auto";

  input.style.height =
    Math.min(input.scrollHeight, 180) + "px";
}


/* =========================================================
   WORK
   ========================================================= */

async function runWork() {
  const input = $("#workPrompt");
  const output = $("#workOutput");

  if (!input || !output) return;

  const prompt = input.value.trim();

  if (!prompt) {
    toast("Describe the work first.");
    return;
  }

  output.textContent =
    "GALAXY is working…";

  try {
    const reply =
      await fetchAIResponse(
        `Work task:\n${prompt}`
      );

    output.textContent = reply;
  }

  catch (error) {
    output.textContent =
      error.message;
  }
}


/* =========================================================
   CREATE STUDIO
   ========================================================= */

function setStudioMode(mode) {
  Galaxy.state.selectedStudioMode = mode;

  $$("[data-studio]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.studio === mode
    );
  });

  const prompt = $("#studioPrompt");

  if (!prompt) return;

  const placeholders = {
    "text-video":
      "Describe the scene, subject, motion, camera, lighting and audio…",

    "frames-video":
      "Describe how the start frame should transition into the end frame…",

    ingredients:
      "Describe how GALAXY should combine your characters, objects and references…",

    image:
      "Describe the image you want to create…",

    character:
      "Describe the character, appearance, clothing and personality…",

    avatar:
      "Describe the avatar, speaking style, appearance and scene…"
  };

  prompt.placeholder =
    placeholders[mode] ||
    "Describe what you want to create…";
}

function selectCamera(button) {
  $$("#cameraChips button").forEach(item =>
    item.classList.remove("active")
  );

  button.classList.add("active");

  Galaxy.state.selectedCamera =
    button.textContent.trim();
}

function newCreativeProject() {
  const project = {
    id: uid("creative"),
    name:
      `Creative Project ${Galaxy.state.creativeProjects.length + 1}`,
    createdAt: Date.now()
  };

  Galaxy.state.creativeProjects.unshift(project);

  saveState();

  $("#studioPrompt").value = "";

  Galaxy.state.studioReferences = [];

  toast("New creative project created.");
}

function studioUpload() {
  const input = $("#fileInput");

  if (!input) return;

  input.dataset.target = "studio";
  input.click();
}

async function generateStudioContent() {
  const prompt =
    $("#studioPrompt")?.value.trim();

  if (!prompt) {
    toast("Enter a creative prompt first.");
    return;
  }

  const mode =
    Galaxy.state.selectedStudioMode;

  const camera =
    Galaxy.state.selectedCamera;

  const model =
    $("#studioModel")?.value || "";

  const aspect =
    $("#studioAspect")?.value || "16:9";

  const duration =
    $("#studioDuration")?.value || "";

  const quality =
    $("#studioQuality")?.value || "";

  const generation = {
    id: uid("generation"),
    mode,
    prompt,
    camera,
    model,
    aspect,
    duration,
    quality,
    status: "generating",
    createdAt: Date.now(),
    url: null
  };

  Galaxy.state.generations.unshift(generation);

  saveState();
  renderGenerations();

  const endpoint =
    mode === "image"
      ? "/api/image"
      : "/api/video";

  try {
    const response = await fetch(endpoint, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        prompt,
        mode,
        camera,
        model,
        aspect,
        duration,
        quality
      })
    });

    if (!response.ok)
      throw new Error("Media API not connected");

    const data = await response.json();

    generation.status = "ready";

    generation.url =
      data.url ||
      data.image ||
      data.video ||
      null;
  }

  catch {
    /*
       Frontend still works without media API.
       It creates a draft generation card.
    */

    await delay(700);

    generation.status = "draft";
  }

  saveState();
  renderGenerations();
}

function renderGenerations() {
  const root = $("#generationGrid");

  if (!root) return;

  const generations =
    Galaxy.state.generations.slice(0, 12);

  if (!generations.length) {
    root.innerHTML = `
      <div class="empty-card">
        <span>✦</span>
        <b>Your generations appear here</b>
        <small>
          Connect /api/image and /api/video
          for real media generation.
        </small>
      </div>
    `;

    return;
  }

  root.innerHTML =
    generations.map(item => `
      <article class="generation-card">

        <div class="generation-preview">

          ${
            item.url &&
            item.mode === "image"
              ? `<img src="${escapeHTML(item.url)}" alt="">`
              : item.url
                ? `<video src="${escapeHTML(item.url)}" controls></video>`
                : item.mode === "image"
                  ? "▧"
                  : "▷"
          }

        </div>

        <div class="generation-body">

          <b>
            ${escapeHTML(
              item.mode.replaceAll("-", " ")
            )}
          </b>

          <p>
            ${escapeHTML(item.prompt)}
          </p>

          <small>
            ${escapeHTML(item.status)}
          </small>

          <br><br>

          <button
            data-generation-reuse="${item.id}"
          >
            Reuse prompt
          </button>

          <button
            data-generation-delete="${item.id}"
          >
            Delete
          </button>

        </div>

      </article>
    `).join("");
}


/* =========================================================
   WORKSPACE HEADER
   ========================================================= */

function workspaceHeader(
  eyebrow,
  title,
  description = ""
) {
  return `
    <div class="page-head">

      <div>
        <span class="eyebrow">
          ${escapeHTML(eyebrow)}
        </span>

        <h1>
          ${escapeHTML(title)}
        </h1>

        ${
          description
            ? `<p>${escapeHTML(description)}</p>`
            : ""
        }
      </div>

    </div>
  `;
}


/* =========================================================
   WORKSPACE ROUTER
   ========================================================= */

function renderWorkspace(view) {
  const root = $("#contentBody");

  if (!root) return;

  switch (view) {
    case "search":
      renderSearch();
      break;

    case "projects":
      renderProjects();
      break;

    case "assets":
      renderAssets();
      break;

    case "scenes":
      renderScenes();
      break;

    case "games":
      renderGames();
      break;

    case "packs":
      renderPacks();
      break;

    case "agents":
      renderAgents();
      break;

    case "plugins":
      renderPlugins();
      break;

    case "scheduled":
      renderScheduled();
      break;

    case "sites":
      renderSites();
      break;

    default:
      root.innerHTML =
        workspaceHeader(
          "GALAXY",
          "Workspace"
        );
  }
}


/* =========================================================
   SEARCH
   ========================================================= */

function renderSearch() {
  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "GALAXY SEARCH",
      "Search",
      "Search across your GALAXY workspace."
    )}

    <div class="panel">

      <input
        id="workspaceSearch"
        placeholder="Search chats, projects and assets…"
        style="
          width:100%;
          padding:14px;
          border:1px solid var(--line, #3a3a3a);
          background:transparent;
          color:inherit;
          border-radius:12px;
        "
      >

      <div
        id="workspaceSearchResults"
        class="cards"
        style="margin-top:15px"
      ></div>

    </div>
  `;
}

function runWorkspaceSearch(query) {
  const root =
    $("#workspaceSearchResults");

  if (!root) return;

  const q =
    query.toLowerCase().trim();

  if (!q) {
    root.innerHTML = "";
    return;
  }

  const results = [];

  Galaxy.state.chats.forEach(chat => {
    if (
      chat.title.toLowerCase().includes(q)
    ) {
      results.push({
        type: "Chat",
        name: chat.title
      });
    }
  });

  Galaxy.state.projects.forEach(project => {
    if (
      project.name.toLowerCase().includes(q)
    ) {
      results.push({
        type: "Project",
        name: project.name
      });
    }
  });

  Galaxy.state.assets.forEach(asset => {
    if (
      asset.name.toLowerCase().includes(q)
    ) {
      results.push({
        type: "Asset",
        name: asset.name
      });
    }
  });

  root.innerHTML =
    results.length
      ? results.map(item => `
          <div class="card">
            <small>${item.type}</small>
            <h3>${escapeHTML(item.name)}</h3>
          </div>
        `).join("")
      : `
        <div class="card">
          <p>No results found.</p>
        </div>
      `;
}


/* =========================================================
   PROJECTS
   ========================================================= */

function renderProjects() {
  const projects =
    Galaxy.state.projects;

  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "WORKSPACE",
      "Projects",
      "Organize chats, files and work."
    )}

    <button
      class="primary"
      data-action="create-project"
    >
      ＋ New project
    </button>

    <div class="cards" style="margin-top:18px">

      ${
        projects.length
          ? projects.map(project => `
              <article class="card">

                <h3>
                  ${escapeHTML(project.name)}
                </h3>

                <p>
                  GALAXY project workspace
                </p>

                <button
                  data-delete-project="${project.id}"
                >
                  Delete
                </button>

              </article>
            `).join("")
          : `
            <article class="card">
              <h3>No projects yet</h3>
              <p>Create your first GALAXY project.</p>
            </article>
          `
      }

    </div>
  `;
}

function createProject() {
  const name =
    prompt("Project name:");

  if (!name?.trim()) return;

  Galaxy.state.projects.unshift({
    id: uid("project"),
    name: name.trim(),
    createdAt: Date.now()
  });

  saveState();
  renderProjects();
}


/* =========================================================
   ASSETS
   ========================================================= */

function renderAssets() {
  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "LIBRARY",
      "Library / Assets",
      "Images, videos and uploaded files."
    )}

    <button
      class="primary"
      data-action="upload"
    >
      ＋ Upload
    </button>

    <div class="cards" style="margin-top:18px">

      ${
        Galaxy.state.assets.length
          ? Galaxy.state.assets.map(asset => `
              <article class="card">
                <div class="game-icon">
                  ${
                    asset.type?.startsWith("image/")
                      ? "▧"
                      : asset.type?.startsWith("video/")
                        ? "▷"
                        : "▤"
                  }
                </div>

                <h3>
                  ${escapeHTML(asset.name)}
                </h3>

                <p>
                  ${escapeHTML(asset.type || "File")}
                </p>

                <button
                  data-delete-asset="${asset.id}"
                >
                  Delete
                </button>
              </article>
            `).join("")
          : `
            <article class="card">
              <h3>No assets yet</h3>
              <p>Upload images, videos or files.</p>
            </article>
          `
      }

    </div>
  `;
}


/* =========================================================
   SCENEBUILDER
   ========================================================= */

function renderScenes() {
  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "GALAXY CREATE",
      "Scenebuilder",
      "Build your story shot by shot."
    )}

    <div class="panel">

      <textarea
        id="scenePrompt"
        class="studio-prompt"
        placeholder="Describe a scene…"
      ></textarea>

      <button
        class="primary"
        data-action="add-scene"
        style="margin-top:12px"
      >
        ＋ Add scene
      </button>

      <div
        id="sceneList"
        class="cards"
        style="margin-top:18px"
      ></div>

    </div>
  `;

  renderSceneList();
}

let scenes =
  Storage.get("scenes", []);

function renderSceneList() {
  const root = $("#sceneList");

  if (!root) return;

  root.innerHTML =
    scenes.length
      ? scenes.map((scene, index) => `
          <article class="card">
            <small>SCENE ${index + 1}</small>
            <h3>
              ${escapeHTML(scene.title)}
            </h3>
            <p>
              ${escapeHTML(scene.prompt)}
            </p>
            <button
              data-delete-scene="${scene.id}"
            >
              Delete
            </button>
          </article>
        `).join("")
      : `
        <article class="card">
          <h3>No scenes</h3>
          <p>Add your first scene.</p>
        </article>
      `;
}

function addScene() {
  const input = $("#scenePrompt");

  const promptText =
    input?.value.trim();

  if (!promptText) return;

  scenes.push({
    id: uid("scene"),
    title: `Scene ${scenes.length + 1}`,
    prompt: promptText
  });

  Storage.set("scenes", scenes);

  input.value = "";

  renderSceneList();
}


/* =========================================================
   PACKS
   ========================================================= */

function renderPacks() {
  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "EXPLORE",
      "Packs",
      "Ready-made GALAXY workflows."
    )}

    <div class="cards">

      ${DEFAULT_PACKS.map(pack => `
        <article class="card">

          <div class="game-icon">
            ${pack.icon}
          </div>

          <h3>
            ${escapeHTML(pack.name)}
          </h3>

          <p>
            ${escapeHTML(pack.description)}
          </p>

          <button
            data-use-pack="${escapeHTML(pack.name)}"
          >
            Use pack
          </button>

        </article>
      `).join("")}

    </div>
  `;
}


/* =========================================================
   AGENTS
   ========================================================= */

function renderAgents() {
  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "GALAXY",
      "GPTs / Agents",
      "Specialized AI assistants."
    )}

    <div class="cards">

      ${DEFAULT_AGENTS.map(agent => `
        <article class="card">

          <div class="game-icon">
            ${agent.icon}
          </div>

          <h3>
            ${escapeHTML(agent.name)}
          </h3>

          <p>
            ${escapeHTML(agent.description)}
          </p>

          <button
            data-agent="${escapeHTML(agent.name)}"
          >
            Start
          </button>

        </article>
      `).join("")}

    </div>
  `;
}


/* =========================================================
   PLUGINS
   ========================================================= */

function renderPlugins() {
  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "TOOLS",
      "Plugins",
      "Connect GALAXY with external services."
    )}

    <div class="cards">

      ${DEFAULT_PLUGINS.map(plugin => `
        <article class="card">

          <div class="game-icon">
            ${plugin.icon}
          </div>

          <h3>
            ${escapeHTML(plugin.name)}
          </h3>

          <p>
            ${escapeHTML(plugin.description)}
          </p>

          <button
            data-plugin="${escapeHTML(plugin.name)}"
          >
            Connect
          </button>

        </article>
      `).join("")}

    </div>
  `;
}


/* =========================================================
   SCHEDULED
   ========================================================= */

function renderScheduled() {
  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "AUTOMATION",
      "Scheduled",
      "Tasks GALAXY can run later."
    )}

    <button
      class="primary"
      data-action="new-scheduled"
    >
      ＋ New task
    </button>

    <div class="cards" style="margin-top:18px">

      ${
        Galaxy.state.scheduled.length
          ? Galaxy.state.scheduled.map(task => `
              <article class="card">
                <h3>${escapeHTML(task.name)}</h3>
                <p>${escapeHTML(task.schedule)}</p>
                <button
                  data-delete-task="${task.id}"
                >
                  Delete
                </button>
              </article>
            `).join("")
          : `
            <article class="card">
              <h3>No scheduled tasks</h3>
              <p>Create a scheduled GALAXY task.</p>
            </article>
          `
      }

    </div>
  `;
}

function createScheduledTask() {
  const name =
    prompt("Task name:");

  if (!name?.trim()) return;

  const schedule =
    prompt(
      "When should it run?",
      "Every day"
    );

  Galaxy.state.scheduled.push({
    id: uid("task"),
    name: name.trim(),
    schedule: schedule || "Not set"
  });

  saveState();
  renderScheduled();
}


/* =========================================================
   SITES
   ========================================================= */

function renderSites() {
  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "BUILD",
      "Sites",
      "Build websites with GALAXY."
    )}

    <div class="cards">

      <article class="card">
        <div class="game-icon">◎</div>
        <h3>New website</h3>
        <p>
          Ask GALAXY to design and build a website.
        </p>
        <button
          data-site-prompt="Build a professional website for me."
        >
          Start building
        </button>
      </article>

      <article class="card">
        <div class="game-icon">▣</div>
        <h3>Landing page</h3>
        <p>
          Create a modern landing page.
        </p>
        <button
          data-site-prompt="Create a modern landing page."
        >
          Create
        </button>
      </article>

      <article class="card">
        <div class="game-icon">◇</div>
        <h3>Portfolio</h3>
        <p>
          Create a personal portfolio website.
        </p>
        <button
          data-site-prompt="Create a professional portfolio website."
        >
          Create
        </button>
      </article>

    </div>
  `;
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


/* =========================================================
   GAME HOME
   ========================================================= */

function renderGames() {
  GameCenter.activeGame = "home";

  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "GALAXY GAMING",
      "Gaming Center",
      "Play directly inside GALAXY."
    )}

    <div class="games-grid">

      <button
        class="game-card"
        data-game-open="chess"
      >
        <div class="game-icon">♟</div>
        <h3>Chess vs GALAXY</h3>
        <p>Play White against GALAXY.</p>
      </button>

      <button
        class="game-card"
        data-game-open="tictactoe"
      >
        <div class="game-icon">✕</div>
        <h3>Tic-Tac-Toe</h3>
        <p>Play against GALAXY.</p>
      </button>

      <button
        class="game-card"
        data-game-open="connect4"
      >
        <div class="game-icon">●</div>
        <h3>Connect Four</h3>
        <p>Drop discs and beat GALAXY.</p>
      </button>

      <button
        class="game-card"
        data-game-open="memory"
      >
        <div class="game-icon">🧠</div>
        <h3>Memory</h3>
        <p>Find all matching pairs.</p>
      </button>

    </div>
  `;
}

function gameBackButton() {
  return `
    <button
      class="ghost-btn"
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
    ["br","bn","bb","bq","bk","bb","bn","br"],
    ["bp","bp","bp","bp","bp","bp","bp","bp"],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ["wp","wp","wp","wp","wp","wp","wp","wp"],
    ["wr","wn","wb","wq","wk","wb","wn","wr"]
  ];
}

function resetChess() {
  GameCenter.chess = {
    board: initialChessBoard(),
    selected: null,
    legal: [],
    turn: "w",
    status: "Your turn — White",
    gameOver: false,
    history: []
  };
}

function chessColor(piece) {
  return piece ? piece[0] : null;
}

function chessType(piece) {
  return piece ? piece[1] : null;
}

function insideBoard(r, c) {
  return (
    r >= 0 &&
    r < 8 &&
    c >= 0 &&
    c < 8
  );
}

function chessMovesFor(board, r, c) {
  const piece = board[r][c];

  if (!piece) return [];

  const color = chessColor(piece);
  const type = chessType(piece);

  const enemy =
    color === "w" ? "b" : "w";

  const moves = [];

  function pushSquare(nr, nc) {
    if (!insideBoard(nr, nc))
      return false;

    const target =
      board[nr][nc];

    if (!target) {
      moves.push([nr, nc]);
      return true;
    }

    if (
      chessColor(target) === enemy
    ) {
      moves.push([nr, nc]);
    }

    return false;
  }

  function slide(directions) {
    directions.forEach(([dr, dc]) => {
      let nr = r + dr;
      let nc = c + dc;

      while (insideBoard(nr, nc)) {
        if (!pushSquare(nr, nc))
          break;

        nr += dr;
        nc += dc;
      }
    });
  }

  if (type === "p") {
    const direction =
      color === "w" ? -1 : 1;

    const startRow =
      color === "w" ? 6 : 1;

    if (
      insideBoard(r + direction, c) &&
      !board[r + direction][c]
    ) {
      moves.push([
        r + direction,
        c
      ]);

      if (
        r === startRow &&
        !board[r + direction * 2][c]
      ) {
        moves.push([
          r + direction * 2,
          c
        ]);
      }
    }

    [-1, 1].forEach(dc => {
      const nr =
        r + direction;

      const nc =
        c + dc;

      if (
        insideBoard(nr, nc) &&
        board[nr][nc] &&
        chessColor(board[nr][nc]) === enemy
      ) {
        moves.push([nr, nc]);
      }
    });
  }

  else if (type === "r") {
    slide([
      [1,0],
      [-1,0],
      [0,1],
      [0,-1]
    ]);
  }

  else if (type === "b") {
    slide([
      [1,1],
      [1,-1],
      [-1,1],
      [-1,-1]
    ]);
  }

  else if (type === "q") {
    slide([
      [1,0],
      [-1,0],
      [0,1],
      [0,-1],
      [1,1],
      [1,-1],
      [-1,1],
      [-1,-1]
    ]);
  }

  else if (type === "n") {
    [
      [2,1],
      [2,-1],
      [-2,1],
      [-2,-1],
      [1,2],
      [1,-2],
      [-1,2],
      [-1,-2]
    ].forEach(([dr, dc]) =>
      pushSquare(r + dr, c + dc)
    );
  }

  else if (type === "k") {
    [
      [1,0],
      [-1,0],
      [0,1],
      [0,-1],
      [1,1],
      [1,-1],
      [-1,1],
      [-1,-1]
    ].forEach(([dr, dc]) =>
      pushSquare(r + dr, c + dc)
    );
  }

  return moves;
}

function chessSquareName(r, c) {
  return `${"abcdefgh"[c]}${8 - r}`;
}

function renderChess() {
  GameCenter.activeGame = "chess";

  if (!GameCenter.chess)
    resetChess();

  const game =
    GameCenter.chess;

  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "GALAXY GAMING",
      "Chess vs GALAXY"
    )}

    <section class="game-shell">

      <div class="game-head">

        ${gameBackButton()}

        <strong>
          ${escapeHTML(game.status)}
        </strong>

        <button
          class="ghost-btn"
          data-chess-reset
        >
          ↻ New game
        </button>

      </div>

      <div class="board-wrap">

        <div class="chess-board">

          ${game.board.map(
            (row, r) =>
              row.map(
                (piece, c) => {

                  const selected =
                    game.selected &&
                    game.selected[0] === r &&
                    game.selected[1] === c;

                  const legal =
                    game.legal.some(
                      ([lr, lc]) =>
                        lr === r &&
                        lc === c
                    );

                  return `
                    <button
                      class="
                        chess-square
                        ${(r + c) % 2 ? "dark" : "light"}
                        ${selected ? "selected" : ""}
                        ${legal ? "legal" : ""}
                      "
                      data-chess-square="${r},${c}"
                    >
                      ${
                        piece
                          ? CHESS_PIECES[piece]
                          : legal
                            ? "•"
                            : ""
                      }
                    </button>
                  `;
                }
              ).join("")
          ).join("")}

        </div>

      </div>

      <div style="
        max-width:560px;
        margin:15px auto 0;
      ">

        <p>
          You are White. Select a piece,
          then select a legal square.
        </p>

        <small>
          Moves:
          ${
            game.history.length
              ? escapeHTML(
                  game.history.join(" · ")
                )
              : "None yet"
          }
        </small>

      </div>

    </section>
  `;
}

function makeChessMove(
  fromR,
  fromC,
  toR,
  toC,
  color
) {
  const game =
    GameCenter.chess;

  const piece =
    game.board[fromR][fromC];

  const captured =
    game.board[toR][toC];

  game.board[toR][toC] = piece;
  game.board[fromR][fromC] = null;

  /* pawn promotion */

  if (
    piece === "wp" &&
    toR === 0
  ) {
    game.board[toR][toC] = "wq";
  }

  if (
    piece === "bp" &&
    toR === 7
  ) {
    game.board[toR][toC] = "bq";
  }

  game.history.push(
    `${chessSquareName(fromR, fromC)}-${chessSquareName(toR, toC)}`
  );

  if (
    captured === "bk"
  ) {
    game.gameOver = true;
    game.status = "You win!";
    return;
  }

  if (
    captured === "wk"
  ) {
    game.gameOver = true;
    game.status = "GALAXY wins";
    return;
  }

  game.turn =
    color === "w" ? "b" : "w";

  game.status =
    game.turn === "w"
      ? "Your turn — White"
      : "GALAXY is thinking…";
}

function handleChessSquare(r, c) {
  const game =
    GameCenter.chess;

  if (
    !game ||
    game.gameOver ||
    game.turn !== "w"
  ) return;

  const piece =
    game.board[r][c];

  if (!game.selected) {
    if (
      piece &&
      chessColor(piece) === "w"
    ) {
      game.selected = [r, c];

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

  const [sr, sc] =
    game.selected;

  const legal =
    game.legal.some(
      ([lr, lc]) =>
        lr === r &&
        lc === c
    );

  if (legal) {
    makeChessMove(
      sr,
      sc,
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
        400
      );
    }

    return;
  }

  if (
    piece &&
    chessColor(piece) === "w"
  ) {
    game.selected = [r, c];

    game.legal =
      chessMovesFor(
        game.board,
        r,
        c
      );
  }

  else {
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
  ) return;

  const moves = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece =
        game.board[r][c];

      if (
        piece &&
        chessColor(piece) === "b"
      ) {
        chessMovesFor(
          game.board,
          r,
          c
        ).forEach(([tr, tc]) => {
          moves.push([
            r,
            c,
            tr,
            tc
          ]);
        });
      }
    }
  }

  if (!moves.length) {
    game.gameOver = true;
    game.status =
      "You win — GALAXY has no moves.";

    renderChess();
    return;
  }

  const captures =
    moves.filter(
      ([r,c,tr,tc]) =>
        game.board[tr][tc]
    );

  const pool =
    captures.length
      ? captures
      : moves;

  const move =
    pool[
      Math.floor(
        Math.random() *
        pool.length
      )
    ];

  makeChessMove(
    move[0],
    move[1],
    move[2],
    move[3],
    "b"
  );

  renderChess();
}


/* =========================================================
   TIC TAC TOE
   ========================================================= */

function resetTicTacToe() {
  GameCenter.ticTacToe = {
    board: Array(9).fill(""),
    turn: "X",
    status: "Your turn",
    gameOver: false
  };
}

function tttWinner(board) {
  const lines = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
  ];

  for (
    const [a,b,c] of lines
  ) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }

  if (board.every(Boolean))
    return "draw";

  return null;
}

function renderTicTacToe() {
  GameCenter.activeGame =
    "tictactoe";

  if (!GameCenter.ticTacToe)
    resetTicTacToe();

  const game =
    GameCenter.ticTacToe;

  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "GALAXY GAMING",
      "Tic-Tac-Toe"
    )}

    <section class="game-shell">

      <div class="game-head">

        ${gameBackButton()}

        <strong>
          ${escapeHTML(game.status)}
        </strong>

        <button
          class="ghost-btn"
          data-ttt-reset
        >
          ↻ New game
        </button>

      </div>

      <div class="board-wrap">

        <div class="ttt-board">

          ${game.board.map(
            (value, index) => `
              <button
                class="ttt-cell"
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
          ).join("")}

        </div>

      </div>

    </section>
  `;
}

function handleTtt(index) {
  const game =
    GameCenter.ticTacToe;

  if (
    !game ||
    game.gameOver ||
    game.turn !== "X" ||
    game.board[index]
  ) return;

  game.board[index] = "X";

  let winner =
    tttWinner(game.board);

  if (winner) {
    game.gameOver = true;

    game.status =
      winner === "draw"
        ? "Draw"
        : "You win!";

    renderTicTacToe();
    return;
  }

  game.turn = "O";
  game.status =
    "GALAXY is thinking…";

  renderTicTacToe();

  setTimeout(() => {
    galaxyTttMove();
  }, 350);
}

function galaxyTttMove() {
  const game =
    GameCenter.ticTacToe;

  if (
    !game ||
    game.gameOver
  ) return;

  const empty =
    game.board
      .map((value, index) =>
        value ? null : index
      )
      .filter(
        value => value !== null
      );

  /* try winning move */

  let choice = null;

  for (const index of empty) {
    const test =
      [...game.board];

    test[index] = "O";

    if (
      tttWinner(test) === "O"
    ) {
      choice = index;
      break;
    }
  }

  /* block player */

  if (choice === null) {
    for (const index of empty) {
      const test =
        [...game.board];

      test[index] = "X";

      if (
        tttWinner(test) === "X"
      ) {
        choice = index;
        break;
      }
    }
  }

  /* center */

  if (
    choice === null &&
    !game.board[4]
  ) {
    choice = 4;
  }

  /* random */

  if (choice === null) {
    choice =
      empty[
        Math.floor(
          Math.random() *
          empty.length
        )
      ];
  }

  if (choice === undefined)
    return;

  game.board[choice] = "O";

  const winner =
    tttWinner(game.board);

  if (winner) {
    game.gameOver = true;

    game.status =
      winner === "draw"
        ? "Draw"
        : "GALAXY wins";
  }

  else {
    game.turn = "X";
    game.status = "Your turn";
  }

  renderTicTacToe();
}


/* =========================================================
   CONNECT FOUR
   ========================================================= */

function resetConnectFour() {
  GameCenter.connectFour = {
    board:
      Array.from(
        { length: 6 },
        () => Array(7).fill("")
      ),

    turn: "R",
    status: "Your turn",
    gameOver: false
  };
}

function connectWinner(board, player) {
  const directions = [
    [0,1],
    [1,0],
    [1,1],
    [1,-1]
  ];

  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {

      if (
        board[r][c] !== player
      ) continue;

      for (
        const [dr,dc] of directions
      ) {
        let count = 1;

        for (
          let step = 1;
          step < 4;
          step++
        ) {
          const nr =
            r + dr * step;

          const nc =
            c + dc * step;

          if (
            !insideConnect(nr,nc) ||
            board[nr][nc] !== player
          ) break;

          count++;
        }

        if (count >= 4)
          return true;
      }
    }
  }

  return false;
}

function insideConnect(r,c) {
  return (
    r >= 0 &&
    r < 6 &&
    c >= 0 &&
    c < 7
  );
}

function connectDropRow(
  board,
  column
) {
  for (let r = 5; r >= 0; r--) {
    if (!board[r][column])
      return r;
  }

  return -1;
}

function renderConnectFour() {
  GameCenter.activeGame =
    "connect4";

  if (!GameCenter.connectFour)
    resetConnectFour();

  const game =
    GameCenter.connectFour;

  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "GALAXY GAMING",
      "Connect Four"
    )}

    <section class="game-shell">

      <div class="game-head">

        ${gameBackButton()}

        <strong>
          ${escapeHTML(game.status)}
        </strong>

        <button
          class="ghost-btn"
          data-connect-reset
        >
          ↻ New game
        </button>

      </div>

      <div class="board-wrap">

        <div class="connect-board">

          ${game.board.map(
            row =>
              row.map(
                (value, column) => `
                  <button
                    class="
                      connect-cell
                      ${
                        value === "R"
                          ? "red"
                          : value === "Y"
                            ? "yellow"
                            : ""
                      }
                    "
                    data-connect-column="${column}"
                  ></button>
                `
              ).join("")
          ).join("")}

        </div>

      </div>

    </section>
  `;
}

function handleConnect(column) {
  const game =
    GameCenter.connectFour;

  if (
    !game ||
    game.gameOver ||
    game.turn !== "R"
  ) return;

  const row =
    connectDropRow(
      game.board,
      column
    );

  if (row < 0) return;

  game.board[row][column] = "R";

  if (
    connectWinner(
      game.board,
      "R"
    )
  ) {
    game.gameOver = true;
    game.status = "You win!";

    renderConnectFour();
    return;
  }

  if (
    game.board.every(
      row => row.every(Boolean)
    )
  ) {
    game.gameOver = true;
    game.status = "Draw";

    renderConnectFour();
    return;
  }

  game.turn = "Y";
  game.status =
    "GALAXY is thinking…";

  renderConnectFour();

  setTimeout(
    galaxyConnectMove,
    350
  );
}

function galaxyConnectMove() {
  const game =
    GameCenter.connectFour;

  if (
    !game ||
    game.gameOver
  ) return;

  const valid = [];

  for (let c = 0; c < 7; c++) {
    if (
      connectDropRow(
        game.board,
        c
      ) >= 0
    ) {
      valid.push(c);
    }
  }

  if (!valid.length)
    return;

  let column = null;

  /* GALAXY tries to win */

  for (const c of valid) {
    const row =
      connectDropRow(
        game.board,
        c
      );

    game.board[row][c] = "Y";

    const wins =
      connectWinner(
        game.board,
        "Y"
      );

    game.board[row][c] = "";

    if (wins) {
      column = c;
      break;
    }
  }

  /* block player */

  if (column === null) {
    for (const c of valid) {
      const row =
        connectDropRow(
          game.board,
          c
        );

      game.board[row][c] = "R";

      const wins =
        connectWinner(
          game.board,
          "R"
        );

      game.board[row][c] = "";

      if (wins) {
        column = c;
        break;
      }
    }
  }

  /* prefer center */

  if (
    column === null &&
    valid.includes(3)
  ) {
    column = 3;
  }

  if (column === null) {
    column =
      valid[
        Math.floor(
          Math.random() *
          valid.length
        )
      ];
  }

  const row =
    connectDropRow(
      game.board,
      column
    );

  game.board[row][column] = "Y";

  if (
    connectWinner(
      game.board,
      "Y"
    )
  ) {
    game.gameOver = true;
    game.status = "GALAXY wins";
  }

  else {
    game.turn = "R";
    game.status = "Your turn";
  }

  renderConnectFour();
}


/* =========================================================
   MEMORY
   ========================================================= */

const MEMORY_SYMBOLS = [
  "✦",
  "♞",
  "◈",
  "◇",
  "◎",
  "▣",
  "☄",
  "★"
];

function shuffle(array) {
  const result = [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];
  }

  return result;
}

function resetMemory() {
  const cards =
    shuffle([
      ...MEMORY_SYMBOLS,
      ...MEMORY_SYMBOLS
    ]).map(
      (symbol, index) => ({
        id: index,
        symbol,
        flipped: false,
        matched: false
      })
    );

  GameCenter.memory = {
    cards,
    selected: [],
    moves: 0,
    locked: false,
    status: "Find all matching pairs"
  };
}

function renderMemory() {
  GameCenter.activeGame =
    "memory";

  if (!GameCenter.memory)
    resetMemory();

  const game =
    GameCenter.memory;

  $("#contentBody").innerHTML = `
    ${workspaceHeader(
      "GALAXY GAMING",
      "Memory"
    )}

    <section class="game-shell">

      <div class="game-head">

        ${gameBackButton()}

        <strong>
          ${escapeHTML(game.status)}
          · Moves ${game.moves}
        </strong>

        <button
          class="ghost-btn"
          data-memory-reset
        >
          ↻ New game
        </button>

      </div>

      <div class="board-wrap">

        <div class="memory-board">

          ${game.cards.map(card => `
            <button
              class="
                memory-card
                ${
                  card.flipped
                    ? "flipped"
                    : ""
                }
                ${
                  card.matched
                    ? "matched"
                    : ""
                }
              "
              data-memory-card="${card.id}"
            >
              ${
                card.flipped ||
                card.matched
                  ? card.symbol
                  : "?"
              }
            </button>
          `).join("")}

        </div>

      </div>

    </section>
  `;
}

function handleMemory(index) {
  const game =
    GameCenter.memory;

  if (
    !game ||
    game.locked
  ) return;

  const card =
    game.cards[index];

  if (
    !card ||
    card.flipped ||
    card.matched
  ) return;

  card.flipped = true;

  game.selected.push(index);

  renderMemory();

  if (
    game.selected.length < 2
  ) return;

  game.moves++;

  const [
    firstIndex,
    secondIndex
  ] = game.selected;

  const first =
    game.cards[firstIndex];

  const second =
    game.cards[secondIndex];

  if (
    first.symbol ===
    second.symbol
  ) {
    first.matched = true;
    second.matched = true;

    game.selected = [];

    if (
      game.cards.every(
        card => card.matched
      )
    ) {
      game.status =
        `You won in ${game.moves} moves!`;
    }

    renderMemory();
  }

  else {
    game.locked = true;

    setTimeout(() => {
      first.flipped = false;
      second.flipped = false;

      game.selected = [];
      game.locked = false;

      renderMemory();
    }, 650);
  }
}


/* =========================================================
   FILE UPLOAD
   ========================================================= */

function openFilePicker(target = "assets") {
  const input =
    $("#fileInput");

  if (!input) return;

  input.dataset.target = target;

  input.click();
}

function handleFiles(files) {
  const input =
    $("#fileInput");

  const target =
    input?.dataset.target ||
    "assets";

  [...files].forEach(file => {

    const asset = {
      id: uid("asset"),
      name: file.name,
      type: file.type,
      size: file.size,
      createdAt: Date.now()
    };

    Galaxy.state.assets.unshift(asset);

    if (target === "studio") {
      Galaxy.state.studioReferences.push(asset);
    }
  });

  saveState();

  if (target === "studio") {
    const zone =
      $("#referenceZone");

    if (zone) {
      zone.innerHTML = `
        <b>
          ${Galaxy.state.studioReferences.length}
          reference(s) added
        </b>
        <span>
          Click to add more
        </span>
      `;
    }

    toast("Reference added.");
  }

  else {
    toast("File added to Library.");

    if (
      Galaxy.state.view === "assets"
    ) {
      renderAssets();
    }
  }

  if (input)
    input.value = "";
}


/* =========================================================
   VOICE
   ========================================================= */

function startVoice() {
  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!Recognition) {
    toast(
      "Voice recognition is not supported by this browser."
    );

    return;
  }

  const recognition =
    new Recognition();

  recognition.lang = "en-US";

  recognition.interimResults = false;

  recognition.onstart = () =>
    toast("Listening…");

  recognition.onresult = event => {
    const text =
      event.results[0][0]
        .transcript;

    const input =
      $("#promptInput");

    if (input) {
      input.value = text;
      resizePrompt();
    }
  };

  recognition.onerror = () =>
    toast("Voice recognition stopped.");

  recognition.start();
}


/* =========================================================
   GLOBAL CLICK HANDLER
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    const viewButton =
      event.target.closest(
        "[data-view]"
      );

    if (viewButton) {
      openView(
        viewButton.dataset.view
      );

      return;
    }


    const starter =
      event.target.closest(
        "[data-starter]"
      );

    if (starter) {
      const input =
        $("#promptInput");

      if (input) {
        input.value =
          starter.dataset.starter;

        resizePrompt();
        input.focus();
      }

      return;
    }


    const studioTab =
      event.target.closest(
        "[data-studio]"
      );

    if (studioTab) {
      setStudioMode(
        studioTab.dataset.studio
      );

      return;
    }


    const camera =
      event.target.closest(
        "#cameraChips button"
      );

    if (camera) {
      selectCamera(camera);
      return;
    }


    const game =
      event.target.closest(
        "[data-game-open]"
      );

    if (game) {
      const name =
        game.dataset.gameOpen;

      if (name === "chess")
        renderChess();

      if (name === "tictactoe")
        renderTicTacToe();

      if (name === "connect4")
        renderConnectFour();

      if (name === "memory")
        renderMemory();

      return;
    }


    if (
      event.target.closest(
        "[data-game-back]"
      )
    ) {
      renderGames();
      return;
    }


    const chessSquare =
      event.target.closest(
        "[data-chess-square]"
      );

    if (chessSquare) {
      const [r,c] =
        chessSquare.dataset
          .chessSquare
          .split(",")
          .map(Number);

      handleChessSquare(r,c);

      return;
    }


    if (
      event.target.closest(
        "[data-chess-reset]"
      )
    ) {
      resetChess();
      renderChess();
      return;
    }


    const tttCell =
      event.target.closest(
        "[data-ttt-cell]"
      );

    if (tttCell) {
      handleTtt(
        Number(
          tttCell.dataset.tttCell
        )
      );

      return;
    }


    if (
      event.target.closest(
        "[data-ttt-reset]"
      )
    ) {
      resetTicTacToe();
      renderTicTacToe();
      return;
    }


    const connectCell =
      event.target.closest(
        "[data-connect-column]"
      );

    if (connectCell) {
      handleConnect(
        Number(
          connectCell.dataset
            .connectColumn
        )
      );

      return;
    }


    if (
      event.target.closest(
        "[data-connect-reset]"
      )
    ) {
      resetConnectFour();
      renderConnectFour();
      return;
    }


    const memoryCard =
      event.target.closest(
        "[data-memory-card]"
      );

    if (memoryCard) {
      handleMemory(
        Number(
          memoryCard.dataset
            .memoryCard
        )
      );

      return;
    }


    if (
      event.target.closest(
        "[data-memory-reset]"
      )
    ) {
      resetMemory();
      renderMemory();
      return;
    }


    const reuse =
      event.target.closest(
        "[data-generation-reuse]"
      );

    if (reuse) {
      const generation =
        Galaxy.state.generations.find(
          item =>
            item.id ===
            reuse.dataset
              .generationReuse
        );

      if (generation) {
        $("#studioPrompt").value =
          generation.prompt;

        toast("Prompt restored.");
      }

      return;
    }


    const deleteGeneration =
      event.target.closest(
        "[data-generation-delete]"
      );

    if (deleteGeneration) {
      Galaxy.state.generations =
        Galaxy.state.generations.filter(
          item =>
            item.id !==
            deleteGeneration.dataset
              .generationDelete
        );

      saveState();
      renderGenerations();

      return;
    }


    const chatButton =
      event.target.closest(
        "[data-chat-id]"
      );

    if (chatButton) {
      Galaxy.state.activeChatId =
        chatButton.dataset.chatId;

      saveState();

      openView("chat");

      return;
    }


    const deleteProject =
      event.target.closest(
        "[data-delete-project]"
      );

    if (deleteProject) {
      Galaxy.state.projects =
        Galaxy.state.projects.filter(
          project =>
            project.id !==
            deleteProject.dataset
              .deleteProject
        );

      saveState();
      renderProjects();

      return;
    }


    const deleteAsset =
      event.target.closest(
        "[data-delete-asset]"
      );

    if (deleteAsset) {
      Galaxy.state.assets =
        Galaxy.state.assets.filter(
          asset =>
            asset.id !==
            deleteAsset.dataset
              .deleteAsset
        );

      saveState();
      renderAssets();

      return;
    }


    const deleteScene =
      event.target.closest(
        "[data-delete-scene]"
      );

    if (deleteScene) {
      scenes =
        scenes.filter(
          scene =>
            scene.id !==
            deleteScene.dataset
              .deleteScene
        );

      Storage.set(
        "scenes",
        scenes
      );

      renderSceneList();

      return;
    }


    const deleteTask =
      event.target.closest(
        "[data-delete-task]"
      );

    if (deleteTask) {
      Galaxy.state.scheduled =
        Galaxy.state.scheduled.filter(
          task =>
            task.id !==
            deleteTask.dataset
              .deleteTask
        );

      saveState();
      renderScheduled();

      return;
    }


    const usePack =
      event.target.closest(
        "[data-use-pack]"
      );

    if (usePack) {
      openView("chat");

      const input =
        $("#promptInput");

      input.value =
        `Use the ${usePack.dataset.usePack} for this task: `;

      input.focus();

      resizePrompt();

      return;
    }


    const agent =
      event.target.closest(
        "[data-agent]"
      );

    if (agent) {
      openView("chat");

      const input =
        $("#promptInput");

      input.value =
        `Act as my ${agent.dataset.agent}. `;

      input.focus();

      return;
    }


    const plugin =
      event.target.closest(
        "[data-plugin]"
      );

    if (plugin) {
      toast(
        `${plugin.dataset.plugin} connection requires backend integration.`
      );

      return;
    }


    const site =
      event.target.closest(
        "[data-site-prompt]"
      );

    if (site) {
      openView("chat");

      const input =
        $("#promptInput");

      input.value =
        site.dataset.sitePrompt;

      input.focus();

      return;
    }


    const actionButton =
      event.target.closest(
        "[data-action]"
      );

    if (!actionButton)
      return;

    const action =
      actionButton.dataset.action;


    if (action === "toggle-sidebar") {
      $("#sidebar")
        ?.classList.toggle("open");
    }


    else if (action === "new-chat") {
      createChat();
    }


    else if (action === "upload") {
      openFilePicker("assets");
    }


    else if (
      action === "studio-upload"
    ) {
      studioUpload();
    }


    else if (
      action === "web-search"
    ) {
      Galaxy.state.webSearch =
        !Galaxy.state.webSearch;

      actionButton.classList.toggle(
        "active",
        Galaxy.state.webSearch
      );

      toast(
        Galaxy.state.webSearch
          ? "Web search enabled."
          : "Web search disabled."
      );
    }


    else if (
      action === "image-create"
    ) {
      openView("create");
      setStudioMode("image");
    }


    else if (
      action === "video-create"
    ) {
      openView("create");
      setStudioMode("text-video");
    }


    else if (action === "voice") {
      startVoice();
    }


    else if (action === "run-work") {
      runWork();
    }


    else if (
      action === "clear-preview"
    ) {
      const output =
        $("#workOutput");

      if (output)
        output.textContent =
          "Your result will appear here.";
    }


    else if (
      action ===
      "new-creative-project"
    ) {
      newCreativeProject();
    }


    else if (
      action === "studio-generate"
    ) {
      generateStudioContent();
    }


    else if (
      action === "create-project"
    ) {
      createProject();
    }


    else if (
      action === "add-scene"
    ) {
      addScene();
    }


    else if (
      action === "new-scheduled"
    ) {
      createScheduledTask();
    }


    else if (action === "share") {
      if (
        navigator.share
      ) {
        navigator.share({
          title: "GALAXY AI",
          text: "GALAXY AI"
        }).catch(() => {});
      }

      else {
        navigator.clipboard
          ?.writeText(
            location.href
          );

        toast("Link copied.");
      }
    }

  }
);


/* =========================================================
   INPUT EVENTS
   ========================================================= */

$("#composer")?.addEventListener(
  "submit",
  event => {
    event.preventDefault();
    sendChatMessage();
  }
);

$("#promptInput")?.addEventListener(
  "input",
  resizePrompt
);

$("#promptInput")?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendChatMessage();
    }
  }
);

$("#aiProvider")?.addEventListener(
  "change",
  event => {
    Galaxy.state.provider =
      event.target.value;

    saveState();

    toast(
      event.target.value === "gemini"
        ? "Gemini selected."
        : "OpenAI selected."
    );
  }
);

$("#fileInput")?.addEventListener(
  "change",
  event => {
    handleFiles(
      event.target.files
    );
  }
);

document.addEventListener(
  "input",
  event => {

    if (
      event.target.id ===
      "workspaceSearch"
    ) {
      runWorkspaceSearch(
        event.target.value
      );
    }

  }
);


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k"
    ) {
      event.preventDefault();

      openView("search");

      setTimeout(() => {
        $("#workspaceSearch")
          ?.focus();
      }, 50);
    }


    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.key.toLowerCase() === "o"
    ) {
      event.preventDefault();

      createChat();
    }

  }
);


/* =========================================================
   DRAG AND DROP
   ========================================================= */

document.addEventListener(
  "dragover",
  event => {
    event.preventDefault();
  }
);

document.addEventListener(
  "drop",
  event => {

    event.preventDefault();

    if (
      event.dataTransfer?.files?.length
    ) {
      handleFiles(
        event.dataTransfer.files
      );
    }

  }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeGalaxy() {
  const provider =
    $("#aiProvider");

  if (provider) {
    provider.value =
      Galaxy.state.provider;
  }

  renderRecentChats();

  renderGenerations();

  setStudioMode(
    Galaxy.state.selectedStudioMode
  );

  if (
    !Galaxy.state.activeChatId &&
    Galaxy.state.chats.length
  ) {
    Galaxy.state.activeChatId =
      Galaxy.state.chats[0].id;
  }

  renderChat();

  resizePrompt();

  console.log(
    `GALAXY AI ${Galaxy.version} ready`
  );
}


/* =========================================================
   START GALAXY
   ========================================================= */

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeGalaxy
  );
}

else {
  initializeGalaxy();
}
