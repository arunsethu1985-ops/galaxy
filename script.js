/* ============================================================
   GALAXY
   Created by Harshavardhan

   - Password: 123
   - Game Center hidden after refresh
   - Built-in games only
   - No external game websites
   - Cooking game included
   - Local multilingual AI
   - Image generation
   - Motion video generation
============================================================ */


const CHAT_KEY =
    "galaxy_chats_v9";


const CURRENT_CHAT_KEY =
    "galaxy_current_chat_v9";


const TEXT_MODULE_URL =
    "https://esm.run/@mlc-ai/web-llm";


const IMAGE_MODULE_URL =
    "https://cdn.jsdelivr.net/npm/web-txt2img@0.3.1/+esm";



/* ============================================================
   STATE
============================================================ */

const state = {

    chats: [],

    currentChatId:
        null,

    gameCenterUnlocked:
        false,

    activeGame:
        null,

    gameCleanup:
        null,

    aiEngine:
        null,

    aiLoading:
        false,

    aiModelId:
        null,

    imageClient:
        null,

    imageModelLoaded:
        false,

    recognition:
        null,

    voiceStarted:
        false,

    speaking:
        false,

    busy:
        false

};



/* ============================================================
   DOM
============================================================ */

const $ =
    (id) =>
        document.getElementById(id);


const els = {

    sidebar:
        $("sidebar"),

    newChatRow:
        $("newChatRow"),

    gameCenterItem:
        $("gameCenterItem"),

    recentChats:
        $("recentChats"),

    clearRecentText:
        $("clearRecentText"),

    settingsRow:
        $("settingsRow"),

    menuToggle:
        $("menuToggle"),

    statusText:
        $("statusText"),

    modelStatus:
        $("modelStatus"),

    clockTime:
        $("clockTime"),

    clockDate:
        $("clockDate"),

    greetingText:
        $("greetingText"),

    heroArea:
        $("heroArea"),

    chatArea:
        $("chatArea"),

    normalView:
        $("normalView"),

    gameCenterView:
        $("gameCenterView"),

    gameGrid:
        $("gameGrid"),

    leaveGameCenter:
        $("leaveGameCenter"),

    gamePlayerView:
        $("gamePlayerView"),

    activeGameArea:
        $("activeGameArea"),

    activeGameTitle:
        $("activeGameTitle"),

    restartActiveGame:
        $("restartActiveGame"),

    closeActiveGame:
        $("closeActiveGame"),

    composerWrap:
        $("composerWrap"),

    userInput:
        $("userInput"),

    voiceIndicator:
        $("voiceIndicator"),

    sendControl:
        $("sendControl"),

    settingsModal:
        $("settingsModal"),

    clearAllChats:
        $("clearAllChats"),

    restartVoice:
        $("restartVoice"),

    closeSettings:
        $("closeSettings")

};



/* ============================================================
   BUILT-IN GAME LIBRARY

   No external game URLs.
============================================================ */

const GAME_LIBRARY = [

    {
        id: "racing",
        emoji: "🏎️",
        name: "Galaxy Racing",
        description:
            "Dodge the traffic and survive as long as possible."
    },

    {
        id: "football",
        emoji: "⚽",
        name: "Penalty Star",
        description:
            "Choose your direction and score past the goalkeeper."
    },

    {
        id: "cooking",
        emoji: "🍳",
        name: "Galaxy Kitchen",
        description:
            "Prepare the customer's order using the correct ingredients."
    },

    {
        id: "puzzle",
        emoji: "🧩",
        name: "Number Puzzle",
        description:
            "Move the tiles until the numbers are in the correct order."
    },

    {
        id: "memory",
        emoji: "🧠",
        name: "Memory Match",
        description:
            "Find matching pairs using as few moves as possible."
    },

    {
        id: "space",
        emoji: "🚀",
        name: "Space Defender",
        description:
            "Tap the asteroids before they escape."
    }

];



/* ============================================================
   START
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initGalaxy
);


function initGalaxy() {


    /*
     * Never save this unlock.
     */

    state.gameCenterUnlocked =
        false;


    els.gameCenterItem
        ?.classList
        .add(
            "hidden-game-center"
        );


    loadChats();

    ensureCurrentChat();

    bindEvents();

    renderRecentChats();

    renderCurrentChat();

    renderGameCenter();

    updateClock();

    updateGreeting();


    setInterval(
        updateClock,
        1000
    );


    setStatus(
        "Ready"
    );


    setModelStatus(

        navigator.gpu

            ? "Ready to download"

            : "WebGPU unavailable"

    );


    prepareVoiceActivation();

}



/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {


    els.newChatRow
        ?.addEventListener(
            "click",
            createNewChat
        );


    els.sendControl
        ?.addEventListener(
            "click",
            sendInputMessage
        );


    els.userInput
        ?.addEventListener(
            "input",
            resizeInput
        );


    els.userInput
        ?.addEventListener(

            "keydown",

            (event) => {

                if (

                    event.key === "Enter"

                    &&

                    !event.shiftKey

                ) {

                    event.preventDefault();

                    sendInputMessage();

                }

            }

        );


    document
        .querySelectorAll(
            ".quick-card"
        )
        .forEach(

            (card) => {

                card.addEventListener(

                    "click",

                    () => {

                        processMessage(

                            card.dataset.prompt || "",

                            {
                                source: "quick"
                            }

                        );

                    }

                );

            }

        );


    els.gameCenterItem
        ?.addEventListener(
            "click",
            openGameCenter
        );


    els.leaveGameCenter
        ?.addEventListener(
            "click",
            closeGameCenter
        );


    els.closeActiveGame
        ?.addEventListener(
            "click",
            returnToGameCenter
        );


    els.restartActiveGame
        ?.addEventListener(
            "click",
            restartCurrentGame
        );


    els.menuToggle
        ?.addEventListener(

            "click",

            () => {

                els.sidebar
                    ?.classList
                    .toggle(
                        "open"
                    );

            }

        );


    els.settingsRow
        ?.addEventListener(

            "click",

            () => {

                els.settingsModal
                    ?.classList
                    .remove(
                        "hidden-modal"
                    );

            }

        );


    els.closeSettings
        ?.addEventListener(

            "click",

            () => {

                els.settingsModal
                    ?.classList
                    .add(
                        "hidden-modal"
                    );

            }

        );


    els.clearAllChats
        ?.addEventListener(
            "click",
            clearEveryChat
        );


    els.clearRecentText
        ?.addEventListener(
            "click",
            clearEveryChat
        );


    els.restartVoice
        ?.addEventListener(
            "click",
            restartVoiceRecognition
        );

}



/* ============================================================
   SEND
============================================================ */

function sendInputMessage() {


    if (
        state.busy
    ) {

        return;

    }


    const text =
        els.userInput
            ?.value
            .trim()
        || "";


    if (!text) {

        return;

    }


    els.userInput.value =
        "";


    resizeInput();


    processMessage(

        text,

        {
            source: "typed"
        }

    );

}



/* ============================================================
   PROCESS MESSAGE
============================================================ */

