/* ============================================================
   GALAXY
   Created by Harshavardhan

   SECRET GAME CENTER RULE:

   1. Game Center starts HIDDEN.
   2. User must type exactly:
          harshavardhan
   3. Game Center appears in the sidebar.
   4. Unlock is NOT saved to localStorage.
   5. Refresh / close / reopen GALAXY:
          Game Center becomes hidden again.
============================================================ */



/* ============================================================
   STORAGE
============================================================ */

const CHAT_STORAGE =
    "galaxy_chat_history_v4";


const CURRENT_CHAT_STORAGE =
    "galaxy_current_chat_v4";



/* ============================================================
   STATE
============================================================ */

const state = {

    chats:
        [],

    currentChatId:
        null,

    /*
     * IMPORTANT:
     * This is intentionally NOT saved.
     */

    gameCenterUnlocked:
        false,

    recognition:
        null,

    voiceStarted:
        false

};



/* ============================================================
   ELEMENTS
============================================================ */

const sidebar =
    document.getElementById(
        "sidebar"
    );


const recentChats =
    document.getElementById(
        "recentChats"
    );


const newChatRow =
    document.getElementById(
        "newChatRow"
    );


const clearRecentText =
    document.getElementById(
        "clearRecentText"
    );


const userInput =
    document.getElementById(
        "userInput"
    );


const sendControl =
    document.getElementById(
        "sendControl"
    );


const heroArea =
    document.getElementById(
        "heroArea"
    );


const chatArea =
    document.getElementById(
        "chatArea"
    );


const normalView =
    document.getElementById(
        "normalView"
    );


const gameCenterView =
    document.getElementById(
        "gameCenterView"
    );


const gameCenterItem =
    document.getElementById(
        "gameCenterItem"
    );


const gameGrid =
    document.getElementById(
        "gameGrid"
    );


const leaveGameCenter =
    document.getElementById(
        "leaveGameCenter"
    );


const statusText =
    document.getElementById(
        "statusText"
    );


const voiceIndicator =
    document.getElementById(
        "voiceIndicator"
    );


const menuToggle =
    document.getElementById(
        "menuToggle"
    );


const settingsRow =
    document.getElementById(
        "settingsRow"
    );


const settingsModal =
    document.getElementById(
        "settingsModal"
    );


const clearAllChats =
    document.getElementById(
        "clearAllChats"
    );


const restartVoice =
    document.getElementById(
        "restartVoice"
    );


const closeSettings =
    document.getElementById(
        "closeSettings"
    );



/* ============================================================
   GAME LIBRARY
============================================================ */

const GAME_LIBRARY = [

    {

        emoji:
            "🏎️",

        name:
            "Racing",

        description:
            "Cars, speed, drifting and racing challenges.",

        search:
            "racing games play online"

    },


    {

        emoji:
            "⚽",

        name:
            "Football",

        description:
            "Football matches, penalties and tournaments.",

        search:
            "football games play online"

    },


    {

        emoji:
            "🐉",

        name:
            "Creature Survival",

        description:
            "Explore worlds, creatures and survival adventures.",

        search:
            "creature survival games online"

    },


    {

        emoji:
            "🐒",

        name:
            "Mythic Action",

        description:
            "Mythical warriors, bosses and ancient worlds.",

        search:
            "mythology action games online"

    },


    {

        emoji:
            "🧱",

        name:
            "Block Worlds",

        description:
            "Creative worlds, multiplayer and obstacle games.",

        search:
            "block multiplayer games online"

    },


    {

        emoji:
            "🧩",

        name:
            "Puzzle",

        description:
            "Logic, brain games and challenging puzzles.",

        search:
            "puzzle games play online"

    },


    {

        emoji:
            "👥",

        name:
            "Multiplayer",

        description:
            "Play online with other players.",

        search:
            "multiplayer browser games online"

    },


    {

        emoji:
            "🚀",

        name:
            "Space",

        description:
            "Space adventures, ships and cosmic battles.",

        search:
            "space games play online"

    },


    {

        emoji:
            "🗺️",

        name:
            "Adventure",

        description:
            "Explore new worlds, quests and mysteries.",

        search:
            "adventure games play online"

    }

];



