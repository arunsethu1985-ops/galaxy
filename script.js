"use strict";

/* ============================================================
   GALAXY AI — COMPLETE SCRIPT.JS
   Created for GALAXY AI by Harshavardhan
============================================================ */


/* ============================================================
   HELPERS
============================================================ */

const $ = (
  selector,
  root = document
) => root.querySelector(selector);


const $$ = (
  selector,
  root = document
) => [...root.querySelectorAll(selector)];


const clamp = (
  value,
  minimum,
  maximum
) => Math.max(
  minimum,
  Math.min(
    maximum,
    value
  )
);


const randomItem = array =>
  array[
    Math.floor(
      Math.random() *
      array.length
    )
  ];


const copyObject = value =>
  JSON.parse(
    JSON.stringify(value)
  );


const escapeHTML = (
  value = ""
) =>
  String(value).replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]
  );


function safeMediaURL(
  value
) {

  const url =
    String(value || "");


  if (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:image/") ||
    url.startsWith("data:video/")
  ) {

    return url.replaceAll(
      '"',
      "%22"
    );

  }


  return "";

}


/* ============================================================
   LOCAL STORAGE
============================================================ */

const storage = {

  get(
    key,
    fallback = null
  ) {

    try {

      const value =
        localStorage.getItem(key);


      if (
        value === null
      ) {

        return fallback;

      }


      return JSON.parse(value);

    } catch {

      return fallback;

    }

  },


  set(
    key,
    value
  ) {

    try {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

    } catch {}

  },


  remove(key) {

    try {

      localStorage.removeItem(key);

    } catch {}

  }

};


/* ============================================================
   CONSTANTS
============================================================ */

const VIDEO_LIMIT =
  30;


const VIDEO_COUNT_KEY =
  "galaxy.video.count.v2";


const SNAKE_HIGH_KEY =
  "galaxy.snake.high.v4";


const CHICKEN_HIGH_KEY =
  "galaxy.chicken.high.v4";


const CAR_HIGH_KEY =
  "galaxy.car.high.v4";


const GAME_LEVELS = [
  100,
  200,
  500,
  800,
  1000,
  1200
];


/* ============================================================
   GLOBAL STATE
============================================================ */

const state = {

  messages: [],

  generating: false,

  chatController: null,

  activeView: "chat",

  webSearch: false,

  attachments: []

};


const GameCenter = {

  current: null,

  chess: null,

  ttt: null,

  connect: null,

  memory: null,

  snake: null,

  chicken: null,

  car: null,

  timers: new Set()

};


/* ============================================================
   TOAST
============================================================ */

function toast(
  message,
  type = ""
) {

  let root =
    $("#toastRoot");


  if (!root) {

    root =
      document.createElement(
        "div"
      );

    root.id =
      "toastRoot";

    root.className =
      "toast-root";

    document.body.appendChild(
      root
    );

  }


  const element =
    document.createElement(
      "div"
    );


  element.className =
    `toast ${type}`.trim();


  element.textContent =
    message;


  root.appendChild(
    element
  );


  setTimeout(
    () => element.remove(),
    2800
  );

}


/* ============================================================
   TIMER MANAGEMENT
============================================================ */

function trackTimer(timer) {

  GameCenter.timers.add(
    timer
  );

  return timer;

}


function clearGameTimers() {

  for (
    const timer of
    GameCenter.timers
  ) {

    clearTimeout(timer);

    clearInterval(timer);

  }


  GameCenter.timers.clear();

}


/* ============================================================
   VIEW SYSTEM
============================================================ */

function activateContentView() {

  $$(".view").forEach(
    view => {

      view.classList.remove(
        "active-view"
      );

    }
  );


  $("#contentView")
    ?.classList
    .add(
      "active-view"
    );

}


function setView(name) {

  state.activeView =
    name;


  if (
    name !== "games"
  ) {

    clearGameTimers();

    GameCenter.current =
      null;

  }


  $$(".view").forEach(
    view => {

      view.classList.remove(
        "active-view"
      );

    }
  );


  const map = {

    chat:
      "#chatView",

    work:
      "#workView",

    games:
      "#contentView",

    projects:
      "#contentView",

    library:
      "#contentView",

    studio:
      "#contentView"

  };


  $(
    map[name] ||
    "#chatView"
  )
    ?.classList
    .add(
      "active-view"
    );


  $$("[data-view]")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.view ===
          name
        );

      }
    );


  if (
    name === "games"
  ) {

    renderGames();

    return;

  }


  if (
    name === "projects"
  ) {

    renderSimplePage(
      "Projects",
      "Your GALAXY projects will appear here."
    );

    return;

  }


  if (
    name === "library"
  ) {

    renderSimplePage(
      "Library",
      "Your files, images and generated assets."
    );

    return;

  }


  if (
    name === "studio"
  ) {

    renderCreateStudio();

  }

}


/* ============================================================
   SIMPLE PAGE
============================================================ */

function renderSimplePage(
  title,
  text
) {

  activateContentView();


  const titleElement =
    $("#contentTitle");


  const eyebrow =
    $("#contentEyebrow");


  const body =
    $("#contentBody");


  if (titleElement) {

    titleElement.textContent =
      title;

  }


  if (eyebrow) {

    eyebrow.textContent =
      "GALAXY";

  }


  if (body) {

    body.innerHTML = `

      <div class="panel">

        <h3>
          ${escapeHTML(title)}
        </h3>

        <p>
          ${escapeHTML(text)}
        </p>

      </div>

    `;

  }

}


/* ============================================================
   CREATE STUDIO
============================================================ */

function renderCreateStudio() {

  activateContentView();


  $("#contentTitle").textContent =
    "Create Studio";


  $("#contentEyebrow").textContent =
    "GALAXY CREATE";


  $("#contentBody").innerHTML = `

    <div class="games-home">

      <div class="games-hero">

        <div>

          <span class="eyebrow">
            GALAXY CREATE
          </span>

          <h2>
            Create with GALAXY
          </h2>

          <p>
            Generate images and AI videos.
          </p>

        </div>

        <div class="games-hero-mark">
          ✦
        </div>

      </div>


      <div class="games-grid">

        <button
          class="game-card"
          data-action="image"
          type="button"
        >

          <div class="game-card-visual">
            ◫
          </div>

          <div class="game-card-copy">

            <strong>
              Create Image
            </strong>

            <span>
              Unlimited image generation
            </span>

          </div>

        </button>


        <button
          class="game-card"
          data-action="video"
          type="button"
        >

          <div class="game-card-visual">
            ▷
          </div>

          <div class="game-card-copy">

            <strong>
              Create Video
            </strong>

            <span>
              30 videos • Up to 20 minutes each
            </span>

          </div>

        </button>

      </div>

    </div>

  `;

}


/* ============================================================
   NEW CHAT
============================================================ */

function newChat() {

  state.messages =
    [];


  if (
    state.chatController
  ) {

    state.chatController.abort();

    state.chatController =
      null;

  }


  state.generating =
    false;


  const messages =
    $("#messages");


  if (messages) {

    messages.innerHTML =
      "";

  }


  $("#chatEmpty")
    ?.classList
    .remove(
      "hidden"
    );


  updateSendButtonState();


  setView(
    "chat"
  );


  $("#promptInput")
    ?.focus();

}


/* ============================================================
   TEXTAREA RESIZE
============================================================ */

function autoResize(element) {

  if (!element) {

    return;

  }


  element.style.height =
    "auto";


  element.style.height =
    `${
      Math.min(
        element.scrollHeight,
        180
      )
    }px`;

}


/* ============================================================
   CHAT MESSAGES
============================================================ */

function renderMessage(
  role,
  text
) {

  const root =
    $("#messages");


  if (!root) {

    return;

  }


  $("#chatEmpty")
    ?.classList
    .add(
      "hidden"
    );


  const row =
    document.createElement(
      "div"
    );


  row.className =
    `message ${role}`;


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    "bubble";


  bubble.textContent =
    text;


  row.appendChild(
    bubble
  );


  root.appendChild(
    row
  );


  row.scrollIntoView({

    behavior:
      "smooth",

    block:
      "end"

  });

}


/* ============================================================
   SEND BUTTON STATE
============================================================ */

function updateSendButtonState() {

  const button =
    $("#sendButton");


  if (!button) {

    return;

  }


  button.textContent =
    state.generating
      ? "■"
      : "↑";


  button.classList.toggle(
    "is-stop",
    state.generating
  );


  button.title =
    state.generating
      ? "Stop"
      : "Send";


  button.setAttribute(
    "aria-label",
    state.generating
      ? "Stop"
      : "Send"
  );

}


/* ============================================================
   GEMINI / CHAT AI

   GOAL:
   - Try to answer quickly.
   - Do NOT cut at 20 seconds.
   - Maximum request time = 2 minutes.
============================================================ */

async function fetchAIResponse(
  message,
  includeHistory = true
) {

  const creatorContext =
    "You are GALAXY AI. " +
    "GALAXY AI was created and founded by Harshavardhan. " +
    "If asked who created, built, designed, founded or owns GALAXY AI, " +
    "answer that Harshavardhan created GALAXY AI. " +
    "Respond as quickly as possible while remaining accurate and useful. " +
    "Prefer concise direct answers unless the user requests a detailed answer.";


  const previousMessages =

    includeHistory

      ? state.messages
          .slice(0, -1)
          .slice(-8)
          .map(
            item => ({

              role:
                item.role,

              content:
                item.text

            })
          )

      : [];


  const payload = {

    message,

    prompt:
      message,

    mode:
      includeHistory
        ? "chat"
        : "work",

    system:
      creatorContext,

    webSearch:
      state.webSearch,

    messages: [

      {

        role:
          "system",

        content:
          creatorContext

      },

      ...previousMessages,

      {

        role:
          "user",

        content:
          message

      }

    ]

  };


  const controller =
    new AbortController();


  state.chatController =
    controller;


  const timeout =
    setTimeout(
      () => {

        controller.abort();

      },
      120000
    );


  try {

    const response =
      await fetch(
        "/api/gemini",
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          signal:
            controller.signal,

          body:
            JSON.stringify(
              payload
            )

        }
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (!response.ok) {

      throw new Error(

        data.error ||

        data.message ||

        `Backend error ${
          response.status
        }`

      );

    }


    return (

      data.text ||

      data.reply ||

      data.output ||

      data.response ||

      data.message ||

      "GALAXY received your request."

    );

  } catch (error) {

    if (
      error.name ===
      "AbortError"
    ) {

      throw new Error(
        "GALAXY stopped the request or could not complete it within 2 minutes."
      );

    }


    throw error;

  } finally {

    clearTimeout(
      timeout
    );


    if (
      state.chatController ===
      controller
    ) {

      state.chatController =
        null;

    }

  }

}


/* ============================================================
   SEND MESSAGE
============================================================ */

async function sendMessage() {

  /*
     Press send again while generating
     = stop current request.
  */

  if (
    state.generating
  ) {

    if (
      state.chatController
    ) {

      state.chatController.abort();

    }


    return;

  }


  const input =
    $("#promptInput");


  if (!input) {

    return;

  }


  const text =
    input.value.trim();


  if (!text) {

    return;

  }


  input.value =
    "";


  autoResize(
    input
  );


  state.messages.push({

    role:
      "user",

    text

  });


  renderMessage(
    "user",
    text
  );


  state.generating =
    true;


  updateSendButtonState();


  if (
    $("#draftState")
  ) {

    $("#draftState")
      .textContent =
      "GALAXY is thinking…";

  }


  try {

    const reply =
      await fetchAIResponse(
        text
      );


    state.messages.push({

      role:
        "assistant",

      text:
        reply

    });


    renderMessage(
      "assistant",
      reply
    );

  } catch (error) {

    if (
      error.name !==
      "AbortError"
    ) {

      renderMessage(

        "assistant",

        `GALAXY error: ${
          error.message
        }`

      );

    }


    toast(
      error.message,
      "error"
    );

  } finally {

    state.generating =
      false;


    updateSendButtonState();


    if (
      $("#draftState")
    ) {

      $("#draftState")
        .textContent =
        "Ready";

    }

  }

}