async function processMessage(

    message,

    {
        source = "typed"
    } = {}

) {


    const cleanMessage =
        String(
            message || ""
        )
        .trim();


    if (!cleanMessage) {

        return;

    }


    addUserMessage(
        cleanMessage
    );


    setStatus(
        "Thinking…"
    );



    /* ========================================================
       GAME PASSWORD

       Must be typed exactly:
       123

       Voice cannot unlock it.
    ======================================================== */

    if (

        source === "typed"

        &&

        cleanMessage === "123"

    ) {

        unlockGameCenter();

        return;

    }


    const lower =
        cleanMessage
            .toLowerCase();



    /* ========================================================
       GAME CENTER COMMANDS
    ======================================================== */

    if (

        [
            "game center",
            "game mode",
            "open game center",
            "open game mode"
        ]

        .includes(
            lower
        )

    ) {


        if (
            !state.gameCenterUnlocked
        ) {

            respond(
                "🔒 Game Center is hidden.",
                source
            );

            return;

        }


        respond(
            "Opening Game Center.",
            source
        );


        openGameCenter();

        return;

    }



    /* ========================================================
       CREATOR
    ======================================================== */

    if (
        isCreatorQuestion(
            lower
        )
    ) {

        respond(

            "Harshavardhan is the creator and developer of GALAXY.",

            source

        );

        return;

    }



    /* ========================================================
       LANGUAGES
    ======================================================== */

    if (
        isLanguageQuestion(
            lower
        )
    ) {

        respond(

            "GALAXY can work with many languages supported by the downloaded local AI model, including English, Tamil, Hindi, Arabic, French and Spanish.",

            source

        );

        return;

    }



    /* ========================================================
       WEATHER
    ======================================================== */

    if (
        isWeatherQuestion(
            lower
        )
    ) {

        respond(

            "Live weather data is not connected in this local version of GALAXY, so I will not guess the current weather.",

            source

        );

        return;

    }



    /* ========================================================
       CALCULATOR
    ======================================================== */

    const calculation =
        calculate(
            cleanMessage
        );


    if (
        calculation !== null
    ) {

        respond(

            `The answer is ${calculation}.`,

            source

        );

        return;

    }



    /* ========================================================
       VIDEO
    ======================================================== */

    if (
        isVideoCommand(
            lower
        )
    ) {

        await handleVideoGeneration(

            cleanVideoPrompt(
                cleanMessage
            ),

            source

        );

        return;

    }



    /* ========================================================
       IMAGE
    ======================================================== */

    if (
        isImageCommand(
            lower
        )
    ) {

        await handleImageGeneration(

            cleanImagePrompt(
                cleanMessage
            ),

            source

        );

        return;

    }



    /* ========================================================
       GENERAL AI
    ======================================================== */

    await answerWithLocalAI(

        cleanMessage,

        source

    );

}



/* ============================================================
   UNLOCK GAME CENTER
============================================================ */

function unlockGameCenter() {


    state.gameCenterUnlocked =
        true;


    els.gameCenterItem
        ?.classList
        .remove(
            "hidden-game-center"
        );


    respond(

        "🎮 Game Center unlocked. It is now available in the sidebar.",

        "typed"

    );

}



/* ============================================================
   GAME CENTER
============================================================ */

function openGameCenter() {


    if (
        !state.gameCenterUnlocked
    ) {

        return;

    }


    cleanupCurrentGame();


    if (
        els.normalView
    ) {

        els.normalView.style.display =
            "none";

    }


    els.gamePlayerView
        ?.classList
        .remove(
            "active"
        );


    els.gameCenterView
        ?.classList
        .add(
            "active"
        );


    if (
        els.composerWrap
    ) {

        els.composerWrap.style.display =
            "none";

    }


    setStatus(
        "Game Center"
    );

}



/* ============================================================
   LEAVE GAME CENTER
============================================================ */

function closeGameCenter() {


    cleanupCurrentGame();


    els.gameCenterView
        ?.classList
        .remove(
            "active"
        );


    els.gamePlayerView
        ?.classList
        .remove(
            "active"
        );


    if (
        els.normalView
    ) {

        els.normalView.style.display =
            "block";

    }


    if (
        els.composerWrap
    ) {

        els.composerWrap.style.display =
            "block";

    }


    renderCurrentChat();


    setStatus(
        "Ready"
    );

}



/* ============================================================
   GAME CARDS
============================================================ */