/* ============================================================
   START
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initialiseGalaxy
);



function initialiseGalaxy() {

    /*
     * ALWAYS LOCK GAME CENTER
     * ON EVERY PAGE LOAD.
     */

    state.gameCenterUnlocked =
        false;


    gameCenterItem.classList.add(
        "hidden-game-center"
    );


    loadChats();


    ensureCurrentChat();


    bindEvents();


    renderRecentChats();


    renderCurrentChat();


    renderGameCenter();


    updateClock();


    setInterval(
        updateClock,
        1000
    );


    updateGreeting();


    setStatus(
        "Ready"
    );


    prepareVoiceActivation();

}



/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {


    newChatRow.addEventListener(
        "click",
        createNewChat
    );


    sendControl.addEventListener(
        "click",
        sendInputMessage
    );


    userInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendInputMessage();

            }

        }
    );


    userInput.addEventListener(
        "input",
        resizeInput
    );


    document
        .querySelectorAll(
            ".quick-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const prompt =
                            card.dataset.prompt;


                        processMessage(
                            prompt
                        );

                    }
                );

            }
        );


    gameCenterItem.addEventListener(
        "click",
        openGameCenter
    );


    leaveGameCenter.addEventListener(
        "click",
        closeGameCenter
    );


    menuToggle.addEventListener(
        "click",
        () => {

            sidebar
                .classList
                .toggle(
                    "open"
                );

        }
    );


    settingsRow.addEventListener(
        "click",
        () => {

            settingsModal
                .classList
                .remove(
                    "hidden-modal"
                );

        }
    );


    closeSettings.addEventListener(
        "click",
        () => {

            settingsModal
                .classList
                .add(
                    "hidden-modal"
                );

        }
    );


    clearAllChats.addEventListener(
        "click",
        clearEveryChat
    );


    clearRecentText.addEventListener(
        "click",
        clearEveryChat
    );


    restartVoice.addEventListener(
        "click",
        restartVoiceRecognition
    );


    settingsModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                settingsModal
            ) {

                settingsModal
                    .classList
                    .add(
                        "hidden-modal"
                    );

            }

        }
    );

}



/* ============================================================
   SECRET GAME CENTER UNLOCK
============================================================ */

function checkSecretGameUnlock(
    message
) {

    /*
     * EXACT PASSWORD:
     * harshavardhan
     */

    if (
        message
            .trim()
            .toLowerCase()
        !==
        "harshavardhan"
    ) {

        return false;

    }


    /*
     * Already unlocked during
     * this page session.
     */

    if (
        state.gameCenterUnlocked
    ) {

        addAssistantMessage(
            "🎮 Game Center is already unlocked."
        );


        return true;

    }


    state.gameCenterUnlocked =
        true;


    /*
     * Reveal sidebar item.
     */

    gameCenterItem
        .classList
        .remove(
            "hidden-game-center"
        );


    addAssistantMessage(
        "🎮 Game Center unlocked.\n\nGame Center is now available in the sidebar."
    );


    setStatus(
        "Game Center unlocked"
    );


    setTimeout(
        () => {

            setStatus(
                "Ready"
            );

        },
        1800
    );


    return true;

}



/* ============================================================
   OPEN GAME CENTER
============================================================ */

function openGameCenter() {

    if (
        !state.gameCenterUnlocked
    ) {

        return;

    }


    normalView.style.display =
        "none";


    gameCenterView
        .classList
        .add(
            "active"
        );


    /*
     * Hide chat composer while
     * Game Center is open.
     */

    document
        .getElementById(
            "composerWrap"
        )
        .style
        .display =
        "none";


    setStatus(
        "Game Center"
    );


    sidebar.classList.remove(
        "open"
    );

}



/* ============================================================
   CLOSE GAME CENTER
============================================================ */

function closeGameCenter() {

    gameCenterView
        .classList
        .remove(
            "active"
        );


    normalView.style.display =
        "block";


    document
        .getElementById(
            "composerWrap"
        )
        .style
        .display =
        "block";


    renderCurrentChat();


    setStatus(
        "Ready"
    );

}



/* ============================================================
   RENDER GAME CENTER
============================================================ */

function renderGameCenter() {

    gameGrid.innerHTML =
        "";


    GAME_LIBRARY.forEach(
        game => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "game-card";


            card.innerHTML = `

                <div class="game-emoji">
                    ${game.emoji}
                </div>

                <h3>
                    ${escapeHTML(game.name)}
                </h3>

                <p>
                    ${escapeHTML(game.description)}
                </p>

            `;


            /*
             * Open online search for
             * matching games.
             */

            card.addEventListener(
                "click",
                () => {

                    const url =
                        "https://www.google.com/search?q=" +
                        encodeURIComponent(
                            game.search
                        );


                    window.open(
                        url,
                        "_blank",
                        "noopener,noreferrer"
                    );

                }
            );


            gameGrid.appendChild(
                card
            );

        }
    );

}