/* ============================================================
   WORK
============================================================ */

async function sendWork() {

  const input =
    $("#workPrompt");


  const output =
    $("#workOutput");


  if (
    !input ||
    !output
  ) {

    return;

  }


  const prompt =
    input.value.trim();


  if (!prompt) {

    return;

  }


  output.textContent =
    "GALAXY is working…";


  try {

    output.textContent =
      await fetchAIResponse(
        prompt,
        false
      );

  } catch (error) {

    output.textContent =
      `GALAXY error: ${
        error.message
      }`;

  }

}


/* ============================================================
   FILE ATTACHMENTS
============================================================ */

function openFilePicker() {

  $("#fileInput")
    ?.click();

}


function renderAttachments() {

  const tray =
    $("#attachmentTray");


  if (!tray) {

    return;

  }


  tray.innerHTML =
    state.attachments
      .map(
        (
          file,
          index
        ) => `

          <div class="attachment-chip">

            <span>
              ${escapeHTML(
                file.name
              )}
            </span>

            <button
              type="button"
              data-remove-file="${index}"
            >
              ×
            </button>

          </div>

        `
      )
      .join("");

}


function handleFiles(files) {

  state.attachments.push(
    ...files
  );


  renderAttachments();

}


/* ============================================================
   WEB SEARCH TOGGLE
============================================================ */

function toggleWebSearch(button) {

  state.webSearch =
    !state.webSearch;


  button?.classList.toggle(
    "active",
    state.webSearch
  );


  toast(
    state.webSearch
      ? "Web search enabled"
      : "Web search disabled"
  );

}


/* ============================================================
   VOICE INPUT
============================================================ */

function startVoiceInput() {

  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!Recognition) {

    toast(
      "Voice recognition is not supported in this browser.",
      "error"
    );

    return;

  }


  const recognition =
    new Recognition();


  recognition.lang =
    "en-US";


  recognition.interimResults =
    false;


  recognition.continuous =
    false;


  recognition.onresult =
    event => {

      const transcript =
        event.results[
          0
        ][
          0
        ].transcript;


      const input =
        $("#promptInput");


      if (!input) {

        return;

      }


      input.value =
        input.value

          ? `${
              input.value
            } ${
              transcript
            }`

          : transcript;


      autoResize(
        input
      );


      input.focus();

    };


  recognition.onerror =
    () => {

      toast(
        "Voice recognition failed.",
        "error"
      );

    };


  recognition.start();

}


/* ============================================================
   GAME CARD
============================================================ */

function gameCard(
  id,
  icon,
  title,
  subtitle
) {

  return `

    <button
      class="game-card"
      data-game-open="${id}"
      type="button"
    >

      <div class="game-card-visual">
        ${icon}
      </div>

      <div class="game-card-copy">

        <strong>
          ${title}
        </strong>

        <span>
          ${subtitle}
        </span>

      </div>

    </button>

  `;

}


/* ============================================================
   GAMING CENTER
============================================================ */

function renderGames() {

  clearGameTimers();


  GameCenter.current =
    null;


  activateContentView();


  $("#contentTitle").textContent =
    "Gaming Center";


  $("#contentEyebrow").textContent =
    "PLAY WITH GALAXY";


  $("#contentBody").innerHTML = `

    <div class="games-home">

      <div class="games-hero">

        <div>

          <span class="eyebrow">
            GALAXY GAMING
          </span>

          <h2>
            Choose a game
          </h2>

          <p>
            Classic games and retro arcade challenges.
          </p>

        </div>

        <div class="games-hero-mark">
          ✦
        </div>

      </div>


      <div class="games-grid">

        ${gameCard(
          "chess",
          "♟",
          "Chess",
          "vs GALAXY or Friend • Levels"
        )}

        ${gameCard(
          "tictactoe",
          "✕○",
          "Tic-Tac-Toe",
          "vs GALAXY or Friend"
        )}

        ${gameCard(
          "connect4",
          "●●",
          "Connect Four",
          "vs GALAXY or Friend"
        )}

        ${gameCard(
          "memory",
          "▦",
          "Memory",
          "Match pairs • Score"
        )}

        ${gameCard(
          "snake",
          "▰",
          "Snake",
          "Nokia-style • Levels • High score"
        )}

        ${gameCard(
          "chicken",
          "🐔",
          "Chicken Crossing",
          "Cross the roads • High score"
        )}

        ${gameCard(
          "retrocar",
          "▣",
          "Retro Car Racing",
          "Classic Nokia-style racing"
        )}

      </div>

    </div>

  `;

}


/* ============================================================
   GAME HEADER
============================================================ */

function gameTop(
  title,
  message,
  extra = ""
) {

  return `

    <div class="game-topline">

      <button
        class="secondary-btn"
        data-game-back
        type="button"
      >
        ← Games
      </button>


      <div class="game-status">

        <strong>
          ${escapeHTML(title)}
        </strong>

        <span>
          ${escapeHTML(message)}
        </span>

      </div>


      ${extra}

    </div>

  `;

}


/* ============================================================
   GAME MODE SELECT
============================================================ */

function modeSelect(game) {

  return `

    <div class="game-toolbar">

      <select data-mode>

        <option
          value="galaxy"
          ${
            game.mode ===
            "galaxy"
              ? "selected"
              : ""
          }
        >
          You vs GALAXY
        </option>

        <option
          value="friend"
          ${
            game.mode ===
            "friend"
              ? "selected"
              : ""
          }
        >
          You vs Friend
        </option>

      </select>


      <select
        data-level
        ${
          game.mode ===
          "friend"
            ? "disabled"
            : ""
        }
      >

        ${
          GAME_LEVELS
            .map(
              level => `

                <option
                  value="${level}"
                  ${
                    Number(
                      game.elo
                    ) === level
                      ? "selected"
                      : ""
                  }
                >
                  ${level} ELO
                </option>

              `
            )
            .join("")
        }

      </select>

    </div>

  `;

}


/* ============================================================
   CHESS
============================================================ */

const CHESS_SYMBOLS = {

  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  p: "♟",

  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
  P: "♙"

};


const CHESS_VALUE = {

  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100

};


function createChessBoard() {

  return [

    "rnbqkbnr"
      .split(""),

    "pppppppp"
      .split(""),

    ...Array.from(
      {
        length: 4
      },
      () =>
        Array(8)
          .fill("")
    ),

    "PPPPPPPP"
      .split(""),

    "RNBQKBNR"
      .split("")

  ];

}


function isWhitePiece(piece) {

  return (
    piece &&
    piece ===
    piece.toUpperCase()
  );

}


function sameChessSide(
  first,
  second
) {

  return (
    first &&
    second &&
    isWhitePiece(first) ===
    isWhitePiece(second)
  );

}


function chessMoves(
  board,
  row,
  column
) {

  const piece =
    board[row][column];


  if (!piece) {

    return [];

  }


  const white =
    isWhitePiece(piece);


  const type =
    piece.toLowerCase();


  const moves =
    [];


  function addMove(
    nextRow,
    nextColumn
  ) {

    if (
      nextRow < 0 ||
      nextRow > 7 ||
      nextColumn < 0 ||
      nextColumn > 7
    ) {

      return false;

    }


    if (
      !board[
        nextRow
      ][
        nextColumn
      ]
    ) {

      moves.push([
        nextRow,
        nextColumn
      ]);

      return true;

    }


    if (
      !sameChessSide(
        piece,
        board[
          nextRow
        ][
          nextColumn
        ]
      )
    ) {

      moves.push([
        nextRow,
        nextColumn
      ]);

    }


    return false;

  }


  if (
    type === "p"
  ) {

    const direction =
      white
        ? -1
        : 1;


    const startRow =
      white
        ? 6
        : 1;


    const one =
      row +
      direction;


    if (
      one >= 0 &&
      one < 8 &&
      !board[one][column]
    ) {

      moves.push([
        one,
        column
      ]);


      const two =
        row +
        direction *
        2;


      if (
        row ===
        startRow &&
        !board[two][column]
      ) {

        moves.push([
          two,
          column
        ]);

      }

    }


    [-1, 1]
      .forEach(
        difference => {

          const nextRow =
            row +
            direction;


          const nextColumn =
            column +
            difference;


          if (
            nextRow >= 0 &&
            nextRow < 8 &&
            nextColumn >= 0 &&
            nextColumn < 8 &&
            board[
              nextRow
            ][
              nextColumn
            ] &&
            !sameChessSide(
              piece,
              board[
                nextRow
              ][
                nextColumn
              ]
            )
          ) {

            moves.push([
              nextRow,
              nextColumn
            ]);

          }

        }
      );

  }


  if (
    type === "n"
  ) {

    [

      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],

      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2]

    ].forEach(
      (
        [
          dr,
          dc
        ]
      ) => {

        addMove(
          row + dr,
          column + dc
        );

      }
    );

  }


  if (
    type === "k"
  ) {

    for (
      let dr = -1;
      dr <= 1;
      dr++
    ) {

      for (
        let dc = -1;
        dc <= 1;
        dc++
      ) {

        if (
          dr ||
          dc
        ) {

          addMove(
            row + dr,
            column + dc
          );

        }

      }

    }

  }


  if (
    "rbq".includes(type)
  ) {

    const directions =
      [];


    if (
      "rq".includes(type)
    ) {

      directions.push(

        [1, 0],

        [-1, 0],

        [0, 1],

        [0, -1]

      );

    }


    if (
      "bq".includes(type)
    ) {

      directions.push(

        [1, 1],

        [1, -1],

        [-1, 1],

        [-1, -1]

      );

    }


    directions.forEach(
      (
        [
          dr,
          dc
        ]
      ) => {

        let nextRow =
          row + dr;


        let nextColumn =
          column + dc;


        while (
          nextRow >= 0 &&
          nextRow < 8 &&
          nextColumn >= 0 &&
          nextColumn < 8
        ) {

          if (
            !addMove(
              nextRow,
              nextColumn
            )
          ) {

            break;

          }


          nextRow += dr;

          nextColumn += dc;

        }

      }
    );

  }


  return moves;

}


function resetChess(
  keep = true
) {

  const old =
    GameCenter.chess || {};


  GameCenter.chess = {

    board:
      createChessBoard(),

    turn:
      "white",

    selected:
      null,

    legal:
      [],

    mode:
      keep
        ? old.mode ||
          "galaxy"
        : "galaxy",

    elo:
      keep
        ? old.elo ||
          500
        : 500,

    history:
      [],

    finished:
      false,

    message:
      "Your turn"

  };


  renderChess();

}


function getAllChessMoves(side) {

  const game =
    GameCenter.chess;


  const moves =
    [];


  game.board.forEach(
    (
      row,
      rowIndex
    ) => {

      row.forEach(
        (
          piece,
          columnIndex
        ) => {

          if (!piece) {

            return;

          }


          const correctSide =

            side === "white"

              ? isWhitePiece(
                  piece
                )

              : !isWhitePiece(
                  piece
                );


          if (!correctSide) {

            return;

          }


          chessMoves(
            game.board,
            rowIndex,
            columnIndex
          )
            .forEach(
              destination => {

                moves.push({

                  from: [
                    rowIndex,
                    columnIndex
                  ],

                  to:
                    destination,

                  piece,

                  target:
                    game.board[
                      destination[0]
                    ][
                      destination[1]
                    ]

                });

              }
            );

        }
      );

    }
  );


  return moves;

}