function renderGameCenter() {


    if (
        !els.gameGrid
    ) {

        return;

    }


    els.gameGrid.innerHTML =
        "";


    GAME_LIBRARY.forEach(

        (game) => {


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

                <div class="play-game-button">
                    Play
                </div>

            `;


            card
                .querySelector(
                    ".play-game-button"
                )
                .addEventListener(

                    "click",

                    () => {

                        launchGame(
                            game.id
                        );

                    }

                );


            els.gameGrid
                .appendChild(
                    card
                );

        }

    );

}



/* ============================================================
   LAUNCH GAME
============================================================ */

function launchGame(
    gameId
) {


    cleanupCurrentGame();


    const game =
        GAME_LIBRARY.find(

            (item) =>
                item.id === gameId

        );


    if (!game) {

        return;

    }


    state.activeGame =
        gameId;


    els.activeGameTitle.textContent =
        `${game.emoji} ${game.name}`;


    els.gameCenterView
        ?.classList
        .remove(
            "active"
        );


    els.gamePlayerView
        ?.classList
        .add(
            "active"
        );


    setStatus(
        game.name
    );


    switch (
        gameId
    ) {

        case "racing":

            startRacingGame();

            break;


        case "football":

            startFootballGame();

            break;


        case "cooking":

            startCookingGame();

            break;


        case "puzzle":

            startPuzzleGame();

            break;


        case "memory":

            startMemoryGame();

            break;


        case "space":

            startSpaceGame();

            break;

    }

}



/* ============================================================
   RETURN TO GAME CENTER
============================================================ */

function returnToGameCenter() {


    cleanupCurrentGame();


    els.gamePlayerView
        ?.classList
        .remove(
            "active"
        );


    els.gameCenterView
        ?.classList
        .add(
            "active"
        );


    state.activeGame =
        null;


    setStatus(
        "Game Center"
    );

}



/* ============================================================
   RESTART GAME
============================================================ */

function restartCurrentGame() {


    if (
        !state.activeGame
    ) {

        return;

    }


    const gameId =
        state.activeGame;


    cleanupCurrentGame();


    state.activeGame =
        gameId;


    launchGame(
        gameId
    );

}



/* ============================================================
   CLEANUP
============================================================ */

function cleanupCurrentGame() {


    if (
        typeof state.gameCleanup ===
        "function"
    ) {

        try {

            state.gameCleanup();

        }

        catch {
        }

    }


    state.gameCleanup =
        null;


    if (
        els.activeGameArea
    ) {

        els.activeGameArea.innerHTML =
            "";

    }

}



/* ============================================================
   RACING GAME
============================================================ */

function startRacingGame() {


    let score =
        0;


    let playerLane =
        1;


    let enemyLane =
        Math.floor(
            Math.random() *
            3
        );


    let enemyY =
        -80;


    let running =
        true;


    els.activeGameArea.innerHTML = `

        <div class="mini-game">

            <div
                class="game-score"
                id="raceScore"
            >
                Score: 0
            </div>

            <div class="game-instructions">
                Use ← and → arrow keys, or the buttons below.
                Avoid the red car.
            </div>

            <div
                class="race-road"
                id="raceRoad"
            >

                <div
                    class="player-car"
                    id="playerCar"
                >
                    🏎️
                </div>

                <div
                    class="enemy-car"
                    id="enemyCar"
                >
                    🚗
                </div>

            </div>

            <div>

                <div
                    class="game-button"
                    id="raceLeft"
                >
                    ← Left
                </div>

                <div
                    class="game-button"
                    id="raceRight"
                >
                    Right →
                </div>

            </div>

        </div>

    `;


    const player =
        $("playerCar");


    const enemy =
        $("enemyCar");


    const scoreText =
        $("raceScore");


    const lanes = [
        37,
        116,
        195
    ];


    function updatePlayer() {

        player.style.left =
            `${lanes[playerLane]}px`;

    }


    function moveLeft() {

        playerLane =
            Math.max(
                0,
                playerLane - 1
            );


        updatePlayer();

    }


    function moveRight() {

        playerLane =
            Math.min(
                2,
                playerLane + 1
            );


        updatePlayer();

    }


    function keyHandler(
        event
    ) {

        if (
            event.key ===
            "ArrowLeft"
        ) {

            moveLeft();

        }


        if (
            event.key ===
            "ArrowRight"
        ) {

            moveRight();

        }

    }


    document.addEventListener(
        "keydown",
        keyHandler
    );


    $("raceLeft")
        .addEventListener(
            "click",
            moveLeft
        );


    $("raceRight")
        .addEventListener(
            "click",
            moveRight
        );


    let previous =
        performance.now();


    function loop(
        now
    ) {


        if (
            !running
        ) {

            return;

        }


        const delta =
            Math.min(
                35,
                now - previous
            );


        previous =
            now;


        enemyY +=
            delta *
            0.18;


        enemy.style.left =
            `${lanes[enemyLane]}px`;


        enemy.style.top =
            `${enemyY}px`;


        if (
            enemyY >
            270
        ) {


            if (
                enemyLane ===
                playerLane
            ) {

                running =
                    false;


                scoreText.textContent =
                    `Crash! Final score: ${score}`;


                return;

            }


            score +=
                1;


            scoreText.textContent =
                `Score: ${score}`;


            enemyY =
                -80;


            enemyLane =
                Math.floor(
                    Math.random() *
                    3
                );

        }


        requestAnimationFrame(
            loop
        );

    }


    requestAnimationFrame(
        loop
    );


    state.gameCleanup =
        () => {

            running =
                false;


            document.removeEventListener(
                "keydown",
                keyHandler
            );

        };

}



/* ============================================================
   FOOTBALL GAME
============================================================ */

function startFootballGame() {


    let goals =
        0;


    let shots =
        0;


    els.activeGameArea.innerHTML = `

        <div class="mini-game">

            <div
                class="game-score"
                id="footballScore"
            >
                Goals: 0 / 0
            </div>

            <div class="game-instructions">
                Choose where to shoot.
                Try to beat the goalkeeper.
            </div>

            <div
                class="goal-area"
                id="goalArea"
            >

                <div
                    class="goalkeeper"
                    id="goalkeeper"
                >
                    🧤
                </div>

                <div
                    class="football-ball"
                    id="footballBall"
                >
                    ⚽
                </div>

            </div>

            <div>

                <div
                    class="game-button"
                    data-shot="left"
                >
                    Left
                </div>

                <div
                    class="game-button"
                    data-shot="center"
                >
                    Center
                </div>

                <div
                    class="game-button"
                    data-shot="right"
                >
                    Right
                </div>

            </div>

        </div>

    `;


    const ball =
        $("footballBall");


    const keeper =
        $("goalkeeper");


    const score =
        $("footballScore");


    let locked =
        false;


    document
        .querySelectorAll(
            "[data-shot]"
        )
        .forEach(

            (button) => {

                button.addEventListener(

                    "click",

                    () => {


                        if (
                            locked
                        ) {

                            return;

                        }


                        locked =
                            true;


                        const shot =
                            button.dataset.shot;


                        const keeperChoice =
                            [
                                "left",
                                "center",
                                "right"
                            ][
                                Math.floor(
                                    Math.random() *
                                    3
                                )
                            ];


                        const positions = {

                            left:
                                "20%",

                            center:
                                "50%",

                            right:
                                "80%"

                        };


                        keeper.style.left =
                            `calc(${positions[keeperChoice]} - 25px)`;


                        ball.style.left =
                            `calc(${positions[shot]} - 18px)`;


                        ball.style.bottom =
                            "170px";


                        shots +=
                            1;


                        setTimeout(

                            () => {


                                if (
                                    shot !==
                                    keeperChoice
                                ) {

                                    goals +=
                                        1;

                                }


                                score.textContent =
                                    `Goals: ${goals} / ${shots}`;


                                ball.style.left =
                                    "calc(50% - 18px)";


                                ball.style.bottom =
                                    "-65px";


                                keeper.style.left =
                                    "calc(50% - 25px)";


                                locked =
                                    false;

                            },

                            650

                        );

                    }

                );

            }

        );


    state.gameCleanup =
        () => {};

}



/* ============================================================
   COOKING GAME
============================================================ */

function startCookingGame() {


    const recipes = [

        {
            name:
                "Cheese Burger",

            emoji:
                "🍔",

            ingredients:
                [
                    "Bread",
                    "Cheese",
                    "Patty"
                ]
        },

        {
            name:
                "Fresh Salad",

            emoji:
                "🥗",

            ingredients:
                [
                    "Lettuce",
                    "Tomato",
                    "Carrot"
                ]
        },

        {
            name:
                "Pizza",

            emoji:
                "🍕",

            ingredients:
                [
                    "Dough",
                    "Cheese",
                    "Tomato"
                ]
        },

        {
            name:
                "Fruit Bowl",

            emoji:
                "🍓",

            ingredients:
                [
                    "Apple",
                    "Banana",
                    "Strawberry"
                ]
        }

    ];


    const allIngredients = [

        ["Bread", "🍞"],
        ["Cheese", "🧀"],
        ["Patty", "🥩"],
        ["Lettuce", "🥬"],
        ["Tomato", "🍅"],
        ["Carrot", "🥕"],
        ["Dough", "🫓"],
        ["Apple", "🍎"],
        ["Banana", "🍌"],
        ["Strawberry", "🍓"]

    ];


    let score =
        0;


    let selected =
        [];


    let recipe =
        randomItem(
            recipes
        );


    function renderCooking() {


        els.activeGameArea.innerHTML = `

            <div class="mini-game kitchen">

                <div
                    class="game-score"
                    id="cookScore"
                >
                    Chef Score: ${score}
                </div>

                <div class="order-card">

                    <div style="font-size:34px;">
                        ${recipe.emoji}
                    </div>

                    <h3>
                        Customer wants:
                        ${recipe.name}
                    </h3>

                    <div class="game-instructions">
                        Choose the correct 3 ingredients.
                    </div>

                </div>


                <div class="ingredients">

                    ${

                        shuffle(
                            [...allIngredients]
                        )

                        .map(

                            (
                                [
                                    name,
                                    emoji
                                ]
                            ) => `

                                <div
                                    class="ingredient"
                                    data-ingredient="${name}"
                                >

                                    <div style="font-size:26px;">
                                        ${emoji}
                                    </div>

                                    ${name}

                                </div>

                            `

                        )
                        .join("")

                    }

                </div>


                <div
                    class="cooking-pot"
                    id="cookingPot"
                >
                    🍲 Your bowl is empty
                </div>


                <div
                    class="game-button"
                    id="serveFood"
                >
                    Serve Dish
                </div>

                <div
                    class="game-button"
                    id="clearFood"
                >
                    Clear
                </div>

            </div>

        `;


        document
            .querySelectorAll(
                "[data-ingredient]"
            )
            .forEach(

                (item) => {

                    item.addEventListener(

                        "click",

                        () => {


                            const ingredient =
                                item.dataset.ingredient;


                            if (

                                selected.includes(
                                    ingredient
                                )

                                ||

                                selected.length >=
                                3

                            ) {

                                return;

                            }


                            selected.push(
                                ingredient
                            );


                            updateCookingPot();

                        }

                    );

                }

            );


        $("clearFood")
            .addEventListener(

                "click",

                () => {

                    selected =
                        [];


                    updateCookingPot();

                }

            );


        $("serveFood")
            .addEventListener(

                "click",

                () => {


                    if (
                        selected.length !==
                        3
                    ) {

                        $("cookingPot")
                            .textContent =
                            "⚠ Choose exactly 3 ingredients.";

                        return;

                    }


                    const correct =

                        [...selected]
                            .sort()
                            .join("|")

                        ===

                        [...recipe.ingredients]
                            .sort()
                            .join("|");


                    if (
                        correct
                    ) {

                        score +=
                            10;


                        $("cookingPot")
                            .textContent =
                            "✅ Delicious! Customer is happy!";

                    }

                    else {

                        score =
                            Math.max(
                                0,
                                score - 3
                            );


                        $("cookingPot")
                            .textContent =
                            "❌ Wrong recipe. Try another order!";

                    }


                    setTimeout(

                        () => {


                            selected =
                                [];


                            recipe =
                                randomItem(
                                    recipes
                                );


                            renderCooking();

                        },

                        1100

                    );

                }

            );

    }


    function updateCookingPot() {


        const pot =
            $("cookingPot");


        if (
            !selected.length
        ) {

            pot.textContent =
                "🍲 Your bowl is empty";

        }

        else {

            pot.textContent =
                `🍲 ${selected.join(" + ")}`;

        }

    }


    renderCooking();


    state.gameCleanup =
        () => {};

}



/* ============================================================
   NUMBER PUZZLE
============================================================ */

function startPuzzleGame() {


    let numbers =

        shuffle(
            [
                1, 2, 3,
                4, 5, 6,
                7, 8, null
            ]
        );


    let moves =
        0;


    function render() {


        els.activeGameArea.innerHTML = `

            <div class="mini-game">

                <div class="game-score">
                    Moves: ${moves}
                </div>

                <div class="game-instructions">
                    Arrange the numbers from 1 to 8.
                </div>

                <div
                    class="puzzle-grid"
                    id="puzzleGrid"
                >

                    ${

                        numbers
                            .map(

                                (
                                    number,
                                    index
                                ) => `

                                    <div
                                        class="puzzle-cell"
                                        data-index="${index}"
                                    >

                                        ${
                                            number === null
                                            ?
                                            ""
                                            :
                                            number
                                        }

                                    </div>

                                `

                            )
                            .join("")

                    }

                </div>

            </div>

        `;


        document
            .querySelectorAll(
                ".puzzle-cell"
            )
            .forEach(

                (cell) => {

                    cell.addEventListener(

                        "click",

                        () => {

                            movePuzzleTile(
                                Number(
                                    cell.dataset.index
                                )
                            );

                        }

                    );

                }

            );

    }


    function movePuzzleTile(
        index
    ) {


        const empty =
            numbers.indexOf(
                null
            );


        const valid = [

            empty - 1,
            empty + 1,
            empty - 3,
            empty + 3

        ];


        if (
            !valid.includes(
                index
            )
        ) {

            return;

        }


        const row1 =
            Math.floor(
                empty /
                3
            );


        const row2 =
            Math.floor(
                index /
                3
            );


        if (

            Math.abs(
                empty -
                index
            ) ===
            1

            &&

            row1 !==
            row2

        ) {

            return;

        }


        numbers[empty] =
            numbers[index];


        numbers[index] =
            null;


        moves +=
            1;


        const solved =

            numbers
                .slice(
                    0,
                    8
                )
                .every(

                    (
                        value,
                        i
                    ) =>
                        value ===
                        i + 1

                );


        render();


        if (
            solved
        ) {

            setTimeout(

                () => {

                    alert(
                        `Puzzle solved in ${moves} moves!`
                    );

                },

                100

            );

        }

    }


    render();


    state.gameCleanup =
        () => {};

}



/* ============================================================
   MEMORY GAME
============================================================ */

function startMemoryGame() {


    const values =
        shuffle(

            [
                "🚀",
                "🌙",
                "⭐",
                "🪐",
                "🚀",
                "🌙",
                "⭐",
                "🪐",
                "🤖",
                "👾",
                "🌌",
                "☄️",
                "🤖",
                "👾",
                "🌌",
                "☄️"
            ]

        );


    let revealed =
        [];


    let matched =
        new Set();


    let moves =
        0;


    let locked =
        false;


    function render() {


        els.activeGameArea.innerHTML = `

            <div class="mini-game">

                <div class="game-score">
                    Moves: ${moves}
                    &nbsp; Matches:
                    ${matched.size / 2}/8
                </div>

                <div class="game-instructions">
                    Find all matching pairs.
                </div>

                <div class="memory-grid">

                    ${

                        values
                            .map(

                                (
                                    value,
                                    index
                                ) => `

                                    <div
                                        class="memory-card"
                                        data-index="${index}"
                                    >

                                        ${
                                            revealed.includes(index)
                                            ||
                                            matched.has(index)

                                            ?

                                            value

                                            :

                                            "✦"
                                        }

                                    </div>

                                `

                            )
                            .join("")

                    }

                </div>

            </div>

        `;


        document
            .querySelectorAll(
                ".memory-card"
            )
            .forEach(

                (card) => {

                    card.addEventListener(

                        "click",

                        () => {

                            flipCard(
                                Number(
                                    card.dataset.index
                                )
                            );

                        }

                    );

                }

            );

    }


    function flipCard(
        index
    ) {


        if (

            locked

            ||

            matched.has(
                index
            )

            ||

            revealed.includes(
                index
            )

        ) {

            return;

        }


        revealed.push(
            index
        );


        render();


        if (
            revealed.length ===
            2
        ) {


            moves +=
                1;


            const [
                first,
                second
            ] =
                revealed;


            if (
                values[first] ===
                values[second]
            ) {


                matched.add(
                    first
                );


                matched.add(
                    second
                );


                revealed =
                    [];


                render();


                if (
                    matched.size ===
                    values.length
                ) {

                    setTimeout(

                        () => {

                            alert(
                                `You won in ${moves} moves!`
                            );

                        },

                        200

                    );

                }

            }

            else {


                locked =
                    true;


                setTimeout(

                    () => {

                        revealed =
                            [];


                        locked =
                            false;


                        render();

                    },

                    750

                );

            }

        }

    }


    render();


    state.gameCleanup =
        () => {};

}



/* ============================================================
   SPACE GAME
============================================================ */

function startSpaceGame() {


    let score =
        0;


    let running =
        true;


    els.activeGameArea.innerHTML = `

        <div class="mini-game">

            <div
                class="game-score"
                id="spaceScore"
            >
                Score: 0
            </div>

            <div class="game-instructions">
                Click the asteroids before they disappear.
            </div>

            <div
                class="space-game-area"
                id="spaceGame"
            >

                <div class="space-ship">
                    🚀
                </div>

            </div>

        </div>

    `;


    const area =
        $("spaceGame");


    const scoreText =
        $("spaceScore");


    function spawnTarget() {


        if (
            !running
        ) {

            return;

        }


        const target =
            document.createElement(
                "div"
            );


        target.className =
            "space-target";


        target.textContent =
            Math.random() >
            0.4

            ?
            "☄️"

            :
            "👾";


        target.style.left =
            `${Math.random() * 85}%`;


        target.style.top =
            `${Math.random() * 65}%`;


        target.addEventListener(

            "click",

            () => {


                score +=
                    1;


                scoreText.textContent =
                    `Score: ${score}`;


                target.remove();

            }

        );


        area.appendChild(
            target
        );


        setTimeout(

            () => {

                target.remove();

            },

            1400

        );

    }


    const timer =
        setInterval(
            spawnTarget,
            800
        );


    state.gameCleanup =
        () => {

            running =
                false;


            clearInterval(
                timer
            );

        };

}



/* ============================================================
   HELPERS FOR GAMES
============================================================ */

function randomItem(
    array
) {

    return array[
        Math.floor(
            Math.random() *
            array.length
        )
    ];

}


function shuffle(
    array
) {


    for (
        let i =
            array.length - 1;

        i > 0;

        i--
    ) {


        const j =
            Math.floor(
                Math.random() *
                (
                    i + 1
                )
            );


        [
            array[i],
            array[j]
        ] = [

            array[j],
            array[i]

        ];

    }


    return array;

}



/* ============================================================
   CREATOR
============================================================ */

function isCreatorQuestion(
    text
) {


    return [

        "who created you",
        "who made you",
        "who built you",
        "who developed you",
        "who is your creator",
        "who created galaxy",
        "who made galaxy"

    ]
    .some(

        (phrase) =>
            text.includes(
                phrase
            )

    );

}



/* ============================================================
   LANGUAGE
============================================================ */

function isLanguageQuestion(
    text
) {


    return (

        text.includes(
            "do you know tamil"
        )

        ||

        text.includes(
            "can you speak tamil"
        )

        ||

        text.includes(
            "how many languages"
        )

        ||

        text.includes(
            "how many langueages"
        )

        ||

        text.includes(
            "what languages"
        )

    );

}



/* ============================================================
   WEATHER
============================================================ */

function isWeatherQuestion(
    text
) {


    return (

        /\b(weather|temperature|forecast|weather today)\b/i
            .test(
                text
            )

    );

}



/* ============================================================
   CALCULATOR
============================================================ */

function calculate(
    message
) {


    const expression =
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

            .trim();


    if (

        !expression

        ||

        !/^[0-9+\-*/().%\s]+$/
            .test(
                expression
            )

    ) {

        return null;

    }


    try {


        const result =
            Function(

                `"use strict";
                 return (${expression});`

            )();


        return (

            typeof result ===
            "number"

            &&

            Number.isFinite(
                result
            )

        )

        ?

        result

        :

        null;

    }

    catch {

        return null;

    }

}



/* ============================================================
   IMAGE DETECTION
============================================================ */

function isImageCommand(
    text
) {


    return (

        /^(create|generate|make|draw|paint|design|show)\b/i
            .test(
                text
            )

        &&

        /\b(image|picture|photo|wallpaper|poster|artwork|illustration)\b/i
            .test(
                text
            )

    )

    ||

    /^draw\b/i
        .test(
            text
        );

}


function cleanImagePrompt(
    text
) {


    return text

        .replace(
            /^(create|generate|make|draw|paint|design|show)\s+/i,
            ""
        )

        .replace(
            /^(an?|the)\s+/i,
            ""
        )

        .replace(
            /\b(image|picture|photo|wallpaper|poster|artwork|illustration)\b/gi,
            ""
        )

        .replace(
            /^\s*of\s+/i,
            ""
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        ||

        "a beautiful cinematic scene";

}



/* ============================================================
   VIDEO DETECTION
============================================================ */

function isVideoCommand(
    text
) {


    return (

        /^(create|generate|make|design|show)\b/i
            .test(
                text
            )

        &&

        /\b(video|movie|clip|animation)\b/i
            .test(
                text
            )

    );

}


function cleanVideoPrompt(
    text
) {


    return text

        .replace(
            /^(create|generate|make|design|show)\s+/i,
            ""
        )

        .replace(
            /^(an?|the)\s+/i,
            ""
        )

        .replace(
            /\b(video|movie|clip|animation)\b/gi,
            ""
        )

        .replace(
            /^\s*of\s+/i,
            ""
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        ||

        "a cinematic futuristic scene";

}



/* ============================================================
   LOCAL AI
============================================================ */

async function answerWithLocalAI(

    message,

    source

) {


    let live =
        null;


    state.busy =
        true;


    try {


        live =
            createLiveAssistantBubble(
                "Preparing local AI…"
            );


        const engine =
            await getAIEngine(

                (label) => {

                    live?.update(
                        label
                    );

                }

            );


        live.update(
            "Thinking…"
        );


        const chat =
            getCurrentChat();


        const history =
            (
                chat?.messages ||
                []
            )

            .filter(

                (item) =>
                    item.type ===
                    "text"

            )

            .slice(
                -16
            )

            .map(

                (item) => ({

                    role:
                        item.role,

                    content:
                        item.content

                })

            );


        const systemPrompt =
`You are GALAXY, a helpful multilingual AI assistant created by Harshavardhan.

Answer in the same language as the user's latest message unless they request another language.

If the user writes Tamil, answer naturally in Tamil.

You can answer in English, Tamil, Hindi, Arabic, French, Spanish and other languages supported by your local model.

Be accurate, clear and helpful.

If anyone asks who created GALAXY, say Harshavardhan created GALAXY.

Do not pretend you have live internet, live weather or private data when you do not.`;


        const stream =
            await engine
                .chat
                .completions
                .create({

                    messages: [

                        {

                            role:
                                "system",

                            content:
                                systemPrompt

                        },

                        ...history

                    ],

                    stream:
                        true,

                    temperature:
                        0.65,

                    max_tokens:
                        1200

                });


        let output =
            "";


        for await (
            const chunk
            of stream
        ) {


            output +=

                chunk
                    ?.choices
                    ?.[0]
                    ?.delta
                    ?.content

                ||

                "";


            live.update(

                output ||

                "Thinking…"

            );

        }


        live.remove();


        const finalText =
            output.trim()

            ||

            "I could not generate an answer.";


        addAssistantMessage(
            finalText
        );


        setStatus(
            "Ready"
        );


        if (
            source === "voice"
        ) {

            speakText(
                finalText
            );

        }

    }

    catch (
        error
    ) {


        console.error(
            error
        );


        live?.remove();


        const fallback =
            offlineFallback(
                message
            );


        addAssistantMessage(

            fallback

            ||

            "The local AI could not start. Use a recent WebGPU-capable Chrome or Edge browser and allow the model download to finish."

        );


        setStatus(
            "AI unavailable"
        );

    }

    finally {

        state.busy =
            false;

    }

}



/* ============================================================
   AI MODEL
============================================================ */

async function getAIEngine(
    onProgress
) {


    if (
        state.aiEngine
    ) {

        return state.aiEngine;

    }


    if (
        !navigator.gpu
    ) {

        throw new Error(
            "WebGPU unavailable"
        );

    }


    while (
        state.aiLoading
    ) {

        await delay(
            150
        );

    }


    state.aiLoading =
        true;


    try {


        const webllm =
            await import(
                TEXT_MODULE_URL
            );


        const memory =
            Number(
                navigator.deviceMemory ||
                4
            );


        const candidates =

            memory >= 8

            ?

            [

                "Llama-3.2-3B-Instruct-q4f16_1-MLC",

                "Llama-3.2-1B-Instruct-q4f16_1-MLC"

            ]

            :

            [

                "Llama-3.2-1B-Instruct-q4f16_1-MLC",

                "Llama-3.2-1B-Instruct-q4f32_1-MLC"

            ];


        let lastError =
            null;


        for (
            const modelId
            of candidates
        ) {


            try {


                state.aiModelId =
                    modelId;


                state.aiEngine =
                    await webllm
                        .CreateMLCEngine(

                            modelId,

                            {

                                initProgressCallback:

                                    (report) => {


                                        const percent =

                                            typeof report.progress ===
                                            "number"

                                            ?

                                            Math.round(
                                                report.progress *
                                                100
                                            )

                                            :

                                            null;


                                        const label =

                                            percent !== null

                                            ?

                                            `Downloading AI ${percent}%`

                                            :

                                            "Loading AI…";


                                        setStatus(
                                            label
                                        );


                                        setModelStatus(
                                            label
                                        );


                                        onProgress?.(
                                            label
                                        );

                                    }

                            }

                        );


                setModelStatus(

                    modelId.includes(
                        "3B"
                    )

                    ?

                    "Local AI · 3B"

                    :

                    "Local AI · 1B"

                );


                return state.aiEngine;

            }

            catch (
                error
            ) {


                lastError =
                    error;


                state.aiEngine =
                    null;

            }

        }


        throw lastError;

    }

    finally {

        state.aiLoading =
            false;

    }

}



/* ============================================================
   IMAGE GENERATION
============================================================ */

async function handleImageGeneration(

    prompt,

    source

) {


    let live =
        null;


    state.busy =
        true;


    try {


        live =
            createLiveAssistantBubble(
                "Preparing image generator…"
            );


        const imageBlob =
            await generateImageBlob(

                prompt,

                (label) => {

                    live?.update(
                        label
                    );

                }

            );


        live.remove();


        const mediaId =
            await saveMediaBlob(

                imageBlob,

                imageBlob.type ||
                "image/png"

            );


        addMessage(

            "assistant",

            `Generated image: ${prompt}`,

            {

                type:
                    "image",

                mediaId:
                    mediaId

            }

        );


        setStatus(
            "Ready"
        );

    }

    catch (
        error
    ) {


        live?.remove();


        addAssistantMessage(

            "Image generation could not run on this device. It requires WebGPU and enough GPU memory."

        );


        setStatus(
            "Image unavailable"
        );

    }

    finally {

        state.busy =
            false;

    }

}



/* ============================================================
   IMAGE MODEL
============================================================ */

async function getImageClient(
    onProgress
) {


    if (

        state.imageClient

        &&

        state.imageModelLoaded

    ) {

        return state.imageClient;

    }


    const module =
        await import(
            IMAGE_MODULE_URL
        );


    state.imageClient =
        state.imageClient

        ||

        module
            .Txt2ImgWorkerClient
            .createDefault();


    const capabilities =
        await state.imageClient
            .detect();


    if (
        !capabilities.webgpu
    ) {

        throw new Error(
            "WebGPU unavailable"
        );

    }


    const loadResult =
        await state.imageClient
            .load(

                "sd-turbo",

                {

                    backendPreference:
                        [
                            "webgpu"
                        ]

                },

                (progress) => {


                    const label =

                        progress?.message

                        ||

                        "Downloading image model…";


                    setStatus(
                        label
                    );


                    onProgress?.(
                        label
                    );

                }

            );


    if (
        !loadResult?.ok
    ) {

        throw new Error(
            "Image model failed"
        );

    }


    state.imageModelLoaded =
        true;


    return state.imageClient;

}



/* ============================================================
   GENERATE IMAGE BLOB
============================================================ */

async function generateImageBlob(

    prompt,

    onProgress

) {


    const client =
        await getImageClient(
            onProgress
        );


    const job =
        client.generate(

            {

                prompt:
                    prompt,

                seed:
                    Math.floor(
                        Math.random() *
                        2_000_000_000
                    ),

                width:
                    512,

                height:
                    512

            },

            (event) => {


                const label =
                    event?.phase

                    ?

                    `Generating image · ${event.phase}`

                    :

                    "Generating image…";


                onProgress?.(
                    label
                );

            },

            {

                busyPolicy:
                    "queue",

                debounceMs:
                    100

            }

        );


    const result =
        await job.promise;


    if (
        !result?.ok
        ||
        !result.blob
    ) {

        throw new Error(
            "Image generation failed"
        );

    }


    return result.blob;

}



/* ============================================================
   VIDEO
============================================================ */

async function handleVideoGeneration(

    prompt,

    source

) {


    let live =
        null;


    state.busy =
        true;


    try {


        live =
            createLiveAssistantBubble(
                "Preparing AI scene…"
            );


        const imageBlob =
            await generateImageBlob(

                prompt,

                (label) => {

                    live?.update(
                        label
                    );

                }

            );


        live.update(
            "Creating motion video…"
        );


        const videoBlob =
            await createMotionVideo(
                imageBlob
            );


        live.remove();


        const mediaId =
            await saveMediaBlob(

                videoBlob,

                "video/webm"

            );


        addMessage(

            "assistant",

            `Generated motion video: ${prompt}`,

            {

                type:
                    "video",

                mediaId:
                    mediaId

            }

        );


        setStatus(
            "Ready"
        );

    }

    catch (
        error
    ) {


        live?.remove();


        addAssistantMessage(

            "The video could not be created. GALAXY currently makes a short motion video from an AI-generated image."

        );


        setStatus(
            "Video unavailable"
        );

    }

    finally {

        state.busy =
            false;

    }

}



/* ============================================================
   MOTION VIDEO
============================================================ */

async function createMotionVideo(
    imageBlob
) {


    const bitmap =
        await createImageBitmap(
            imageBlob
        );


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        768;


    canvas.height =
        432;


    const ctx =
        canvas.getContext(
            "2d"
        );


    const stream =
        canvas.captureStream(
            30
        );


    const recorder =
        new MediaRecorder(
            stream
        );


    const chunks =
        [];


    recorder.ondataavailable =
        (event) => {

            if (
                event.data.size
            ) {

                chunks.push(
                    event.data
                );

            }

        };


    const stopped =
        new Promise(

            (resolve) => {

                recorder.onstop =
                    resolve;

            }

        );


    recorder.start();


    const start =
        performance.now();


    await new Promise(

        (resolve) => {


            function frame(
                now
            ) {


                const progress =
                    Math.min(

                        1,

                        (
                            now -
                            start
                        )

                        /

                        6000

                    );


                const scale =
                    1.02 +
                    progress *
                    0.12;


                const sw =
                    bitmap.width /
                    scale;


                const sh =
                    bitmap.height /
                    scale;


                ctx.clearRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );


                ctx.drawImage(

                    bitmap,

                    (
                        bitmap.width -
                        sw
                    ) / 2,

                    (
                        bitmap.height -
                        sh
                    ) / 2,

                    sw,
                    sh,

                    0,
                    0,

                    canvas.width,
                    canvas.height

                );


                if (
                    progress <
                    1
                ) {

                    requestAnimationFrame(
                        frame
                    );

                }

                else {

                    resolve();

                }

            }


            requestAnimationFrame(
                frame
            );

        }

    );


    recorder.stop();


    await stopped;


    bitmap.close();


    return new Blob(

        chunks,

        {
            type:
                "video/webm"
        }

    );

}



/* ============================================================
   FALLBACK
============================================================ */

function offlineFallback(
    message
) {


    if (
        /[\u0B80-\u0BFF]/
            .test(
                message
            )
    ) {

        return (
            "ஆம், GALAXY தமிழைப் புரிந்துகொள்ள முயலும். உள்ளூர் AI மாதிரி பதிவிறக்கம் செய்யப்பட்டால் தமிழில் விரிவாக பதிலளிக்க முடியும்."
        );

    }


    return null;

}



/* ============================================================
   RESPONSE
============================================================ */

function respond(

    text,

    source =
        "typed"

) {


    addAssistantMessage(
        text
    );


    setStatus(
        "Ready"
    );


    if (
        source ===
        "voice"
    ) {

        speakText(
            text
        );

    }

}



/* ============================================================
   CHAT STORAGE
============================================================ */

function loadChats() {


    try {


        state.chats =

            JSON.parse(

                localStorage.getItem(
                    CHAT_KEY
                )

            )

            ||

            [];

    }

    catch {


        state.chats =
            [];

    }


    state.currentChatId =

        localStorage.getItem(
            CURRENT_CHAT_KEY
        )

        ||

        null;

}


function saveChats() {


    localStorage.setItem(

        CHAT_KEY,

        JSON.stringify(
            state.chats
        )

    );


    if (
        state.currentChatId
    ) {

        localStorage.setItem(

            CURRENT_CHAT_KEY,

            state.currentChatId

        );

    }

}



/* ============================================================
   CHAT CREATION
============================================================ */

function ensureCurrentChat() {


    if (
        !state.chats.length
    ) {

        createNewChat(
            true
        );

        return;

    }


    if (

        !state.chats.some(

            (chat) =>
                chat.id ===
                state.currentChatId

        )

    ) {

        state.currentChatId =
            state.chats[0].id;

    }

}


function createNewChat(
    silent = false
) {


    const chat = {

        id:
            `chat_${Date.now()}`,

        title:
            "New conversation",

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

        els.userInput
            ?.focus();

    }

}



/* ============================================================
   MESSAGES
============================================================ */

function getCurrentChat() {


    return (

        state.chats.find(

            (chat) =>
                chat.id ===
                state.currentChatId

        )

        ||

        null

    );

}


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

    content,

    extra = {}

) {


    const chat =
        getCurrentChat();


    if (!chat) {

        return;

    }


    chat.messages.push({

        role:
            role,

        content:
            content,

        type:
            extra.type ||
            "text",

        mediaId:
            extra.mediaId ||
            null,

        createdAt:
            Date.now()

    });


    if (

        role === "user"

        &&

        chat.title ===
        "New conversation"

    ) {

        chat.title =
            content === "123"

            ?

            "Galaxy access"

            :

            content
                .slice(
                    0,
                    34
                );

    }


    chat.updatedAt =
        Date.now();


    saveChats();

    renderRecentChats();

    renderCurrentChat();

}



/* ============================================================
   RECENTS
============================================================ */

function renderRecentChats() {


    if (
        !els.recentChats
    ) {

        return;

    }


    els.recentChats.innerHTML =
        "";


    state.chats.forEach(

        (chat) => {


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "recent-item";


            item.innerHTML = `

                <div class="chat-icon"></div>

                <div>

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

                    renderCurrentChat();

                    renderRecentChats();

                }

            );


            item.addEventListener(

                "contextmenu",

                (event) => {


                    event.preventDefault();


                    if (
                        confirm(
                            "Delete this conversation?"
                        )
                    ) {

                        deleteChat(
                            chat.id
                        );

                    }

                }

            );


            els.recentChats.appendChild(
                item
            );

        }

    );

}