/* ============================================================
   SEND INPUT
============================================================ */

function sendInputMessage() {

    const text =
        userInput
            .value
            .trim();


    if (!text) {

        return;

    }


    userInput.value =
        "";


    resizeInput();


    processMessage(
        text
    );

}



/* ============================================================
   PROCESS MESSAGE
============================================================ */

async function processMessage(
    message
) {

    /*
     * Save user message.
     */

    addUserMessage(
        message
    );


    setStatus(
        "Thinking..."
    );


    await delay(
        180
    );


    /*
     * SECRET GAME CENTER
     */

    if (
        checkSecretGameUnlock(
            message
        )
    ) {

        return;

    }


    const text =
        message
            .toLowerCase()
            .trim();



    /*
     * USER TRIES GAME CENTER
     * BEFORE UNLOCK
     */

    if (
        text ===
            "game center" ||
        text ===
            "game mode" ||
        text ===
            "open game center"
    ) {

        if (
            !state.gameCenterUnlocked
        ) {

            addAssistantMessage(
                "🔒 Game Center is currently hidden."
            );


            setStatus(
                "Ready"
            );


            return;

        }


        addAssistantMessage(
            "Opening Game Center."
        );


        openGameCenter();


        return;

    }



    /*
     * CREATOR
     */

    if (
        isCreatorQuestion(
            text
        )
    ) {

        addAssistantMessage(
            "Harshavardhan is the creator of GALAXY."
        );


        setStatus(
            "Ready"
        );


        return;

    }



    /*
     * IMAGE GENERATION PROMPT
     */

    if (
        isImageCommand(
            text
        )
    ) {

        const prompt =
            cleanImagePrompt(
                message
            );


        addAssistantMessage(
`🎨 IMAGE GENERATION

Prompt:
${prompt}

GALAXY recognized your image request.

This GitHub + Vercel-only version does not contain a true AI image model yet. The prompt system is ready so a generator can be connected later without changing the main interface.`
        );


        setStatus(
            "Ready"
        );


        return;

    }



    /*
     * VIDEO GENERATION PROMPT
     */

    if (
        isVideoCommand(
            text
        )
    ) {

        const prompt =
            cleanVideoPrompt(
                message
            );


        addAssistantMessage(
`🎬 VIDEO GENERATION

Prompt:
${prompt}

GALAXY recognized your video request.

The interface is ready for video generation, but true AI text-to-video requires a video model that is not included in this GitHub + Vercel-only frontend.`
        );


        setStatus(
            "Ready"
        );


        return;

    }



    /*
     * CALCULATOR
     */

    const result =
        calculate(
            message
        );


    if (
        result !== null
    ) {

        addAssistantMessage(
            `The answer is ${result}.`
        );


        setStatus(
            "Ready"
        );


        return;

    }



    /*
     * BUILT-IN GALAXY ANSWER
     */

    const answer =
        generateGalaxyAnswer(
            message
        );


    addAssistantMessage(
        answer
    );


    setStatus(
        "Ready"
    );

}



/* ============================================================
   CREATOR QUESTION
============================================================ */

function isCreatorQuestion(
    text
) {

    const phrases = [

        "who created you",

        "who made you",

        "who built you",

        "who developed you",

        "who is your creator",

        "who created galaxy",

        "who made galaxy",

        "creator of galaxy",

        "who is harshavardhan"

    ];


    return phrases.some(
        phrase =>
            text.includes(
                phrase
            )
    );

}



/* ============================================================
   BUILT-IN ASSISTANT
============================================================ */