function applyChessMove(
  move,
  actor
) {

  const game =
    GameCenter.chess;


  const [
    fromRow,
    fromColumn
  ] =
    move.from;


  const [
    toRow,
    toColumn
  ] =
    move.to;


  const piece =
    game.board[
      fromRow
    ][
      fromColumn
    ];


  game.board[
    toRow
  ][
    toColumn
  ] =
    piece;


  game.board[
    fromRow
  ][
    fromColumn
  ] =
    "";


  /*
     Pawn promotion.
  */

  if (
    piece === "P" &&
    toRow === 0
  ) {

    game.board[
      toRow
    ][
      toColumn
    ] =
      "Q";

  }


  if (
    piece === "p" &&
    toRow === 7
  ) {

    game.board[
      toRow
    ][
      toColumn
    ] =
      "q";

  }


  game.history.push(
    `${
      actor
    }: ${
      fromRow
    },${
      fromColumn
    } → ${
      toRow
    },${
      toColumn
    }`
  );


  game.selected =
    null;


  game.legal =
    [];


  game.turn =
    game.turn ===
    "white"

      ? "black"

      : "white";


  const pieces =
    game.board.flat();


  if (
    !pieces.includes("K") ||
    !pieces.includes("k")
  ) {

    game.finished =
      true;


    game.message =
      pieces.includes("K")
        ? "🏆 White Wins!"
        : "🏆 Black Wins!";

  }

}


function clickChess(
  row,
  column
) {

  const game =
    GameCenter.chess;


  if (
    !game ||
    game.finished
  ) {

    return;

  }


  if (
    game.mode ===
    "galaxy" &&
    game.turn !==
    "white"
  ) {

    return;

  }


  if (
    game.selected
  ) {

    const allowed =
      game.legal.some(
        position =>
          position[0] === row &&
          position[1] === column
      );


    if (allowed) {

      applyChessMove(

        {

          from:
            game.selected,

          to: [
            row,
            column
          ]

        },

        game.mode ===
        "friend"

          ? (
              game.turn ===
              "white"

                ? "Player 1"

                : "Player 2"
            )

          : "You"

      );


      if (
        game.mode ===
        "galaxy" &&
        !game.finished
      ) {

        game.message =
          "GALAXY is thinking…";


        renderChess();


        trackTimer(
          setTimeout(
            galaxyChessMove,
            250
          )
        );


        return;

      }


      game.message =
        game.finished

          ? game.message

          : (
              game.turn ===
              "white"

                ? "Player 1 turn"

                : "Player 2 turn"
            );


      renderChess();

      return;

    }

  }


  const piece =
    game.board[
      row
    ][
      column
    ];


  if (!piece) {

    game.selected =
      null;


    game.legal =
      [];


    renderChess();

    return;

  }


  const allowedSide =

    game.turn ===
    "white"

      ? isWhitePiece(piece)

      : !isWhitePiece(piece);


  if (!allowedSide) {

    return;

  }


  game.selected = [
    row,
    column
  ];


  game.legal =
    chessMoves(
      game.board,
      row,
      column
    );


  renderChess();

}


function galaxyChessMove() {

  const game =
    GameCenter.chess;


  if (
    !game ||
    game.finished
  ) {

    return;

  }


  const moves =
    getAllChessMoves(
      "black"
    );


  if (!moves.length) {

    game.finished =
      true;


    game.message =
      "Draw";


    renderChess();

    return;

  }


  moves.sort(
    (
      first,
      second
    ) => {

      const firstValue =

        first.target

          ? CHESS_VALUE[
              first.target
                .toLowerCase()
            ] || 0

          : 0;


      const secondValue =

        second.target

          ? CHESS_VALUE[
              second.target
                .toLowerCase()
            ] || 0

          : 0;


      return (
        secondValue -
        firstValue
      );

    }
  );


  const strength =
    clamp(
      game.elo /
      1200,
      0.15,
      1
    );


  const move =

    Math.random() <
    strength

      ? randomItem(
          moves.slice(
            0,
            Math.min(
              4,
              moves.length
            )
          )
        )

      : randomItem(
          moves
        );


  applyChessMove(
    move,
    "GALAXY"
  );


  game.message =
    game.finished

      ? game.message

      : "Your turn";


  renderChess();

}


function renderChess() {

  const game =
    GameCenter.chess;


  if (!game) {

    resetChess();

    return;

  }


  GameCenter.current =
    "chess";


  $("#contentBody").innerHTML = `

    <div class="game-shell">

      ${
        gameTop(
          "Chess",
          game.message,
          modeSelect(game)
        )
      }


      <div class="game-layout">

        <div class="chess-board-wrap">

          <div class="chess-board">

            ${
              game.board
                .map(
                  (
                    row,
                    rowIndex
                  ) =>

                    row
                      .map(
                        (
                          piece,
                          columnIndex
                        ) => {

                          const selected =

                            game.selected?.[0] ===
                            rowIndex &&

                            game.selected?.[1] ===
                            columnIndex;


                          const legal =
                            game.legal.some(
                              position =>
                                position[0] ===
                                rowIndex &&
                                position[1] ===
                                columnIndex
                            );


                          return `

                            <button
                              type="button"
                              class="
                                chess-square

                                ${
                                  (
                                    rowIndex +
                                    columnIndex
                                  ) % 2

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
                              data-chess="${
                                rowIndex
                              },${
                                columnIndex
                              }"
                            >

                              ${
                                piece

                                  ? `
                                      <span class="chess-piece">

                                        ${
                                          CHESS_SYMBOLS[
                                            piece
                                          ]
                                        }

                                      </span>
                                    `

                                  : ""
                              }

                            </button>

                          `;

                        }
                      )
                      .join("")

                )
                .join("")
            }

          </div>

        </div>


        <div class="game-side-panel">

          <div class="player-card">

            <strong>
              You
            </strong>

            <span>
              White
            </span>

          </div>


          <div class="player-card">

            <strong>

              ${
                game.mode ===
                "friend"

                  ? "Friend"

                  : "GALAXY"
              }

            </strong>

            <span>
              Black • ${game.elo} ELO
            </span>

          </div>


          <div class="move-history">

            <strong>
              Moves
            </strong>

            <div class="move-history-list">

              ${
                game.history
                  .slice(-15)
                  .map(
                    move =>
                      `<div>${
                        escapeHTML(move)
                      }</div>`
                  )
                  .join("")

                ||

                "No moves yet"
              }

            </div>

          </div>


          <button
            class="primary-btn"
            data-chess-reset
            type="button"
          >
            New Game
          </button>

        </div>

      </div>

    </div>

  `;

}


/* ============================================================
   TIC TAC TOE
============================================================ */

const TTT_LINES = [

  [0, 1, 2],

  [3, 4, 5],

  [6, 7, 8],

  [0, 3, 6],

  [1, 4, 7],

  [2, 5, 8],

  [0, 4, 8],

  [2, 4, 6]

];


function tttWinner(board) {

  for (
    const [
      first,
      second,
      third
    ] of
    TTT_LINES
  ) {

    if (
      board[first] &&
      board[first] ===
      board[second] &&
      board[first] ===
      board[third]
    ) {

      return board[first];

    }

  }


  return board.every(Boolean)

    ? "draw"

    : null;

}


function bestTTTMove(
  board,
  symbol
) {

  /*
     First try to win.
  */

  for (
    let index = 0;
    index < 9;
    index++
  ) {

    if (!board[index]) {

      const test =
        [...board];


      test[index] =
        symbol;


      if (
        tttWinner(test) ===
        symbol
      ) {

        return index;

      }

    }

  }


  /*
     Block enemy.
  */

  const enemy =
    symbol === "X"

      ? "O"

      : "X";


  for (
    let index = 0;
    index < 9;
    index++
  ) {

    if (!board[index]) {

      const test =
        [...board];


      test[index] =
        enemy;


      if (
        tttWinner(test) ===
        enemy
      ) {

        return index;

      }

    }

  }


  if (!board[4]) {

    return 4;

  }


  const available =
    board
      .map(
        (
          value,
          index
        ) =>

          value
            ? null
            : index
      )
      .filter(
        value =>
          value !== null
      );


  return available.length

    ? randomItem(
        available
      )

    : -1;

}


function resetTTT(
  keep = true
) {

  const old =
    GameCenter.ttt || {};


  GameCenter.ttt = {

    board:
      Array(9)
        .fill(""),

    turn:
      "X",

    mode:
      keep
        ? old.mode ||
          "galaxy"
        : "galaxy",

    elo:
      keep
        ? old.elo ||
          500
        : 500,

    finished:
      false,

    message:
      "Your turn"

  };


  renderTTT();

}


function playTTT(index) {

  const game =
    GameCenter.ttt;


  if (
    !game ||
    game.finished ||
    game.board[index]
  ) {

    return;

  }


  if (
    game.mode ===
    "galaxy" &&
    game.turn !==
    "X"
  ) {

    return;

  }


  game.board[index] =
    game.turn;


  let winner =
    tttWinner(
      game.board
    );


  if (winner) {

    game.finished =
      true;


    game.message =

      winner ===
      "draw"

        ? "Draw"

        : (
            winner === "X"

              ? "🏆 You Win!"

              : "🏆 GALAXY Wins!"
          );


    renderTTT();

    return;

  }


  game.turn =
    game.turn === "X"

      ? "O"

      : "X";


  if (
    game.mode ===
    "friend"
  ) {

    game.message =
      game.turn === "X"

        ? "Player 1 turn"

        : "Player 2 turn";


    renderTTT();

    return;

  }


  game.message =
    "GALAXY is thinking…";


  renderTTT();


  trackTimer(
    setTimeout(
      () => {

        const strength =
          clamp(
            game.elo /
            1200,
            0.15,
            1
          );


        const available =
          game.board
            .map(
              (
                value,
                i
              ) =>
                value
                  ? null
                  : i
            )
            .filter(
              value =>
                value !==
                null
            );


        const move =

          Math.random() <
          strength

            ? bestTTTMove(
                game.board,
                "O"
              )

            : randomItem(
                available
              );


        if (
          move == null ||
          move < 0
        ) {

          return;

        }


        game.board[move] =
          "O";


        winner =
          tttWinner(
            game.board
          );


        if (winner) {

          game.finished =
            true;


          game.message =

            winner ===
            "draw"

              ? "Draw"

              : "🤖 GALAXY Wins!";

        } else {

          game.turn =
            "X";


          game.message =
            "Your turn";

        }


        renderTTT();

      },
      250
    )
  );

}


function renderTTT() {

  const game =
    GameCenter.ttt;


  if (!game) {

    resetTTT();

    return;

  }


  GameCenter.current =
    "tictactoe";


  $("#contentBody").innerHTML = `

    <div class="game-shell">

      ${
        gameTop(
          "Tic-Tac-Toe",
          game.message,
          modeSelect(game)
        )
      }


      <div class="game-layout">

        <div class="ttt-board">

          ${
            game.board
              .map(
                (
                  value,
                  index
                ) => `

                  <button
                    class="
                      ttt-cell

                      ${
                        value
                          ? `filled ${
                              value
                                .toLowerCase()
                            }`
                          : ""
                      }
                    "
                    data-ttt="${index}"
                    type="button"
                  >
                    ${value}
                  </button>

                `
              )
              .join("")
          }

        </div>


        <div class="game-side-panel">

          <button
            class="primary-btn"
            data-ttt-reset
            type="button"
          >
            New Game
          </button>

        </div>

      </div>

    </div>

  `;

}


/* ============================================================
   CONNECT FOUR
============================================================ */

function createConnectBoard() {

  return Array.from(
    {
      length: 6
    },
    () =>
      Array(7)
        .fill("")
  );

}


function connectAvailableRow(
  board,
  column
) {

  for (
    let row = 5;
    row >= 0;
    row--
  ) {

    if (
      !board[row][column]
    ) {

      return row;

    }

  }


  return -1;

}