/* ============================================================
   DELETE
============================================================ */

function deleteChat(
    id
) {


    state.chats =
        state.chats.filter(

            (chat) =>
                chat.id !==
                id

        );


    if (
        !state.chats.length
    ) {

        state.currentChatId =
            null;


        createNewChat(
            true
        );

        return;

    }


    state.currentChatId =
        state.chats[0].id;


    saveChats();

    renderRecentChats();

    renderCurrentChat();

}


function clearEveryChat() {


    if (
        !confirm(
            "Clear all conversations?"
        )
    ) {

        return;

    }


    localStorage.removeItem(
        CHAT_KEY
    );


    localStorage.removeItem(
        CURRENT_CHAT_KEY
    );


    state.chats =
        [];


    state.currentChatId =
        null;


    createNewChat(
        true
    );

}



/* ============================================================
   RENDER CHAT
============================================================ */

function renderCurrentChat() {


    const chat =
        getCurrentChat();


    els.chatArea.innerHTML =
        "";


    if (

        !chat

        ||

        !chat.messages.length

    ) {


        els.heroArea.style.display =
            "flex";


        els.chatArea
            .classList
            .remove(
                "active"
            );


        return;

    }


    els.heroArea.style.display =
        "none";


    els.chatArea
        .classList
        .add(
            "active"
        );


    chat.messages.forEach(

        (message) => {


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                `message-row ${message.role}`;


            row.innerHTML = `

                <div class="message-avatar">
                    ${
                        message.role ===
                        "assistant"
                        ?
                        "G"
                        :
                        "U"
                    }
                </div>

                <div class="message-bubble">

                    <div class="message-name">
                        ${
                            message.role ===
                            "assistant"
                            ?
                            "GALAXY"
                            :
                            "You"
                        }
                    </div>

                    <div class="message-text">
                        ${escapeHTML(message.content)}
                    </div>

                </div>

            `;


            if (
                message.mediaId
            ) {


                const holder =
                    document.createElement(
                        "div"
                    );


                holder.className =
                    "media-holder";


                row
                    .querySelector(
                        ".message-bubble"
                    )
                    .appendChild(
                        holder
                    );


                restoreMedia(

                    message.mediaId,

                    message.type,

                    holder

                );

            }


            els.chatArea.appendChild(
                row
            );

        }

    );


    els.chatArea.scrollTop =
        els.chatArea.scrollHeight;

}