function generateGalaxyAnswer(
    message
) {

    const text =
        message
            .toLowerCase()
            .trim();



    if (
        ["hello", "hi", "hey"]
        .includes(
            text
        )
    ) {

        return (
            "Hello! I'm GALAXY. What can I help you with?"
        );

    }



    if (
        text.includes(
            "what is ai"
        )
    ) {

        return (
            "AI means Artificial Intelligence. It is technology that allows computers to perform tasks such as understanding language, recognizing patterns, solving problems and generating content."
        );

    }



    if (
        text.includes(
            "space"
        )
    ) {

        return (
            "Space is the enormous region beyond Earth's atmosphere. It contains stars, planets, moons, galaxies, nebulae, black holes and many other objects."
        );

    }



    if (
        text.includes(
            "black hole"
        )
    ) {

        return (
            "A black hole is a region of space where gravity is so strong that even light cannot escape once it crosses the event horizon."
        );

    }



    if (
        text.includes(
            "javascript"
        )
    ) {

        return (
            "JavaScript is a programming language used to make websites interactive. GALAXY itself uses JavaScript for chats, Game Center, voice commands and interface logic."
        );

    }



    if (
        text.includes(
            "html"
        )
    ) {

        return (
            "HTML provides the structure of a webpage. It defines things such as headings, text, sections, images and input areas."
        );

    }



    if (
        text.includes(
            "css"
        )
    ) {

        return (
            "CSS controls how websites look, including colors, layouts, spacing, fonts, responsive design and animations."
        );

    }



    if (
        text.includes(
            "write a story"
        ) ||
        text.includes(
            "tell me a story"
        )
    ) {

        return (
`The Last Star

Far beyond Earth, a young explorer discovered a tiny purple star floating alone in darkness. It was the final light of an ancient galaxy.

When the explorer touched it, thousands of forgotten worlds appeared around him.

The star had not been waiting to die.

It had been waiting for someone to begin again.`
        );

    }



    if (
        text.includes(
            "weather"
        )
    ) {

        return (
            "This version of GALAXY is running without an external weather service, so it cannot retrieve live weather yet."
        );

    }



    if (
        text.includes(
            "what can you do"
        )
    ) {

        return (
`I can currently help with:

• built-in questions
• calculations
• stories
• recent conversations
• voice wake-word commands
• image-generation prompts
• video-generation prompts
• a hidden Game Center
• game discovery

GALAXY was created by Harshavardhan.`
        );

    }



    if (
        text.includes(
            "time"
        )
    ) {

        return (
            `The current time is ${new Date().toLocaleTimeString()}.`
        );

    }



    if (
        text.includes(
            "date"
        )
    ) {

        return (
            `Today's date is ${new Date().toLocaleDateString()}.`
        );

    }



    return (
`I received your question.

This current GALAXY version runs without an external AI service, so my general knowledge is limited to the capabilities programmed into the website.

Try questions about AI, space, HTML, CSS, JavaScript, calculations or stories.`
    );

}



/* ============================================================
   IMAGE COMMAND
============================================================ */

function isImageCommand(
    text
) {

    return (

        text.startsWith(
            "create image"
        ) ||

        text.startsWith(
            "create an image"
        ) ||

        text.startsWith(
            "generate image"
        ) ||

        text.startsWith(
            "generate an image"
        ) ||

        text.startsWith(
            "make image"
        ) ||

        text.startsWith(
            "draw "
        )

    );

}



function cleanImagePrompt(
    text
) {

    return text

        .replace(
            /^create an image of\s+/i,
            ""
        )

        .replace(
            /^create image of\s+/i,
            ""
        )

        .replace(
            /^generate an image of\s+/i,
            ""
        )

        .replace(
            /^generate image of\s+/i,
            ""
        )

        .replace(
            /^make image of\s+/i,
            ""
        )

        .replace(
            /^draw\s+/i,
            ""
        )

        .trim();

}



/* ============================================================
   VIDEO COMMAND
============================================================ */

function isVideoCommand(
    text
) {

    return (

        text.startsWith(
            "create video"
        ) ||

        text.startsWith(
            "create a video"
        ) ||

        text.startsWith(
            "generate video"
        ) ||

        text.startsWith(
            "generate a video"
        ) ||

        text.startsWith(
            "make video"
        )

    );

}



function cleanVideoPrompt(
    text
) {

    return text

        .replace(
            /^create a video of\s+/i,
            ""
        )

        .replace(
            /^create video of\s+/i,
            ""
        )

        .replace(
            /^generate a video of\s+/i,
            ""
        )

        .replace(
            /^generate video of\s+/i,
            ""
        )

        .replace(
            /^make video of\s+/i,
            ""
        )

        .trim();

}



/* ============================================================
   CALCULATOR
============================================================ */