function connectWinner(board) {

  for (
    let row = 0;
    row < 6;
    row++
  ) {

    for (
      let column = 0;
      column < 7;
      column++
    ) {

      const symbol =
        board[row][column];


      if (!symbol) {

        continue;

      }


      const directions = [

        [0, 1],

        [1, 0],

        [1, 1],

        [1, -1]

      ];


      for (
        const [
          dr,
          dc
        ] of
        directions
      ) {

        let count =
          1;


        for (
          let step = 1;
          step < 4;
          step++
        ) {

          const nextRow =
            row +
            dr *
            step;


          const nextColumn =
            column +
            dc *
            step;


          if (
            nextRow < 0 ||
            nextRow >= 6 ||
            nextColumn < 0 ||
            nextColumn >= 7 ||
            board[
              nextRow
            ][
              nextColumn
            ] !== symbol
          ) {

            break;

          }


          count++;

        }


        if (
          count >= 4
        ) {

          return symbol;

        }

      }

    }

  }


  return board
    .flat()
    .every(Boolean)

      ? "draw"

      : null;

}


function bestConnectColumn(
  board,
  symbol
) {

  /*
     Try winning move.
  */

  for (
    let column = 0;
    column < 7;
    column++
  ) {

    const row =
      connectAvailableRow(
        board,
        column
      );


    if (
      row < 0
    ) {

      continue;

    }


    const test =
      board.map(
        currentRow =>
          [...currentRow]
      );


    test[row][column] =
      symbol;


    if (
      connectWinner(test) ===
      symbol
    ) {

      return column;

    }

  }


  /*
     Block opponent.
  */

  const enemy =
    symbol === "R"

      ? "Y"

      : "R";


  for (
    let column = 0;
    column < 7;
    column++
  ) {

    const row =
      connectAvailableRow(
        board,
        column
      );


    if (
      row < 0
    ) {

      continue;

    }


    const test =
      board.map(
        currentRow =>
          [...currentRow]
      );


    test[row][column] =
      enemy;


    if (
      connectWinner(test) ===
      enemy
    ) {

      return column;

    }

  }


  return (

    [
      3,
      2,
      4,
      1,
      5,
      0,
      6
    ]
      .find(
        column =>
          connectAvailableRow(
            board,
            column
          ) >= 0
      )

    ?? -1

  );

}


function resetConnect(
  keep = true
) {

  const old =
    GameCenter.connect || {};


  GameCenter.connect = {

    board:
      createConnectBoard(),

    turn:
      "R",

    mode:
      keep
        ? old.mode ||
          "galaxy"
        : "galaxy",

    elo:
      keep
        ? old.elo ||
          500
        : 500,

    finished:
      false,

    message:
      "Your turn"

  };


  renderConnect();

}


function connectMove(column) {

  const game =
    GameCenter.connect;


  if (
    !game ||
    game.finished
  ) {

    return;

  }


  if (
    game.mode ===
    "galaxy" &&
    game.turn !==
    "R"
  ) {

    return;

  }


  const row =
    connectAvailableRow(
      game.board,
      column
    );


  if (
    row < 0
  ) {

    toast(
      "Column full"
    );

    return;

  }


  game.board[row][column] =
    game.turn;


  let winner =
    connectWinner(
      game.board
    );


  if (winner) {

    game.finished =
      true;


    game.message =
      winner ===
      "draw"

        ? "Draw"

        : "🏆 You Win!";


    renderConnect();

    return;

  }


  game.turn =
    game.turn ===
    "R"

      ? "Y"

      : "R";


  if (
    game.mode ===
    "friend"
  ) {

    game.message =
      game.turn === "R"

        ? "Player 1 turn"

        : "Player 2 turn";


    renderConnect();

    return;

  }


  game.message =
    "GALAXY is thinking…";


  renderConnect();


  trackTimer(
    setTimeout(
      () => {

        const strength =
          clamp(
            game.elo /
            1200,
            0.15,
            1
          );


        const validColumns =
          [
            ...Array(7)
              .keys()
          ]
            .filter(
              currentColumn =>
                connectAvailableRow(
                  game.board,
                  currentColumn
                ) >= 0
            );


        const aiColumn =

          Math.random() <
          strength

            ? bestConnectColumn(
                game.board,
                "Y"
              )

            : randomItem(
                validColumns
              );


        const aiRow =
          connectAvailableRow(
            game.board,
            aiColumn
          );


        if (
          aiRow >= 0
        ) {

          game.board[
            aiRow
          ][
            aiColumn
          ] =
            "Y";

        }


        winner =
          connectWinner(
            game.board
          );


        if (winner) {

          game.finished =
            true;


          game.message =
            winner ===
            "draw"

              ? "Draw"

              : "🤖 GALAXY Wins!";

        } else {

          game.turn =
            "R";


          game.message =
            "Your turn";

        }


        renderConnect();

      },
      270
    )
  );

}


function renderConnect() {

  const game =
    GameCenter.connect;


  if (!game) {

    resetConnect();

    return;

  }


  GameCenter.current =
    "connect4";


  $("#contentBody").innerHTML = `

    <div class="game-shell">

      ${
        gameTop(
          "Connect Four",
          game.message,
          modeSelect(game)
        )
      }


      <div class="game-layout">

        <div class="connect-board">

          ${
            game.board
              .map(
                row =>

                  row
                    .map(
                      (
                        value,
                        column
                      ) => `

                        <button
                          type="button"
                          class="
                            connect-cell

                            ${
                              value ===
                              "R"

                                ? "red"

                                : (
                                    value ===
                                    "Y"

                                      ? "yellow"

                                      : ""
                                  )
                            }
                          "
                          data-c4="${column}"
                        >

                          <span></span>

                        </button>

                      `
                    )
                    .join("")

              )
              .join("")
          }

        </div>


        <div class="game-side-panel">

          <button
            class="primary-btn"
            data-c4-reset
            type="button"
          >
            New Game
          </button>

        </div>

      </div>

    </div>

  `;

}


/* ============================================================
   MEMORY
============================================================ */

const MEMORY_SYMBOLS = [

  "✦",
  "☀",
  "☁",
  "☂",
  "★",
  "◆",
  "●",
  "▲"

];


function resetMemory() {

  const values = [

    ...MEMORY_SYMBOLS,

    ...MEMORY_SYMBOLS

  ].sort(
    () =>
      Math.random() -
      0.5
  );


  GameCenter.memory = {

    cards:
      values.map(
        (
          value,
          index
        ) => ({

          value,

          index,

          open:
            false,

          done:
            false

        })
      ),

    first:
      null,

    locked:
      false,

    moves:
      0,

    pairs:
      0,

    message:
      "Find all pairs"

  };


  renderMemory();

}


function memoryClick(index) {

  const game =
    GameCenter.memory;


  const card =
    game?.cards[index];


  if (
    !game ||
    !card ||
    game.locked ||
    card.open ||
    card.done
  ) {

    return;

  }


  card.open =
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

    first.done =
      true;


    card.done =
      true;


    game.pairs++;


    game.first =
      null;


    game.message =
      game.pairs === 8

        ? `🏆 Completed in ${
            game.moves
          } moves`

        : "Match!";


    renderMemory();

    return;

  }


  game.locked =
    true;


  renderMemory();


  trackTimer(
    setTimeout(
      () => {

        first.open =
          false;


        card.open =
          false;


        game.first =
          null;


        game.locked =
          false;


        game.message =
          "Try again";


        renderMemory();

      },
      650
    )
  );

}


function renderMemory() {

  const game =
    GameCenter.memory;


  if (!game) {

    resetMemory();

    return;

  }


  GameCenter.current =
    "memory";


  $("#contentBody").innerHTML = `

    <div class="game-shell">

      ${
        gameTop(
          "Memory",
          game.message
        )
      }


      <div class="game-layout">

        <div class="memory-board">

          ${
            game.cards
              .map(
                card => `

                  <button
                    type="button"
                    class="
                      memory-card

                      ${
                        card.open ||
                        card.done

                          ? "open"

                          : ""
                      }

                      ${
                        card.done

                          ? "matched"

                          : ""
                      }
                    "
                    data-memory="${card.index}"
                  >

                    ${
                      card.open ||
                      card.done

                        ? card.value

                        : "?"
                    }

                  </button>

                `
              )
              .join("")
          }

        </div>


        <div class="game-side-panel">

          <div class="score-card">

            <span>
              Moves
            </span>

            <strong>
              ${game.moves}
            </strong>

          </div>


          <div class="score-card">

            <span>
              Pairs
            </span>

            <strong>
              ${game.pairs}/8
            </strong>

          </div>


          <button
            class="primary-btn"
            data-memory-reset
            type="button"
          >
            New Game
          </button>

        </div>

      </div>

    </div>

  `;

}


/* ============================================================
   NOKIA SNAKE
============================================================ */

function resetSnake(
  level =
    GameCenter.snake?.level ||
    3
) {

  clearGameTimers();


  GameCenter.snake = {

    grid:
      20,

    snake: [

      [10, 10],

      [9, 10],

      [8, 10]

    ],

    direction:
      [1, 0],

    nextDirection:
      [1, 0],

    food:
      [15, 10],

    score:
      0,

    high:
      Number(
        storage.get(
          SNAKE_HIGH_KEY,
          0
        )
      ) || 0,

    running:
      false,

    gameOver:
      false,

    level,

    message:
      "Press Start"

  };


  renderSnake();

}


function createSnakeFood(game) {

  do {

    game.food = [

      Math.floor(
        Math.random() *
        game.grid
      ),

      Math.floor(
        Math.random() *
        game.grid
      )

    ];

  } while (

    game.snake.some(
      ([x, y]) =>

        x ===
        game.food[0] &&

        y ===
        game.food[1]
    )

  );

}


function snakeTick() {

  const game =
    GameCenter.snake;


  if (
    !game ||
    !game.running ||
    game.gameOver
  ) {

    return;

  }


  game.direction =
    game.nextDirection;


  const head =
    game.snake[0];


  const next = [

    head[0] +
    game.direction[0],

    head[1] +
    game.direction[1]

  ];


  if (
    next[0] < 0 ||
    next[0] >= game.grid ||
    next[1] < 0 ||
    next[1] >= game.grid ||
    game.snake.some(
      ([x, y]) =>

        x === next[0] &&

        y === next[1]
    )
  ) {

    game.gameOver =
      true;


    game.running =
      false;


    game.message =
      "Game Over";


    renderSnake();

    return;

  }


  game.snake.unshift(
    next
  );


  if (
    next[0] ===
    game.food[0] &&

    next[1] ===
    game.food[1]
  ) {

    game.score +=
      10 *
      game.level;


    game.high =
      Math.max(
        game.high,
        game.score
      );


    storage.set(
      SNAKE_HIGH_KEY,
      game.high
    );


    createSnakeFood(
      game
    );

  } else {

    game.snake.pop();

  }


  renderSnakeBoard();

}


function snakeStart() {

  const game =
    GameCenter.snake;


  if (!game) {

    resetSnake();

    return;

  }


  if (
    game.gameOver
  ) {

    resetSnake(
      game.level
    );

    return;

  }


  if (
    game.running
  ) {

    return;

  }


  game.running =
    true;


  game.message =
    "Running";


  const speeds = {

    1: 260,

    2: 210,

    3: 165,

    4: 125,

    5: 90

  };


  trackTimer(
    setInterval(
      snakeTick,
      speeds[
        game.level
      ]
    )
  );


  renderSnake();

}


function setSnakeDirection(
  dx,
  dy
) {

  const game =
    GameCenter.snake;


  if (!game) {

    return;

  }


  if (
    game.direction[0] ===
    -dx &&

    game.direction[1] ===
    -dy
  ) {

    return;

  }


  game.nextDirection = [
    dx,
    dy
  ];


  if (
    !game.running
  ) {

    snakeStart();

  }

}