/* ============================================================
   LIVE MESSAGE
============================================================ */

function createLiveAssistantBubble(
    text
) {


    els.heroArea.style.display =
        "none";


    els.chatArea
        .classList
        .add(
            "active"
        );


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "message-row assistant";


    row.innerHTML = `

        <div class="message-avatar">
            G
        </div>

        <div class="message-bubble">

            <div class="message-name">
                GALAXY
            </div>

            <div class="message-text">
            </div>

        </div>

    `;


    const message =
        row.querySelector(
            ".message-text"
        );


    message.textContent =
        text;


    els.chatArea.appendChild(
        row
    );


    return {

        update(
            value
        ) {

            message.textContent =
                value;

        },

        remove() {

            row.remove();

        }

    };

}



/* ============================================================
   CLOCK
============================================================ */

function updateClock() {


    const now =
        new Date();


    els.clockTime.textContent =
        now.toLocaleTimeString();


    els.clockDate.textContent =
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


function updateGreeting() {


    const hour =
        new Date()
            .getHours();


    els.greetingText.textContent =

        hour <
        12

        ?

        "Good morning"

        :

        hour <
        17

        ?

        "Good afternoon"

        :

        "Good evening";

}



/* ============================================================
   STATUS
============================================================ */

function setStatus(
    value
) {

    if (
        els.statusText
    ) {

        els.statusText.textContent =
            value;

    }

}


function setModelStatus(
    value
) {

    if (
        els.modelStatus
    ) {

        els.modelStatus.textContent =
            value;

    }

}



/* ============================================================
   INPUT
============================================================ */

function resizeInput() {


    els.userInput.style.height =
        "auto";


    els.userInput.style.height =
        `${Math.min(
            els.userInput.scrollHeight,
            125
        )}px`;

}



/* ============================================================
   VOICE
============================================================ */

function prepareVoiceActivation() {


    const begin =
        () => {


            if (
                !state.voiceStarted
            ) {

                startVoiceRecognition();

            }


            document.removeEventListener(
                "click",
                begin
            );

        };


    document.addEventListener(
        "click",
        begin
    );

}


function startVoiceRecognition() {


    const Recognition =

        window.SpeechRecognition

        ||

        window.webkitSpeechRecognition;


    if (
        !Recognition
    ) {

        return;

    }


    const recognition =
        new Recognition();


    state.recognition =
        recognition;


    state.voiceStarted =
        true;


    recognition.continuous =
        true;


    recognition.interimResults =
        false;


    recognition.lang =
        navigator.language ||
        "en-US";


    recognition.onresult =
        (event) => {


            const transcript =
                event
                    .results[
                        event.results.length -
                        1
                    ][0]
                    .transcript;


            const lower =
                transcript
                    .toLowerCase();


            const index =
                lower.indexOf(
                    "galaxy"
                );


            if (
                index === -1
            ) {

                return;

            }


            const command =
                transcript
                    .slice(
                        index +
                        6
                    )
                    .trim();


            if (
                command
            ) {

                processMessage(

                    command,

                    {
                        source:
                            "voice"
                    }

                );

            }

        };


    recognition.onend =
        () => {


            if (
                state.voiceStarted
            ) {

                try {

                    recognition.start();

                }

                catch {
                }

            }

        };


    try {

        recognition.start();

    }

    catch {
    }

}


function restartVoiceRecognition() {


    try {

        state.recognition
            ?.stop();

    }

    catch {
    }


    state.voiceStarted =
        false;


    setTimeout(
        startVoiceRecognition,
        500
    );

}


function speakText(
    text
) {


    if (
        !window.speechSynthesis
    ) {

        return;

    }


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speechSynthesis.speak(
        speech
    );

}



/* ============================================================
   MEDIA STORAGE
============================================================ */

function openMediaDB() {


    return new Promise(

        (
            resolve,
            reject
        ) => {


            const request =
                indexedDB.open(

                    "galaxy_media_v3",

                    1

                );


            request.onupgradeneeded =
                () => {


                    if (

                        !request
                            .result
                            .objectStoreNames
                            .contains(
                                "media"
                            )

                    ) {

                        request
                            .result
                            .createObjectStore(

                                "media",

                                {
                                    keyPath:
                                        "id"
                                }

                            );

                    }

                };


            request.onsuccess =
                () =>
                    resolve(
                        request.result
                    );


            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        }

    );

}


async function saveMediaBlob(
    blob,
    mime
) {


    const id =
        `media_${Date.now()}_${Math.random()}`;


    const db =
        await openMediaDB();


    const tx =
        db.transaction(

            "media",

            "readwrite"

        );


    tx
        .objectStore(
            "media"
        )
        .put({

            id:
                id,

            blob:
                blob,

            mime:
                mime

        });


    await new Promise(

        (resolve) => {

            tx.oncomplete =
                resolve;

        }

    );


    db.close();


    return id;

}


async function restoreMedia(

    id,

    type,

    holder

) {


    const db =
        await openMediaDB();


    const tx =
        db.transaction(

            "media",

            "readonly"

        );


    const request =
        tx
            .objectStore(
                "media"
            )
            .get(
                id
            );


    request.onsuccess =
        () => {


            if (
                !request.result
            ) {

                return;

            }


            const url =
                URL.createObjectURL(
                    request.result.blob
                );


            const element =
                document.createElement(

                    type === "video"

                    ?

                    "video"

                    :

                    "img"

                );


            element.src =
                url;


            element.className =
                "generated-media";


            if (
                type === "video"
            ) {

                element.controls =
                    true;

            }


            holder.appendChild(
                element
            );

        };

}



/* ============================================================
   UTILS
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
        );

}


function relativeTime(
    time
) {


    const minutes =
        Math.floor(

            (
                Date.now() -
                time
            )

            /

            60000

        );


    if (
        minutes <
        1
    ) {

        return "Just now";

    }


    if (
        minutes <
        60
    ) {

        return `${minutes} min ago`;

    }


    return new Date(
        time
    )
    .toLocaleDateString();

}


function delay(
    ms
) {


    return new Promise(

        (resolve) =>
            setTimeout(
                resolve,
                ms
            )

    );

}