function calculate(
    message
) {

    let expression =
        message

            .toLowerCase()

            .replace(
                /^what is\s+/,
                ""
            )

            .replace(
                /^calculate\s+/,
                ""
            )

            .replace(
                /×/g,
                "*"
            )

            .replace(
                /÷/g,
                "/"
            )

            .replace(
                /\bx\b/g,
                "*"
            )

            .trim();


    if (
        !expression ||
        !/^[0-9+\-*/().%\s]+$/.test(
            expression
        )
    ) {

        return null;

    }


    try {

        const result =
            Function(
                `"use strict";return (${expression})`
            )();


        if (
            typeof result ===
                "number" &&
            Number.isFinite(
                result
            )
        ) {

            return result;

        }

    }

    catch {

        return null;

    }


    return null;

}



/* ============================================================
   CHAT SYSTEM
============================================================ */

function loadChats() {

    try {

        state.chats =
            JSON.parse(
                localStorage.getItem(
                    CHAT_STORAGE
                )
            ) ||
            [];

    }

    catch {

        state.chats =
            [];

    }


    state.currentChatId =
        localStorage.getItem(
            CURRENT_CHAT_STORAGE
        );

}



function saveChats() {

    localStorage.setItem(
        CHAT_STORAGE,
        JSON.stringify(
            state.chats
        )
    );


    if (
        state.currentChatId
    ) {

        localStorage.setItem(
            CURRENT_CHAT_STORAGE,
            state.currentChatId
        );

    }

}



/* ============================================================
   CURRENT CHAT
============================================================ */

function ensureCurrentChat() {

    const exists =
        state.chats.some(
            chat =>
                chat.id ===
                state.currentChatId
        );


    if (
        state.chats.length ===
        0
    ) {

        createNewChat(
            true
        );


        return;

    }


    if (!exists) {

        state.currentChatId =
            state.chats[0].id;


        saveChats();

    }

}



/* ============================================================
   NEW CHAT
============================================================ */

function createNewChat(
    silent = false
) {

    const chat = {

        id:
            "chat_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 6),

        title:
            "New conversation",

        createdAt:
            Date.now(),

        updatedAt:
            Date.now(),

        messages:
            []

    };


    state.chats.unshift(
        chat
    );


    state.currentChatId =
        chat.id;


    saveChats();


    closeGameCenter();


    renderRecentChats();


    renderCurrentChat();


    if (
        !silent
    ) {

        userInput.focus();

    }

}



/* ============================================================
   ADD MESSAGE
============================================================ */

function addUserMessage(
    content
) {

    addMessage(
        "user",
        content
    );

}



function addAssistantMessage(
    content
) {

    addMessage(
        "assistant",
        content
    );

}



function addMessage(
    role,
    content
) {

    const chat =
        getCurrentChat();


    if (!chat) {

        return;

    }


    chat.messages.push({

        id:
            "message_" +
            Date.now(),

        role:
            role,

        content:
            content,

        time:
            Date.now()

    });


    if (
        role ===
            "user" &&
        chat.title ===
            "New conversation"
    ) {

        chat.title =
            createTitle(
                content
            );

    }


    chat.updatedAt =
        Date.now();


    saveChats();


    renderRecentChats();


    renderCurrentChat();

}



/* ============================================================
   GET CHAT
============================================================ */

function getCurrentChat() {

    return state.chats.find(
        chat =>
            chat.id ===
            state.currentChatId
    );

}



/* ============================================================
   CHAT TITLE
============================================================ */

function createTitle(
    content
) {

    /*
     * Don't reveal secret word
     * in sidebar history.
     */

    if (
        content
            .trim()
            .toLowerCase()
        ===
        "harshavardhan"
    ) {

        return (
            "Galaxy access"
        );

    }


    const cleaned =
        content
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    if (
        cleaned.length >
        31
    ) {

        return (
            cleaned.slice(
                0,
                31
            ) +
            "..."
        );

    }


    return (
        cleaned ||
        "New conversation"
    );

}



/* ============================================================
   RECENTS
============================================================ */