function snakeCells() {

  const game =
    GameCenter.snake;


  let html =
    "";


  for (
    let y = 0;
    y < game.grid;
    y++
  ) {

    for (
      let x = 0;
      x < game.grid;
      x++
    ) {

      const index =
        game.snake
          .findIndex(
            point =>

              point[0] === x &&

              point[1] === y
          );


      const food =

        game.food[0] === x &&

        game.food[1] === y;


      let className =
        "snake-cell";


      if (
        index === 0
      ) {

        className +=
          " snake-head";

      } else if (
        index > 0
      ) {

        className +=
          " snake-body";

      } else if (
        food
      ) {

        className +=
          " snake-food";

      }


      html += `

        <span
          class="${className}"
        ></span>

      `;

    }

  }


  return html;

}


function renderSnakeBoard() {

  const board =
    $("#snakeBoard");


  if (board) {

    board.innerHTML =
      snakeCells();

  }


  if (
    $("#snakeScore")
  ) {

    $("#snakeScore")
      .textContent =
      GameCenter.snake.score;

  }


  if (
    $("#snakeHigh")
  ) {

    $("#snakeHigh")
      .textContent =
      GameCenter.snake.high;

  }

}


function renderSnake() {

  const game =
    GameCenter.snake;


  if (!game) {

    resetSnake();

    return;

  }


  GameCenter.current =
    "snake";


  $("#contentBody").innerHTML = `

    <div class="game-shell snake-game">

      ${
        gameTop(
          "Snake",
          game.message
        )
      }


      <div class="chicken-hud">

        <span>

          Score

          <strong id="snakeScore">
            ${game.score}
          </strong>

        </span>


        <span>

          High

          <strong id="snakeHigh">
            ${game.high}
          </strong>

        </span>


        <label>

          Level

          <select data-snake-level>

            ${
              [1, 2, 3, 4, 5]
                .map(
                  level => `

                    <option
                      value="${level}"

                      ${
                        level ===
                        game.level

                          ? "selected"

                          : ""
                      }
                    >
                      ${level}
                    </option>

                  `
                )
                .join("")
            }

          </select>

        </label>


        <button
          class="secondary-btn"
          data-snake-start
          type="button"
        >

          ${
            game.running

              ? "Running"

              : "Start"
          }

        </button>


        <button
          class="primary-btn"
          data-snake-new
          type="button"
        >
          New Game
        </button>

      </div>


      <div
        id="snakeBoard"
        class="snake-board"
      >
        ${snakeCells()}
      </div>


      <div class="chicken-controls">

        <button
          data-snake-dir="up"
          type="button"
        >
          ▲
        </button>

        <button
          data-snake-dir="left"
          type="button"
        >
          ◀
        </button>

        <button
          data-snake-dir="down"
          type="button"
        >
          ▼
        </button>

        <button
          data-snake-dir="right"
          type="button"
        >
          ▶
        </button>

      </div>

    </div>

  `;

}


/* ============================================================
   CHICKEN CROSSING
============================================================ */

function createChickenCars(level) {

  return [

    {
      row: 1,
      x: 8,
      direction: 1,
      speed:
        0.5 +
        level *
        0.07
    },

    {
      row: 2,
      x: 78,
      direction: -1,
      speed:
        0.58 +
        level *
        0.075
    },

    {
      row: 3,
      x: 25,
      direction: 1,
      speed:
        0.66 +
        level *
        0.08
    },

    {
      row: 4,
      x: 70,
      direction: -1,
      speed:
        0.74 +
        level *
        0.085
    },

    {
      row: 5,
      x: 18,
      direction: 1,
      speed:
        0.82 +
        level *
        0.09
    }

  ];

}


function resetChicken(
  level =
    GameCenter.chicken?.level ||
    3
) {

  clearGameTimers();


  GameCenter.chicken = {

    row:
      6,

    x:
      50,

    level,

    score:
      0,

    high:
      Number(
        storage.get(
          CHICKEN_HIGH_KEY,
          0
        )
      ) || 0,

    running:
      true,

    gameOver:
      false,

    message:
      "Cross the road",

    cars:
      createChickenCars(
        level
      )

  };


  renderChicken();


  trackTimer(
    setInterval(
      chickenTick,
      35
    )
  );

}


function chickenTick() {

  const game =
    GameCenter.chicken;


  if (
    !game ||
    !game.running ||
    game.gameOver
  ) {

    return;

  }


  game.cars.forEach(
    car => {

      car.x +=
        car.speed *
        car.direction;


      if (
        car.x > 110
      ) {

        car.x =
          -10;

      }


      if (
        car.x < -10
      ) {

        car.x =
          110;

      }

    }
  );


  const collision =
    game.cars.some(
      car =>

        car.row ===
        game.row &&

        Math.abs(
          car.x -
          game.x
        ) <
        8
    );


  if (collision) {

    game.gameOver =
      true;


    game.running =
      false;


    game.message =
      "Game Over";


    renderChicken();

    return;

  }


  renderChickenField();

}


function chickenMove(
  dx,
  dy
) {

  const game =
    GameCenter.chicken;


  if (
    !game ||
    game.gameOver
  ) {

    return;

  }


  game.x =
    clamp(
      game.x +
      dx,
      5,
      95
    );


  game.row =
    clamp(
      game.row +
      dy,
      0,
      6
    );


  if (
    game.row === 0
  ) {

    game.score +=
      100 *
      game.level;


    game.high =
      Math.max(
        game.high,
        game.score
      );


    storage.set(
      CHICKEN_HIGH_KEY,
      game.high
    );


    game.row =
      6;


    game.x =
      50;


    game.message =
      "Great crossing!";

  }


  renderChickenField();

}


function renderChickenField() {

  const game =
    GameCenter.chicken;


  const field =
    $("#chickenField");


  if (!field) {

    return;

  }


  field.innerHTML = `

    ${
      Array.from(
        {
          length: 7
        },
        (
          _,
          row
        ) => `

          <div
            style="
              position:absolute;
              left:0;
              right:0;
              top:${
                row *
                14.285
              }%;
              height:14.285%;
              background:${
                row === 0 ||
                row === 6

                  ? "#697856"

                  : (
                      row % 2

                        ? "#3d4140"

                        : "#464b49"
                    )
              };
              border-bottom:
                1px solid
                rgba(
                  255,
                  255,
                  255,
                  .06
                );
            "
          ></div>

        `
      ).join("")
    }


    ${
      game.cars
        .map(
          car => `

            <div
              style="
                position:absolute;
                width:42px;
                height:22px;
                left:${car.x}%;
                top:${
                  car.row *
                  14.285 +
                  5
                }%;
                transform:
                  translateX(-50%);
                background:#d9d9d9;
                border:
                  3px solid
                  #202625;
                border-radius:6px;
                z-index:5;
              "
            ></div>

          `
        )
        .join("")
    }


    <div
      style="
        position:absolute;
        left:${game.x}%;
        top:${
          game.row *
          14.285 +
          3.5
        }%;
        transform:
          translateX(-50%);
        font-size:30px;
        z-index:10;
      "
    >
      🐔
    </div>

  `;


  if (
    $("#chickenScore")
  ) {

    $("#chickenScore")
      .textContent =
      game.score;

  }


  if (
    $("#chickenHigh")
  ) {

    $("#chickenHigh")
      .textContent =
      game.high;

  }

}


function renderChicken() {

  const game =
    GameCenter.chicken;


  if (!game) {

    resetChicken();

    return;

  }


  GameCenter.current =
    "chicken";


  $("#contentBody").innerHTML = `

    <div class="game-shell">

      ${
        gameTop(
          "Chicken Crossing",
          game.message
        )
      }


      <div class="chicken-hud">

        <span>

          Score

          <strong id="chickenScore">
            ${game.score}
          </strong>

        </span>


        <span>

          High

          <strong id="chickenHigh">
            ${game.high}
          </strong>

        </span>


        <label>

          Level

          <select data-chicken-level>

            ${
              [1, 2, 3, 4, 5]
                .map(
                  level => `

                    <option
                      value="${level}"

                      ${
                        level ===
                        game.level

                          ? "selected"

                          : ""
                      }
                    >
                      ${level}
                    </option>

                  `
                )
                .join("")
            }

          </select>

        </label>


        <button
          class="primary-btn"
          data-chicken-new
          type="button"
        >
          New Game
        </button>

      </div>


      <div
        id="chickenField"
        style="
          position:relative;
          width:min(
            100%,
            500px
          );
          height:440px;
          margin:12px auto;
          overflow:hidden;
          background:#3d433e;
          border:
            6px solid
            #303633;
          border-radius:16px;
        "
      ></div>


      <div class="chicken-controls">

        <button
          data-chicken-dir="up"
          type="button"
        >
          ▲
        </button>

        <button
          data-chicken-dir="left"
          type="button"
        >
          ◀
        </button>

        <button
          data-chicken-dir="down"
          type="button"
        >
          ▼
        </button>

        <button
          data-chicken-dir="right"
          type="button"
        >
          ▶
        </button>

      </div>

    </div>

  `;


  renderChickenField();

}


/* ============================================================
   NOKIA RETRO CAR RACING
============================================================ */

function createCarGame() {

  return {

    lane:
      1,

    score:
      0,

    high:
      Number(
        storage.get(
          CAR_HIGH_KEY,
          0
        )
      ) || 0,

    level:
      1,

    speed:
      1,

    running:
      false,

    paused:
      false,

    gameOver:
      false,

    tick:
      0,

    enemies:
      [],

    message:
      "Press Start"

  };

}


function resetCar() {

  clearGameTimers();


  GameCenter.car =
    createCarGame();


  renderCar();

}


function startCar() {

  const game =
    GameCenter.car;


  if (!game) {

    resetCar();

    return;

  }


  if (
    game.gameOver
  ) {

    resetCar();

    return;

  }


  if (
    game.running
  ) {

    return;

  }


  game.running =
    true;


  game.paused =
    false;


  game.message =
    "Racing";


  const delay = {

    1: 85,

    2: 65,

    3: 48

  }[
    game.speed
  ];


  trackTimer(
    setInterval(
      carTick,
      delay
    )
  );


  renderCar();

}


function carTick() {

  const game =
    GameCenter.car;


  if (
    !game ||
    !game.running ||
    game.paused ||
    game.gameOver
  ) {

    return;

  }


  game.tick++;


  game.score++;


  game.level =
    Math.min(
      10,
      1 +
      Math.floor(
        game.score /
        120
      )
    );


  const spawnEvery =
    Math.max(
      7,
      20 -
      game.level
    );


  if (
    game.tick %
    spawnEvery ===
    0
  ) {

    game.enemies.push({

      lane:
        Math.floor(
          Math.random() *
          3
        ),

      y:
        -12

    });

  }


  game.enemies.forEach(
    enemy => {

      enemy.y +=
        4.5 +
        game.level *
        0.45;

    }
  );


  const crash =
    game.enemies.some(
      enemy =>

        enemy.lane ===
        game.lane &&

        enemy.y >
        73 &&

        enemy.y <
        95
    );


  if (crash) {

    game.gameOver =
      true;


    game.running =
      false;


    game.message =
      "CRASH!";


    game.high =
      Math.max(
        game.high,
        game.score
      );


    storage.set(
      CAR_HIGH_KEY,
      game.high
    );


    renderCar();

    return;

  }


  game.enemies =
    game.enemies.filter(
      enemy =>
        enemy.y <
        112
    );


  renderCarRoad();

}


function carMove(direction) {

  const game =
    GameCenter.car;


  if (!game) {

    return;

  }


  game.lane =
    clamp(
      game.lane +
      direction,
      0,
      2
    );


  renderCarRoad();

}


function carSpeed(direction) {

  const game =
    GameCenter.car;


  if (!game) {

    return;

  }


  game.speed =
    clamp(
      game.speed +
      direction,
      1,
      3
    );


  if (
    game.running
  ) {

    clearGameTimers();


    game.running =
      false;


    startCar();

  } else {

    renderCar();

  }

}


function toggleCarPause() {

  const game =
    GameCenter.car;


  if (
    !game ||
    !game.running
  ) {

    return;

  }


  game.paused =
    !game.paused;


  game.message =
    game.paused
      ? "Paused"
      : "Racing";


  renderCar();

}


function renderCarRoad() {

  const game =
    GameCenter.car;


  const road =
    $("#carRoad");


  if (!road) {

    return;

  }


  const lanePositions = [
    17,
    50,
    83
  ];


  road.innerHTML = `

    <div
      style="
        position:absolute;
        left:33.333%;
        top:0;
        bottom:0;
        width:2px;
        background:
          repeating-linear-gradient(
            to bottom,
            #273523 0,
            #273523 25px,
            transparent 25px,
            transparent 47px
          );
      "
    ></div>


    <div
      style="
        position:absolute;
        left:66.666%;
        top:0;
        bottom:0;
        width:2px;
        background:
          repeating-linear-gradient(
            to bottom,
            #273523 0,
            #273523 25px,
            transparent 25px,
            transparent 47px
          );
      "
    ></div>


    ${
      game.enemies
        .map(
          enemy => `

            <div
              style="
                position:absolute;
                width:33px;
                height:57px;
                left:${
                  lanePositions[
                    enemy.lane
                  ]
                }%;
                top:${enemy.y}%;
                transform:
                  translate(
                    -50%,
                    -50%
                  );
                border:
                  3px solid
                  #1b251a;
                border-radius:5px;
                background:#667654;
              "
            ></div>

          `
        )
        .join("")
    }


    <div
      style="
        position:absolute;
        width:36px;
        height:60px;
        left:${
          lanePositions[
            game.lane
          ]
        }%;
        bottom:7%;
        transform:
          translateX(-50%);
        border:
          4px solid
          #182218;
        border-radius:6px;
        background:#526349;
        z-index:10;
      "
    >

      <div
        style="
          position:absolute;
          left:6px;
          right:6px;
          top:7px;
          height:15px;
          border:
            2px solid
            #182218;
          background:#a8ba78;
        "
      ></div>

    </div>

  `;


  if (
    $("#carScore")
  ) {

    $("#carScore")
      .textContent =
      game.score;

  }


  if (
    $("#carHigh")
  ) {

    $("#carHigh")
      .textContent =
      Math.max(
        game.high,
        game.score
      );

  }


  if (
    $("#carLevel")
  ) {

    $("#carLevel")
      .textContent =
      game.level;

  }


  if (
    $("#carGear")
  ) {

    $("#carGear")
      .textContent =
      game.speed;

  }

}


function renderCar() {

  const game =
    GameCenter.car;


  if (!game) {

    resetCar();

    return;

  }


  GameCenter.current =
    "retrocar";


  $("#contentBody").innerHTML = `

    <div
      class="game-shell"
      style="
        width:min(
          100%,
          540px
        );
        margin:0 auto;
      "
    >

      ${
        gameTop(
          "Retro Car Racing",
          game.message
        )
      }


      <div class="chicken-hud">

        <span>

          Score

          <strong id="carScore">
            ${game.score}
          </strong>

        </span>


        <span>

          High

          <strong id="carHigh">

            ${
              Math.max(
                game.high,
                game.score
              )
            }

          </strong>

        </span>


        <span>

          Level

          <strong id="carLevel">
            ${game.level}
          </strong>

        </span>


        <span>

          Gear

          <strong id="carGear">
            ${game.speed}
          </strong>

        </span>

      </div>


      <div
        style="
          background:#252c29;
          padding:17px;
          border-radius:24px;
        "
      >

        <div
          style="
            background:#a8ba78;
            border:
              7px solid
              #3b443d;
            border-radius:12px;
            overflow:hidden;
            width:100%;
            aspect-ratio:4/5;
          "
        >

          <div
            id="carRoad"
            style="
              position:relative;
              width:76%;
              height:100%;
              margin:0 auto;
              border-left:
                5px solid
                #273523;
              border-right:
                5px solid
                #273523;
              background:#8c9d69;
              overflow:hidden;
            "
          ></div>

        </div>

      </div>


      <div class="chicken-controls">

        <button
          data-car-left
          type="button"
        >
          ◀
        </button>

        <button
          data-car-up
          type="button"
        >
          ▲
        </button>

        <button
          data-car-right
          type="button"
        >
          ▶
        </button>

        <button
          data-car-down
          type="button"
        >
          ▼
        </button>

      </div>


      <div
        style="
          display:flex;
          justify-content:center;
          flex-wrap:wrap;
          gap:8px;
          margin-top:12px;
        "
      >

        <button
          class="primary-btn"
          data-car-start
          type="button"
        >

          ${
            game.running
              ? "Running"
              : "Start"
          }

        </button>


        <button
          class="secondary-btn"
          data-car-pause
          type="button"
        >

          ${
            game.paused
              ? "Resume"
              : "Pause"
          }

        </button>


        <button
          class="secondary-btn"
          data-car-new
          type="button"
        >
          New Game
        </button>

      </div>

    </div>

  `;


  renderCarRoad();

}


/* ============================================================
   IMAGE CREATOR

   No frontend generation-count limit.
============================================================ */

function openGalaxyImageCreator() {

  clearGameTimers();


  GameCenter.current =
    null;


  activateContentView();


  $("#contentTitle").textContent =
    "Create Image";


  $("#contentEyebrow").textContent =
    "GALAXY IMAGE";


  $("#contentBody").innerHTML = `

    <div class="galaxy-image-maker">

      <div class="image-maker-grid">

        <section class="image-maker-panel">

          <div class="image-maker-badge">
            ✦ GALAXY IMAGE
          </div>


          <h2 class="image-maker-title">
            Create an image
          </h2>


          <p class="image-maker-description">

            Describe the image you want GALAXY to create.

          </p>


          <textarea
            id="galaxyImagePrompt"
            class="image-prompt"
            placeholder="Example: A futuristic purple city at night, cinematic lighting, highly detailed..."
          ></textarea>


          <div class="image-options">

            <label class="image-option">

              <span>
                Aspect ratio
              </span>

              <select id="galaxyImageAspect">

                <option value="1:1">
                  Square 1:1
                </option>

                <option value="16:9">
                  Landscape 16:9
                </option>

                <option value="9:16">
                  Portrait 9:16
                </option>

                <option value="4:3">
                  Landscape 4:3
                </option>

                <option value="3:4">
                  Portrait 3:4
                </option>

              </select>

            </label>


            <label class="image-option">

              <span>
                Quality
              </span>

              <select id="galaxyImageQuality">

                <option value="standard">
                  Standard
                </option>

                <option value="high">
                  High
                </option>

              </select>

            </label>

          </div>


          <button
            id="galaxyGenerateImage"
            class="image-generate-btn"
            type="button"
          >
            ✦ Generate Image
          </button>


          <div
            id="galaxyImageStatus"
            class="image-status"
          >
            Ready
          </div>

        </section>


        <section
          class="
            image-maker-panel
            image-result-panel
          "
        >

          <h3>
            Your image
          </h3>


          <div
            id="galaxyImageResult"
            class="image-result-box"
          >

            <div class="image-empty">

              <div class="image-empty-icon">
                ✦
              </div>

              <strong>
                Start creating
              </strong>

              <span>
                Your generated image will appear here.
              </span>

            </div>

          </div>


          <div
            id="galaxyImageActions"
            class="generated-image-actions"
          ></div>

        </section>

      </div>

    </div>

  `;


  $("#galaxyGenerateImage")
    ?.addEventListener(
      "click",
      generateGalaxyImage
    );


  $("#galaxyImagePrompt")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter" &&

          (
            event.ctrlKey ||
            event.metaKey
          )
        ) {

          event.preventDefault();

          generateGalaxyImage();

        }

      }
    );


  $("#galaxyImagePrompt")
    ?.focus();

}


/* ============================================================
   GENERATE IMAGE
============================================================ */

async function generateGalaxyImage() {

  const promptElement =
    $("#galaxyImagePrompt");


  const prompt =
    promptElement
      ?.value
      .trim();


  const result =
    $("#galaxyImageResult");


  const status =
    $("#galaxyImageStatus");


  const button =
    $("#galaxyGenerateImage");


  const actions =
    $("#galaxyImageActions");


  if (!prompt) {

    if (status) {

      status.classList.add(
        "error"
      );


      status.textContent =
        "Please describe the image first.";

    }


    promptElement
      ?.focus();


    return;

  }


  if (button) {

    button.disabled =
      true;


    button.textContent =
      "✦ Generating...";

  }


  if (status) {

    status.classList.remove(
      "error"
    );


    status.textContent =
      "GALAXY is creating your image…";

  }


  if (actions) {

    actions.innerHTML =
      "";

  }


  if (result) {

    result.innerHTML = `

      <div class="image-loading">

        <div class="image-loading-star">
          ✦
        </div>

        <strong>
          Creating image…
        </strong>

        <span>
          GALAXY is working on your image.
        </span>

      </div>

    `;

  }


  try {

    const response =
      await fetch(
        "/api/image",
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              prompt,

              aspect:
                $("#galaxyImageAspect")
                  ?.value ||
                "1:1",

              quality:
                $("#galaxyImageQuality")
                  ?.value ||
                "standard"

            })

        }
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (!response.ok) {

      throw new Error(

        data.error ||

        data.message ||

        `Image API error ${
          response.status
        }`

      );

    }


    let imageURL =

      data.url ||

      data.imageUrl ||

      data.image_url ||

      data.output ||

      data.result ||

      data.image ||

      data.data?.[0]?.url ||

      "";


    const base64 =

      data.base64 ||

      data.b64_json ||

      data.data?.[0]
        ?.b64_json;


    if (
      !imageURL &&
      base64
    ) {

      imageURL =
        "data:image/png;base64," +
        base64;

    }


    if (!imageURL) {

      throw new Error(
        "Image API returned no image."
      );

    }


    const safeURL =
      safeMediaURL(
        imageURL
      );


    if (!safeURL) {

      throw new Error(
        "Image API returned an invalid image URL."
      );

    }


    if (result) {

      result.innerHTML = `

        <img
          id="galaxyGeneratedImage"
          src="${safeURL}"
          alt="GALAXY generated image"
        >

      `;

    }


    if (actions) {

      actions.innerHTML = `

        <button
          class="secondary-btn"
          id="openGalaxyImage"
          type="button"
        >
          Open Image
        </button>


        <button
          class="primary-btn"
          id="generateGalaxyImageAgain"
          type="button"
        >
          Generate Again
        </button>

      `;


      $("#openGalaxyImage")
        ?.addEventListener(
          "click",
          () => {

            window.open(
              imageURL,
              "_blank",
              "noopener,noreferrer"
            );

          }
        );


      $("#generateGalaxyImageAgain")
        ?.addEventListener(
          "click",
          generateGalaxyImage
        );

    }


    if (status) {

      status.textContent =
        "Image created successfully.";

    }

  } catch (error) {

    console.error(
      "GALAXY IMAGE:",
      error
    );


    if (status) {

      status.classList.add(
        "error"
      );


      status.textContent =
        error.message;

    }


    if (result) {

      result.innerHTML = `

        <div class="image-empty">

          <div class="image-empty-icon">
            ⚠
          </div>

          <strong>
            Image generation failed
          </strong>

          <span>
            ${
              escapeHTML(
                error.message
              )
            }
          </span>

        </div>

      `;

    }

  } finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        "✦ Generate Image";

    }

  }

}


/* ============================================================
   VIDEO GENERATION LIMIT
============================================================ */

function getVideoCount() {

  return Number(
    storage.get(
      VIDEO_COUNT_KEY,
      0
    )
  ) || 0;

}