function renderRecentChats() {

    recentChats.innerHTML =
        "";


    const ordered =
        [...state.chats]
        .sort(
            (
                a,
                b
            ) =>
                b.updatedAt -
                a.updatedAt
        );


    ordered.forEach(
        chat => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "recent-item";


            if (
                chat.id ===
                state.currentChatId
            ) {

                item.classList.add(
                    "active"
                );

            }


            item.innerHTML = `

                <div class="chat-icon"></div>

                <div class="recent-content">

                    <div class="recent-title">
                        ${escapeHTML(chat.title)}
                    </div>

                    <div class="recent-time">
                        ${relativeTime(chat.updatedAt)}
                    </div>

                </div>

            `;


            item.addEventListener(
                "click",
                () => {

                    state.currentChatId =
                        chat.id;


                    saveChats();


                    closeGameCenter();


                    renderRecentChats();


                    renderCurrentChat();


                    sidebar.classList.remove(
                        "open"
                    );

                }
            );


            /*
             * RIGHT CLICK DELETE
             */

            item.addEventListener(
                "contextmenu",
                event => {

                    event.preventDefault();


                    const confirmed =
                        confirm(
                            `Delete "${chat.title}"?`
                        );


                    if (
                        confirmed
                    ) {

                        deleteChat(
                            chat.id
                        );

                    }

                }
            );


            recentChats.appendChild(
                item
            );

        }
    );

}



/* ============================================================
   DELETE CHAT
============================================================ */

function deleteChat(
    id
) {

    state.chats =
        state.chats.filter(
            chat =>
                chat.id !==
                id
        );


    if (
        state.chats.length ===
        0
    ) {

        state.currentChatId =
            null;


        localStorage.removeItem(
            CURRENT_CHAT_STORAGE
        );


        createNewChat(
            true
        );


        return;

    }


    if (
        state.currentChatId ===
        id
    ) {

        state.currentChatId =
            state.chats[0].id;

    }


    saveChats();


    renderRecentChats();


    renderCurrentChat();

}



/* ============================================================
   CLEAR EVERYTHING
============================================================ */

function clearEveryChat() {

    if (
        !confirm(
            "Clear all conversations?"
        )
    ) {

        return;

    }


    localStorage.removeItem(
        CHAT_STORAGE
    );


    localStorage.removeItem(
        CURRENT_CHAT_STORAGE
    );


    state.chats =
        [];


    state.currentChatId =
        null;


    createNewChat(
        true
    );


    settingsModal
        .classList
        .add(
            "hidden-modal"
        );

}



/* ============================================================
   RENDER CURRENT CHAT
============================================================ */

function renderCurrentChat() {

    const chat =
        getCurrentChat();


    chatArea.innerHTML =
        "";


    if (
        !chat ||
        chat.messages.length ===
            0
    ) {

        heroArea.style.display =
            "flex";


        chatArea.classList.remove(
            "active"
        );


        return;

    }


    heroArea.style.display =
        "none";


    chatArea.classList.add(
        "active"
    );


    chat.messages.forEach(
        message => {

            chatArea.appendChild(
                makeMessageElement(
                    message
                )
            );

        }
    );


    requestAnimationFrame(
        () => {

            chatArea.scrollTop =
                chatArea.scrollHeight;

        }
    );

}



/* ============================================================
   MESSAGE ELEMENT
============================================================ */

function makeMessageElement(
    message
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        `message-row ${message.role}`;


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "message-avatar";


    avatar.textContent =
        message.role ===
            "assistant"
        ? "G"
        : "U";


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message-bubble";


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "message-name";


    name.textContent =
        message.role ===
            "assistant"
        ? "GALAXY"
        : "You";


    const text =
        document.createElement(
            "div"
        );


    text.className =
        "message-text";


    text.textContent =
        message.content;


    bubble.appendChild(
        name
    );


    bubble.appendChild(
        text
    );


    row.appendChild(
        avatar
    );


    row.appendChild(
        bubble
    );


    return row;

}



/* ============================================================
   CLOCK
============================================================ */

function updateClock() {

    const now =
        new Date();


    document
        .getElementById(
            "clockTime"
        )
        .textContent =
        now.toLocaleTimeString(
            [],
            {

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit"

            }
        );


    document
        .getElementById(
            "clockDate"
        )
        .textContent =
        now.toLocaleDateString(
            [],
            {

                month:
                    "short",

                day:
                    "numeric",

                year:
                    "numeric",

                weekday:
                    "short"

            }
        );

}



/* ============================================================
   GREETING
============================================================ */

function updateGreeting() {

    const hour =
        new Date()
            .getHours();


    let greeting =
        "Good evening";


    if (
        hour <
        12
    ) {

        greeting =
            "Good morning";

    }

    else if (
        hour <
        17
    ) {

        greeting =
            "Good afternoon";

    }


    document
        .getElementById(
            "greetingText"
        )
        .textContent =
        greeting;

}



/* ============================================================
   STATUS
============================================================ */

function setStatus(
    text
) {

    statusText.textContent =
        text;

}