function getVideoRemaining() {

  return Math.max(
    0,
    VIDEO_LIMIT -
    getVideoCount()
  );

}


/* ============================================================
   VIDEO CREATOR

   Maximum:
   - 30 successful generations
   - 20 minutes each
============================================================ */

function openGalaxyVideoCreator() {

  clearGameTimers();


  GameCenter.current =
    null;


  activateContentView();


  const used =
    getVideoCount();


  const remaining =
    getVideoRemaining();


  $("#contentTitle").textContent =
    "Create Video";


  $("#contentEyebrow").textContent =
    "GALAXY VIDEO";


  $("#contentBody").innerHTML = `

    <div class="galaxy-image-maker">

      <div class="image-maker-grid">

        <section class="image-maker-panel">

          <div class="image-maker-badge">
            ▷ GALAXY VIDEO
          </div>


          <h2 class="image-maker-title">
            Create a video
          </h2>


          <p class="image-maker-description">

            Describe the video you want GALAXY to create.

            <br><br>

            Maximum video length:
            <strong>20 minutes</strong>

            <br>

            Video generation limit:
            <strong>30 videos</strong>

          </p>


          <div
            style="
              margin-bottom:14px;
              padding:12px 14px;
              border:
                1px solid
                var(--border);
              border-radius:12px;
              background:
                var(--bg-soft);
            "
          >

            Used:
            <strong>
              ${used}
            </strong>

            &nbsp; • &nbsp;

            Remaining:
            <strong>
              ${remaining}
            </strong>

          </div>


          <textarea
            id="galaxyVideoPrompt"
            class="image-prompt"
            placeholder="Example: A spaceship flying through a purple nebula with cinematic camera movement..."
          ></textarea>


          <div class="image-options">

            <label class="image-option">

              <span>
                Aspect ratio
              </span>

              <select id="galaxyVideoAspect">

                <option value="16:9">
                  Landscape 16:9
                </option>

                <option value="9:16">
                  Portrait 9:16
                </option>

                <option value="1:1">
                  Square 1:1
                </option>

              </select>

            </label>


            <label class="image-option">

              <span>
                Video length
              </span>

              <select id="galaxyVideoDuration">

                <option value="10">
                  10 seconds
                </option>

                <option value="30">
                  30 seconds
                </option>

                <option value="60">
                  1 minute
                </option>

                <option value="120">
                  2 minutes
                </option>

                <option value="300">
                  5 minutes
                </option>

                <option value="600">
                  10 minutes
                </option>

                <option value="900">
                  15 minutes
                </option>

                <option value="1200">
                  20 minutes
                </option>

              </select>

            </label>

          </div>


          <button
            id="galaxyGenerateVideo"
            class="image-generate-btn"
            type="button"

            ${
              remaining <= 0
                ? "disabled"
                : ""
            }
          >

            ${
              remaining <= 0

                ? "Video limit reached"

                : "▷ Generate Video"
            }

          </button>


          <div
            id="galaxyVideoStatus"
            class="image-status"
          >

            ${
              remaining <= 0

                ? "All 30 video generations have been used."

                : "Ready"
            }

          </div>

        </section>


        <section
          class="
            image-maker-panel
            image-result-panel
          "
        >

          <h3>
            Your video
          </h3>


          <div
            id="galaxyVideoResult"
            class="image-result-box"
          >

            <div class="image-empty">

              <div class="image-empty-icon">
                ▷
              </div>

              <strong>
                Start creating
              </strong>

              <span>
                Your generated video will appear here.
              </span>

            </div>

          </div>


          <div
            id="galaxyVideoActions"
            class="generated-image-actions"
          ></div>

        </section>

      </div>

    </div>

  `;


  $("#galaxyGenerateVideo")
    ?.addEventListener(
      "click",
      generateGalaxyVideo
    );


  $("#galaxyVideoPrompt")
    ?.focus();

}


/* ============================================================
   GENERATE VIDEO
============================================================ */

async function generateGalaxyVideo() {

  const count =
    getVideoCount();


  if (
    count >=
    VIDEO_LIMIT
  ) {

    toast(
      "You have reached the 30-video limit.",
      "error"
    );


    openGalaxyVideoCreator();

    return;

  }


  const promptElement =
    $("#galaxyVideoPrompt");


  const prompt =
    promptElement
      ?.value
      .trim();


  const button =
    $("#galaxyGenerateVideo");


  const status =
    $("#galaxyVideoStatus");


  const result =
    $("#galaxyVideoResult");


  const actions =
    $("#galaxyVideoActions");


  if (!prompt) {

    if (status) {

      status.classList.add(
        "error"
      );


      status.textContent =
        "Please describe the video first.";

    }


    promptElement
      ?.focus();


    return;

  }


  /*
     Maximum 20 minutes
     = 1,200 seconds.
  */

  const duration =
    clamp(
      Number(
        $("#galaxyVideoDuration")
          ?.value ||
        10
      ),
      1,
      1200
    );


  const aspect =
    $("#galaxyVideoAspect")
      ?.value ||
    "16:9";


  if (button) {

    button.disabled =
      true;


    button.textContent =
      "▷ Generating...";

  }


  if (status) {

    status.classList.remove(
      "error"
    );


    status.textContent =
      "GALAXY is creating your video…";

  }


  if (actions) {

    actions.innerHTML =
      "";

  }


  if (result) {

    result.innerHTML = `

      <div class="image-loading">

        <div class="image-loading-star">
          ▷
        </div>

        <strong>
          Creating video…
        </strong>

        <span>
          Longer videos may require more processing time.
        </span>

      </div>

    `;

  }


  try {

    const response =
      await fetch(
        "/api/video",
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              prompt,

              duration,

              aspect

            })

        }
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (!response.ok) {

      throw new Error(

        data.error ||

        data.message ||

        `Video API error ${
          response.status
        }`

      );

    }


    let videoURL =

      data.url ||

      data.videoUrl ||

      data.video_url ||

      data.output ||

      data.result ||

      data.video ||

      data.data?.[0]?.url ||

      "";


    /*
       Some video generators start a job
       and return a status URL instead.
    */

    if (
      !videoURL &&
      data.statusUrl
    ) {

      videoURL =
        await pollGalaxyVideo(
          data.statusUrl
        );

    }


    if (
      !videoURL &&
      data.pollUrl
    ) {

      videoURL =
        await pollGalaxyVideo(
          data.pollUrl
        );

    }


    if (!videoURL) {

      throw new Error(
        "Video API returned no playable video."
      );

    }


    const safeURL =
      safeMediaURL(
        videoURL
      );


    if (!safeURL) {

      throw new Error(
        "Video API returned an invalid video URL."
      );

    }


    /*
       Count only completed videos.
    */

    const newCount =
      getVideoCount() +
      1;


    storage.set(
      VIDEO_COUNT_KEY,
      newCount
    );


    if (result) {

      result.innerHTML = `

        <video
          id="galaxyGeneratedVideo"
          src="${safeURL}"
          controls
          playsinline
          preload="metadata"
          style="
            display:block;
            width:100%;
            max-width:100%;
            max-height:520px;
            border-radius:14px;
            background:#000;
          "
        ></video>

      `;

    }


    if (actions) {

      actions.innerHTML = `

        <button
          id="openGalaxyVideo"
          class="secondary-btn"
          type="button"
        >
          Open Video
        </button>


        <button
          id="generateGalaxyVideoAgain"
          class="primary-btn"
          type="button"
        >
          Generate Again
        </button>

      `;


      $("#openGalaxyVideo")
        ?.addEventListener(
          "click",
          () => {

            window.open(
              videoURL,
              "_blank",
              "noopener,noreferrer"
            );

          }
        );


      $("#generateGalaxyVideoAgain")
        ?.addEventListener(
          "click",
          generateGalaxyVideo
        );

    }


    const remaining =
      Math.max(
        0,
        VIDEO_LIMIT -
        newCount
      );


    if (status) {

      status.textContent =
        `Video created successfully. ${remaining} generations remaining.`;

    }

  } catch (error) {

    console.error(
      "GALAXY VIDEO:",
      error
    );


    if (status) {

      status.classList.add(
        "error"
      );


      status.textContent =
        error.message;

    }


    if (result) {

      result.innerHTML = `

        <div class="image-empty">

          <div class="image-empty-icon">
            ⚠
          </div>

          <strong>
            Video generation failed
          </strong>

          <span>
            ${
              escapeHTML(
                error.message
              )
            }
          </span>

        </div>

      `;

    }

  } finally {

    if (button) {

      const remaining =
        getVideoRemaining();


      button.disabled =
        remaining <= 0;


      button.textContent =

        remaining <= 0

          ? "Video limit reached"

          : "▷ Generate Video";

    }

  }

}


/* ============================================================
   VIDEO JOB POLLING
============================================================ */

async function pollGalaxyVideo(
  statusURL
) {

  const startTime =
    Date.now();


  /*
     Long videos can require much longer processing.

     This allows up to 30 minutes
     for the background generation job.
  */

  const maximumWait =
    30 *
    60 *
    1000;


  while (
    Date.now() -
    startTime <
    maximumWait
  ) {

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          5000
        )
    );


    const response =
      await fetch(
        statusURL
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (!response.ok) {

      throw new Error(

        data.error ||

        data.message ||

        "Video generation failed."

      );

    }


    const videoURL =

      data.url ||

      data.videoUrl ||

      data.video_url ||

      data.output ||

      data.result ||

      data.video;


    if (videoURL) {

      return videoURL;

    }


    const status =
      String(
        data.status ||
        ""
      )
        .toLowerCase();


    if (
      status === "failed" ||
      status === "error" ||
      status === "cancelled"
    ) {

      throw new Error(

        data.error ||

        data.message ||

        "Video generation failed."

      );

    }

  }


  throw new Error(
    "Video generation took too long."
  );

}


/* ============================================================
   CURRENT GAME SETTINGS
============================================================ */

function currentModeGame() {

  if (
    GameCenter.current ===
    "chess"
  ) {

    return GameCenter.chess;

  }


  if (
    GameCenter.current ===
    "tictactoe"
  ) {

    return GameCenter.ttt;

  }


  if (
    GameCenter.current ===
    "connect4"
  ) {

    return GameCenter.connect;

  }


  return null;

}


function rerenderCurrentModeGame() {

  if (
    GameCenter.current ===
    "chess"
  ) {

    renderChess();

    return;

  }


  if (
    GameCenter.current ===
    "tictactoe"
  ) {

    renderTTT();

    return;

  }


  if (
    GameCenter.current ===
    "connect4"
  ) {

    renderConnect();

  }

}


/* ============================================================
   GLOBAL CLICK EVENTS
============================================================ */

document.addEventListener(
  "click",
  event => {

    const target =

      event.target instanceof
      Element

        ? event.target

        : null;


    if (!target) {

      return;

    }


    /* ========================================================
       STANDARD ACTION BUTTON
    ======================================================== */

    const action =
      target.closest(
        "[data-action]"
      );


    if (action) {

      const type =
        action.dataset.action;


      if (
        type === "send"
      ) {

        sendMessage();

        return;

      }


      if (
        type === "new-chat"
      ) {

        newChat();

        return;

      }


      if (
        type ===
        "send-work" ||

        type ===
        "work-send"
      ) {

        sendWork();

        return;

      }


      if (
        type === "attach"
      ) {

        openFilePicker();

        return;

      }


      if (
        type ===
        "web-search"
      ) {

        toggleWebSearch(
          action
        );

        return;

      }


      if (
        type === "voice"
      ) {

        startVoiceInput();

        return;

      }


      if (
        type === "image"
      ) {

        openGalaxyImageCreator();

        return;

      }


      if (
        type === "video"
      ) {

        openGalaxyVideoCreator();

        return;

      }

    }


    /* ========================================================
       VIEW
    ======================================================== */

    const viewButton =
      target.closest(
        "[data-view]"
      );


    if (viewButton) {

      setView(
        viewButton.dataset.view
      );

      return;

    }


    /* ========================================================
       REMOVE ATTACHED FILE
    ======================================================== */

    const removeFile =
      target.closest(
        "[data-remove-file]"
      );


    if (removeFile) {

      const index =
        Number(
          removeFile.dataset
            .removeFile
        );


      state.attachments.splice(
        index,
        1
      );


      renderAttachments();

      return;

    }


    /* ========================================================
       BACK TO GAME CENTER
    ======================================================== */

    if (
      target.closest(
        "[data-game-back]"
      )
    ) {

      renderGames();

      return;

    }


    /* ========================================================
       OPEN GAME
    ======================================================== */

    const gameOpen =
      target.closest(
        "[data-game-open]"
      );


    if (gameOpen) {

      const game =
        gameOpen.dataset
          .gameOpen;


      if (
        game === "chess"
      ) {

        resetChess();

        return;

      }


      if (
        game ===
        "tictactoe"
      ) {

        resetTTT();

        return;

      }


      if (
        game ===
        "connect4"
      ) {

        resetConnect();

        return;

      }


      if (
        game ===
        "memory"
      ) {

        resetMemory();

        return;

      }


      if (
        game ===
        "snake"
      ) {

        resetSnake();

        return;

      }


      if (
        game ===
        "chicken"
      ) {

        resetChicken();

        return;

      }


      if (
        game ===
        "retrocar"
      ) {

        resetCar();

        return;

      }

    }


    /* ========================================================
       CHESS
    ======================================================== */

    const chessSquare =
      target.closest(
        "[data-chess]"
      );


    if (chessSquare) {

      const [
        row,
        column
      ] =
        chessSquare.dataset
          .chess
          .split(",")
          .map(Number);


      clickChess(
        row,
        column
      );

      return;

    }


    if (
      target.closest(
        "[data-chess-reset]"
      )
    ) {

      resetChess();

      return;

    }


    /* ========================================================
       TIC TAC TOE
    ======================================================== */

    const ttt =
      target.closest(
        "[data-ttt]"
      );


    if (ttt) {

      playTTT(
        Number(
          ttt.dataset.ttt
        )
      );

      return;

    }


    if (
      target.closest(
        "[data-ttt-reset]"
      )
    ) {

      resetTTT();

      return;

    }


    /* ========================================================
       CONNECT FOUR
    ======================================================== */

    const connect =
      target.closest(
        "[data-c4]"
      );


    if (connect) {

      connectMove(
        Number(
          connect.dataset.c4
        )
      );

      return;

    }


    if (
      target.closest(
        "[data-c4-reset]"
      )
    ) {

      resetConnect();

      return;

    }


    /* ========================================================
       MEMORY
    ======================================================== */

    const memory =
      target.closest(
        "[data-memory]"
      );


    if (memory) {

      memoryClick(
        Number(
          memory.dataset
            .memory
        )
      );

      return;

    }


    if (
      target.closest(
        "[data-memory-reset]"
      )
    ) {

      resetMemory();

      return;

    }


    /* ========================================================
       SNAKE
    ======================================================== */

    if (
      target.closest(
        "[data-snake-start]"
      )
    ) {

      snakeStart();

      return;

    }


    if (
      target.closest(
        "[data-snake-new]"
      )
    ) {

      resetSnake();

      return;

    }


    const snakeDirection =
      target.closest(
        "[data-snake-dir]"
      );


    if (snakeDirection) {

      const direction =
        snakeDirection.dataset
          .snakeDir;


      if (
        direction === "up"
      ) {

        setSnakeDirection(
          0,
          -1
        );

      }


      if (
        direction === "down"
      ) {

        setSnakeDirection(
          0,
          1
        );

      }


      if (
        direction === "left"
      ) {

        setSnakeDirection(
          -1,
          0
        );

      }


      if (
        direction === "right"
      ) {

        setSnakeDirection(
          1,
          0
        );

      }


      return;

    }


    /* ========================================================
       CHICKEN CROSSING
    ======================================================== */

    if (
      target.closest(
        "[data-chicken-new]"
      )
    ) {

      resetChicken();

      return;

    }


    const chickenDirection =
      target.closest(
        "[data-chicken-dir]"
      );


    if (chickenDirection) {

      const direction =
        chickenDirection.dataset
          .chickenDir;


      if (
        direction === "up"
      ) {

        chickenMove(
          0,
          -1
        );

      }


      if (
        direction === "down"
      ) {

        chickenMove(
          0,
          1
        );

      }


      if (
        direction === "left"
      ) {

        chickenMove(
          -10,
          0
        );

      }


      if (
        direction === "right"
      ) {

        chickenMove(
          10,
          0
        );

      }


      return;

    }


    /* ========================================================
       CAR
    ======================================================== */

    if (
      target.closest(
        "[data-car-start]"
      )
    ) {

      startCar();

      return;

    }


    if (
      target.closest(
        "[data-car-pause]"
      )
    ) {

      toggleCarPause();

      return;

    }


    if (
      target.closest(
        "[data-car-new]"
      )
    ) {

      resetCar();

      return;

    }


    if (
      target.closest(
        "[data-car-left]"
      )
    ) {

      carMove(-1);

      return;

    }


    if (
      target.closest(
        "[data-car-right]"
      )
    ) {

      carMove(1);

      return;

    }


    if (
      target.closest(
        "[data-car-up]"
      )
    ) {

      carSpeed(1);

      return;

    }


    if (
      target.closest(
        "[data-car-down]"
      )
    ) {

      carSpeed(-1);

      return;

    }

  }

);


/* ============================================================
   SELECT CHANGE EVENTS
============================================================ */

document.addEventListener(
  "change",
  event => {

    const target =
      event.target;


    if (
      !(
        target instanceof
        Element
      )
    ) {

      return;

    }


    /* ========================================================
       GENERAL GAME MODE
    ======================================================== */

    if (
      target.matches(
        "[data-mode]"
      )
    ) {

      const game =
        currentModeGame();


      if (!game) {

        return;

      }


      game.mode =
        target.value;


      rerenderCurrentModeGame();

      return;

    }


    /* ========================================================
       ELO
    ======================================================== */

    if (
      target.matches(
        "[data-level]"
      )
    ) {

      const game =
        currentModeGame();


      if (!game) {

        return;

      }


      game.elo =
        Number(
          target.value
        );


      rerenderCurrentModeGame();

      return;

    }


    /* ========================================================
       SNAKE LEVEL
    ======================================================== */

    if (
      target.matches(
        "[data-snake-level]"
      )
    ) {

      resetSnake(
        Number(
          target.value
        )
      );

      return;

    }


    /* ========================================================
       CHICKEN LEVEL
    ======================================================== */

    if (
      target.matches(
        "[data-chicken-level]"
      )
    ) {

      resetChicken(
        Number(
          target.value
        )
      );

      return;

    }

  }

);


/* ============================================================
   FILE INPUT
============================================================ */

$("#fileInput")
  ?.addEventListener(
    "change",
    event => {

      const files =
        [
          ...event.target.files
        ];


      handleFiles(
        files
      );


      event.target.value =
        "";

    }
  );


/* ============================================================
   CHAT TEXTAREA
============================================================ */

$("#promptInput")
  ?.addEventListener(
    "input",
    event => {

      autoResize(
        event.target
      );

    }
  );


$("#promptInput")
  ?.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter" &&

        !event.shiftKey
      ) {

        event.preventDefault();


        sendMessage();

      }

    }
  );


/* ============================================================
   KEYBOARD GAME CONTROLS
============================================================ */

document.addEventListener(
  "keydown",
  event => {

    /*
       Do not steal arrows when
       user is typing.
    */

    const tag =
      document.activeElement
        ?.tagName
        ?.toLowerCase();


    if (
      tag === "textarea" ||
      tag === "input" ||
      tag === "select"
    ) {

      return;

    }


    /* ========================================================
       SNAKE
    ======================================================== */

    if (
      GameCenter.current ===
      "snake"
    ) {

      if (
        event.key ===
        "ArrowUp"
      ) {

        event.preventDefault();


        setSnakeDirection(
          0,
          -1
        );

      }


      if (
        event.key ===
        "ArrowDown"
      ) {

        event.preventDefault();


        setSnakeDirection(
          0,
          1
        );

      }


      if (
        event.key ===
        "ArrowLeft"
      ) {

        event.preventDefault();


        setSnakeDirection(
          -1,
          0
        );

      }


      if (
        event.key ===
        "ArrowRight"
      ) {

        event.preventDefault();


        setSnakeDirection(
          1,
          0
        );

      }


      return;

    }


    /* ========================================================
       CHICKEN
    ======================================================== */

    if (
      GameCenter.current ===
      "chicken"
    ) {

      if (
        event.key ===
        "ArrowUp"
      ) {

        event.preventDefault();


        chickenMove(
          0,
          -1
        );

      }


      if (
        event.key ===
        "ArrowDown"
      ) {

        event.preventDefault();


        chickenMove(
          0,
          1
        );

      }


      if (
        event.key ===
        "ArrowLeft"
      ) {

        event.preventDefault();


        chickenMove(
          -10,
          0
        );

      }


      if (
        event.key ===
        "ArrowRight"
      ) {

        event.preventDefault();


        chickenMove(
          10,
          0
        );

      }


      return;

    }


    /* ========================================================
       RETRO CAR
    ======================================================== */

    if (
      GameCenter.current ===
      "retrocar"
    ) {

      if (
        event.key ===
        "ArrowLeft" ||
        event.key.toLowerCase() ===
        "a"
      ) {

        event.preventDefault();


        carMove(-1);

      }


      if (
        event.key ===
        "ArrowRight" ||
        event.key.toLowerCase() ===
        "d"
      ) {

        event.preventDefault();


        carMove(1);

      }


      if (
        event.key ===
        "ArrowUp" ||
        event.key.toLowerCase() ===
        "w"
      ) {

        event.preventDefault();


        carSpeed(1);

      }


      if (
        event.key ===
        "ArrowDown" ||
        event.key.toLowerCase() ===
        "s"
      ) {

        event.preventDefault();


        carSpeed(-1);

      }


      if (
        event.code ===
        "Space"
      ) {

        event.preventDefault();


        toggleCarPause();

      }

    }

  }

);


/* ============================================================
   REMOVE OLD GAMES IF OLD HTML CACHE EXISTS
============================================================ */

function removeOldGames() {

  $$(
    '[data-game-open="pals"],' +
    '[data-game-open="arena"],' +
    '[data-game-open="shooter"]'
  )
    .forEach(
      element => {

        element.remove();

      }
    );

}


/* ============================================================
   INITIALIZE
============================================================ */

function initializeGalaxy() {

  removeOldGames();


  updateSendButtonState();


  const prompt =
    $("#promptInput");


  if (prompt) {

    autoResize(
      prompt
    );

  }


  setView(
    "chat"
  );

}


/* ============================================================
   PUBLIC ACCESS
============================================================ */

window.GALAXY = {

  state,

  games:
    GameCenter,

  newChat,

  sendMessage,

  sendWork,

  openGames:
    renderGames,

  openImage:
    openGalaxyImageCreator,

  openVideo:
    openGalaxyVideoCreator,

  videoRemaining:
    getVideoRemaining

};


window.openGalaxyImageCreator =
  openGalaxyImageCreator;


window.generateGalaxyImage =
  generateGalaxyImage;


window.openGalaxyVideoCreator =
  openGalaxyVideoCreator;


window.generateGalaxyVideo =
  generateGalaxyVideo;


/* ============================================================
   START GALAXY
============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeGalaxy
  );

} else {

  initializeGalaxy();

}


/* ============================================================
   END GALAXY AI
============================================================ */