/* ============================================================
   INPUT SIZE
============================================================ */

function resizeInput() {

    userInput.style.height =
        "auto";


    userInput.style.height =
        Math.min(
            userInput.scrollHeight,
            160
        ) +
        "px";

}



/* ============================================================
   RELATIVE TIME
============================================================ */

function relativeTime(
    time
) {

    const difference =
        Date.now() -
        time;


    const minutes =
        Math.floor(
            difference /
            60000
        );


    const hours =
        Math.floor(
            difference /
            3600000
        );


    const days =
        Math.floor(
            difference /
            86400000
        );


    if (
        minutes <
        1
    ) {

        return (
            "Just now"
        );

    }


    if (
        minutes <
        60
    ) {

        return (
            `${minutes} min ago`
        );

    }


    if (
        hours <
        24
    ) {

        return (
            `${hours} hr ago`
        );

    }


    if (
        days ===
        1
    ) {

        return (
            "Yesterday"
        );

    }


    return (
        `${days} days ago`
    );

}



/* ============================================================
   VOICE

   User can say:
   "Galaxy what is AI"
   "Galaxy harshavardhan"
   "Galaxy tell me about space"
============================================================ */

function prepareVoiceActivation() {

    /*
     * Browsers usually require one
     * user interaction before
     * microphone permission can begin.
     */

    const start = () => {

        if (
            !state.voiceStarted
        ) {

            startVoiceRecognition();

        }


        document.removeEventListener(
            "click",
            start
        );


        document.removeEventListener(
            "keydown",
            start
        );

    };


    document.addEventListener(
        "click",
        start
    );


    document.addEventListener(
        "keydown",
        start
    );

}



/* ============================================================
   START VOICE
============================================================ */

function startVoiceRecognition() {

    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (
        !Recognition
    ) {

        setStatus(
            "Voice unavailable"
        );


        return;

    }


    state.voiceStarted =
        true;


    const recognition =
        new Recognition();


    state.recognition =
        recognition;


    recognition.lang =
        "en-US";


    recognition.continuous =
        true;


    recognition.interimResults =
        false;


    recognition.onstart =
        () => {

            voiceIndicator
                .classList
                .add(
                    "listening"
                );


            setStatus(
                'Listening for "Galaxy"...'
            );

        };


    recognition.onresult =
        event => {

            for (
                let i =
                    event.resultIndex;
                i <
                    event.results.length;
                i++
            ) {

                if (
                    !event.results[i]
                        .isFinal
                ) {

                    continue;

                }


                const transcript =
                    event.results[i][0]
                        .transcript
                        .trim();


                handleVoiceCommand(
                    transcript
                );

            }

        };


    recognition.onerror =
        () => {

            voiceIndicator
                .classList
                .remove(
                    "listening"
                );


            setStatus(
                "Ready"
            );

        };


    recognition.onend =
        () => {

            voiceIndicator
                .classList
                .remove(
                    "listening"
                );


            setStatus(
                "Ready"
            );


            setTimeout(
                () => {

                    try {

                        recognition.start();

                    }

                    catch {
                    }

                },
                1000
            );

        };


    try {

        recognition.start();

    }

    catch {

        setStatus(
            "Ready"
        );

    }

}



/* ============================================================
   VOICE COMMAND
============================================================ */

function handleVoiceCommand(
    transcript
) {

    const lower =
        transcript
            .toLowerCase();


    const index =
        lower.indexOf(
            "galaxy"
        );


    if (
        index ===
        -1
    ) {

        return;

    }


    let command =
        transcript
            .slice(
                index +
                "galaxy".length
            )
            .trim();


    command =
        command.replace(
            /^[,.:;!\-\s]+/,
            ""
        );


    if (!command) {

        setStatus(
            "Galaxy heard you"
        );


        return;

    }


    processMessage(
        command
    );

}



/* ============================================================
   RESTART VOICE
============================================================ */

function restartVoiceRecognition() {

    if (
        state.recognition
    ) {

        try {

            state.recognition.stop();

        }

        catch {
        }

    }


    state.voiceStarted =
        false;


    setTimeout(
        startVoiceRecognition,
        500
    );


    settingsModal
        .classList
        .add(
            "hidden-modal"
        );

}



/* ============================================================
   HELPERS
============================================================ */

function escapeHTML(
    value
) {

    return String(
        value
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}



function delay(
    milliseconds
) {

    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}
