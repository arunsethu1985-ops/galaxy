const CHAT_KEY = "galaxy_chats_v6";
const CURRENT_CHAT_KEY = "galaxy_current_chat_v6";


// ============================================================
// MODEL SOURCES
// ============================================================

const TEXT_MODULE_URL =
    "https://esm.run/@mlc-ai/web-llm";


const IMAGE_MODULE_URL =
    "https://cdn.jsdelivr.net/npm/web-txt2img@0.3.1/+esm";



// ============================================================
// STATE
// ============================================================

const state = {

    chats:
        [],

    currentChatId:
        null,

    /*
     * IMPORTANT:
     * Game Center unlock is NEVER stored.
     *
     * Refresh GALAXY:
     * locked again.
     */

    gameCenterUnlocked:
        false,


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
        false

};



// ============================================================
// ELEMENT SHORTCUT
// ============================================================

const $ =
    id =>
        document.getElementById(
            id
        );



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



// ============================================================
// GAME LIBRARY
// ============================================================

const GAME_LIBRARY = [

    [
        "🏎️",
        "Racing",
        "Cars, drifting and speed challenges.",
        "racing games play online"
    ],

    [
        "⚽",
        "Football",
        "Football matches and skill games.",
        "football games play online"
    ],

    [
        "🐉",
        "Creature Survival",
        "Creature collecting and survival worlds.",
        "creature survival games online"
    ],

    [
        "🐒",
        "Mythic Action",
        "Mythology, warriors and boss battles.",
        "mythology action games online"
    ],

    [
        "🧱",
        "Block Worlds",
        "Creative multiplayer worlds and obstacle games.",
        "block multiplayer games online"
    ],

    [
        "👥",
        "Multiplayer",
        "Online games with other players.",
        "multiplayer browser games online"
    ],

    [
        "🧩",
        "Puzzle",
        "Logic and brain challenges.",
        "puzzle games play online"
    ],

    [
        "🚀",
        "Space",
        "Space adventures and cosmic battles.",
        "space games play online"
    ],

    [
        "🗺️",
        "Adventure",
        "Quests, exploration and stories.",
        "adventure games play online"
    ]

];



// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initGalaxy
);



function initGalaxy() {

    /*
     * Game Center ALWAYS starts hidden.
     */

    state.gameCenterUnlocked =
        false;


    els.gameCenterItem
        .classList
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
            ? "Local AI available"
            : "WebGPU unavailable"
    );


    prepareVoiceActivation();

}



// ============================================================
// EVENTS
// ============================================================

function bindEvents() {


    els.newChatRow
        .addEventListener(
            "click",
            () =>
                createNewChat()
        );


    els.sendControl
        .addEventListener(
            "click",
            sendInputMessage
        );


    els.userInput
        .addEventListener(
            "input",
            resizeInput
        );


    els.userInput
        .addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
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
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        processMessage(
                            card.dataset.prompt || "",
                            {
                                source:
                                    "quick"
                            }
                        );

                    }
                );

            }
        );


    els.gameCenterItem
        .addEventListener(
            "click",
            openGameCenter
        );


    els.leaveGameCenter
        .addEventListener(
            "click",
            closeGameCenter
        );


    els.menuToggle
        .addEventListener(
            "click",
            () => {

                els.sidebar
                    .classList
                    .toggle(
                        "open"
                    );

            }
        );


    els.settingsRow
        .addEventListener(
            "click",
            () => {

                els.settingsModal
                    .classList
                    .remove(
                        "hidden-modal"
                    );

            }
        );


    els.closeSettings
        .addEventListener(
            "click",
            () => {

                els.settingsModal
                    .classList
                    .add(
                        "hidden-modal"
                    );

            }
        );


    els.clearAllChats
        .addEventListener(
            "click",
            clearEveryChat
        );


    els.clearRecentText
        .addEventListener(
            "click",
            clearEveryChat
        );


    els.restartVoice
        .addEventListener(
            "click",
            restartVoiceRecognition
        );


    els.settingsModal
        .addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    els.settingsModal
                ) {

                    els.settingsModal
                        .classList
                        .add(
                            "hidden-modal"
                        );

                }

            }
        );

}



// ============================================================
// SEND MESSAGE
// ============================================================

function sendInputMessage() {

    const text =
        els.userInput
            .value
            .trim();


    if (!text) {

        return;

    }


    els.userInput.value =
        "";


    resizeInput();


    processMessage(
        text,
        {
            source:
                "typed"
        }
    );

}



// ============================================================
// MAIN MESSAGE PROCESSOR
// ============================================================

async function processMessage(
    message,
    {
        source = "typed"
    } = {}
) {


    addUserMessage(
        message
    );


    setStatus(
        "Thinking..."
    );



    /*
     * ========================================================
     * SECRET GAME CENTER
     *
     * Only TYPED input unlocks it.
     *
     * Voice cannot unlock it.
     * Quick cards cannot unlock it.
     * ========================================================
     */

    if (
        source === "typed" &&
        message
            .trim()
            .toLowerCase()
        ===
        "harshavardhan"
    ) {

        unlockGameCenter();

        return;

    }



    const lower =
        message
            .trim()
            .toLowerCase();



    /*
     * GAME CENTER COMMAND
     */

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



    /*
     * CREATOR
     */

    if (
        isCreatorQuestion(
            lower
        )
    ) {

        respond(
            "Harshavardhan is the creator of GALAXY.",
            source
        );

        return;

    }



    /*
     * WEATHER
     *
     * Don't let the local model invent
     * live weather.
     */

    if (
        isWeatherQuestion(
            lower
        )
    ) {

        respond(
            "Live weather needs a weather-data provider. This local-only GALAXY build does not guess current weather.",
            source
        );

        return;

    }



    /*
     * CALCULATOR
     */

    const calculation =
        calculate(
            message
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



    /*
     * IMAGE GENERATION
     */

    if (
        isImageCommand(
            lower
        )
    ) {

        await handleImageGeneration(
            cleanImagePrompt(
                message
            ),
            source
        );

        return;

    }



    /*
     * VIDEO GENERATION
     */

    if (
        isVideoCommand(
            lower
        )
    ) {

        await handleVideoGeneration(
            cleanVideoPrompt(
                message
            ),
            source
        );

        return;

    }



    /*
     * EVERYTHING ELSE:
     *
     * Real downloadable local AI.
     */

    await answerWithLocalAI(
        message,
        source
    );

}



// ============================================================
// SECRET GAME CENTER
// ============================================================

function unlockGameCenter() {

    if (
        !state.gameCenterUnlocked
    ) {

        state.gameCenterUnlocked =
            true;


        els.gameCenterItem
            .classList
            .remove(
                "hidden-game-center"
            );

    }


    respond(
        "🎮 Game Center unlocked. It is now visible in the sidebar.",
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


    els.normalView.style.display =
        "none";


    els.gameCenterView
        .classList
        .add(
            "active"
        );


    els.composerWrap.style.display =
        "none";


    setStatus(
        "Game Center"
    );


    els.sidebar
        .classList
        .remove(
            "open"
        );

}



function closeGameCenter() {

    els.gameCenterView
        .classList
        .remove(
            "active"
        );


    els.normalView.style.display =
        "block";


    els.composerWrap.style.display =
        "block";


    renderCurrentChat();


    setStatus(
        "Ready"
    );

}



/* ============================================================
   GAME CARDS
============================================================ */

function renderGameCenter() {

    els.gameGrid.innerHTML =
        "";


    GAME_LIBRARY.forEach(
        (
            [
                emoji,
                name,
                description,
                query
            ]
        ) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "game-card";


            card.innerHTML = `

                <div class="game-emoji">
                    ${emoji}
                </div>

                <h3>
                    ${escapeHTML(name)}
                </h3>

                <p>
                    ${escapeHTML(description)}
                </p>

            `;


            card.addEventListener(
                "click",
                () => {

                    window.open(

                        "https://www.google.com/search?q=" +
                        encodeURIComponent(
                            query
                        ),

                        "_blank",

                        "noopener,noreferrer"

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
   LOCAL AI ANSWER
============================================================ */

async function answerWithLocalAI(
    message,
    source
) {

    let live =
        null;


    try {

        live =
            createLiveAssistantBubble(
                "Preparing local AI…"
            );


        const engine =
            await getAIEngine(
                label => {

                    live.update(
                        label
                    );

                }
            );


        live.update(
            "Thinking…"
        );



        const chat =
            getCurrentChat();



        /*
         * Send recent chat history
         * so follow-up questions work.
         */

        const history =
            (
                chat?.messages ||
                []
            )

            .filter(
                m =>
                    m.type ===
                    "text"
            )

            .slice(
                -14
            )

            .map(
                m => ({

                    role:
                        m.role,

                    content:
                        m.content

                })
            );



        const systemPrompt =
`You are GALAXY, a helpful multilingual assistant created by Harshavardhan.

Respond in the same language the user uses unless they ask for another language.

You can answer in Tamil, English, Hindi, Arabic, French and other languages supported by your model.

Be accurate, helpful and clear.

If anyone asks who created GALAXY, say Harshavardhan created GALAXY.

Do not claim to have live weather or live web access unless a tool actually provides it.`;



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
                        1000

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
            output.trim() ||
            "I couldn't generate an answer.";



        addAssistantMessage(
            finalText
        );


        setStatus(
            "Ready"
        );


        if (
            source ===
            "voice"
        ) {

            speakText(
                finalText
            );

        }

    }

    catch (
        error
    ) {

        if (
            live
        ) {

            live.remove();

        }


        console.error(
            error
        );


        const message =
            navigator.gpu

            ?
            "I couldn't load the local AI model on this device. Try refreshing, using a recent Chrome or Edge browser, and make sure hardware acceleration is enabled."

            :
            "This browser does not provide WebGPU, so the downloadable local AI cannot run here. Try a recent WebGPU-capable browser.";


        addAssistantMessage(
            message
        );


        setStatus(
            "AI unavailable"
        );


        if (
            source ===
            "voice"
        ) {

            speakText(
                message
            );

        }

    }

}



/* ============================================================
   DOWNLOAD / LOAD LOCAL AI
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
            "WEBGPU unavailable"
        );

    }



    /*
     * Another call may already
     * be downloading the model.
     */

    while (
        state.aiLoading
    ) {

        await delay(
            100
        );

    }


    if (
        state.aiEngine
    ) {

        return state.aiEngine;

    }



    state.aiLoading =
        true;


    try {

        const webllm =
            await import(
                TEXT_MODULE_URL
            );


        /*
         * Automatically use a stronger
         * model on more capable devices.
         */

        const memory =
            Number(
                navigator.deviceMemory ||
                4
            );


        const candidates =
            memory >= 8

            ?
            [

                "Qwen2.5-3B-Instruct-q4f16_1-MLC",

                "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"

            ]

            :
            [

                "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",

                "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"

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


                setModelStatus(
                    "Downloading local AI…"
                );



                state.aiEngine =
                    await webllm
                        .CreateMLCEngine(

                            modelId,

                            {

                                initProgressCallback:
                                    report => {

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
                                            percent !==
                                            null

                                            ?
                                            `Downloading AI ${percent}%`

                                            :
                                            "Loading local AI…";


                                        setStatus(
                                            label
                                        );


                                        setModelStatus(
                                            label
                                        );


                                        if (
                                            onProgress
                                        ) {

                                            onProgress(
                                                label
                                            );

                                        }

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
                    "Local AI · Lite"

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


        throw (
            lastError ||
            new Error(
                "AI model load failed"
            )
        );

    }

    finally {

        state.aiLoading =
            false;

    }

}



/* ============================================================
   IMAGE COMMAND RECOGNITION

   These now work:

   create a modern city picture

   generate an image of a dragon

   make a futuristic car photo

   draw a space station
============================================================ */

function isImageCommand(
    text
) {

    const mediaWord =
        /\b(image|picture|photo|wallpaper|poster|artwork|illustration)\b/i
        .test(
            text
        );


    const createWord =
        /^(create|generate|make|draw|paint|design)\b/i
        .test(
            text
        );


    return (

        /^draw\b/i.test(
            text
        )

        ||

        (
            mediaWord &&
            createWord
        )

    );

}



function cleanImagePrompt(
    text
) {

    return text

        .replace(
            /^(create|generate|make|design|paint)\s+(an?\s+)?/i,
            ""
        )

        .replace(
            /^draw\s+/i,
            ""
        )

        .replace(
            /\b(image|picture|photo|wallpaper|poster|artwork|illustration)\b/gi,
            ""
        )

        .replace(
            /^of\s+/i,
            ""
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        ||

        "a beautiful futuristic scene";

}



/* ============================================================
   VIDEO COMMAND
============================================================ */

function isVideoCommand(
    text
) {

    return (

        /^(create|generate|make|design)\b/i
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
            /^(create|generate|make|design)\s+(a\s+)?/i,
            ""
        )

        .replace(
            /\b(video|movie|clip|animation)\b/gi,
            ""
        )

        .replace(
            /^of\s+/i,
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
   IMAGE GENERATION
============================================================ */

async function handleImageGeneration(
    prompt,
    source
) {

    const live =
        createLiveAssistantBubble(
            "Preparing image generator…"
        );


    try {

        const blob =
            await generateImageBlob(

                prompt,

                label => {

                    live.update(
                        label
                    );

                }

            );


        live.remove();



        /*
         * Save image in IndexedDB so it
         * can remain in that conversation.
         */

        const mediaId =
            await saveMediaBlob(
                blob,
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


        if (
            source ===
            "voice"
        ) {

            speakText(
                "Your image is ready."
            );

        }

    }

    catch (
        error
    ) {

        live.remove();


        console.error(
            error
        );


        const message =
            "Image generation could not run on this device. It needs WebGPU and enough GPU memory. The first use also downloads the image model.";


        addAssistantMessage(
            message
        );


        setStatus(
            "Image unavailable"
        );


        if (
            source ===
            "voice"
        ) {

            speakText(
                message
            );

        }

    }

}



/* ============================================================
   DOWNLOAD / LOAD IMAGE MODEL
============================================================ */

async function getImageClient(
    onProgress
) {

    if (
        state.imageClient &&
        state.imageModelLoaded
    ) {

        return state.imageClient;

    }


    if (
        !navigator.gpu
    ) {

        throw new Error(
            "WEBGPU unavailable"
        );

    }



    if (
        !state.imageClient
    ) {

        const module =
            await import(
                IMAGE_MODULE_URL
            );


        state.imageClient =
            module
                .Txt2ImgWorkerClient
                .createDefault();

    }



    const capabilities =
        await state.imageClient
            .detect();



    if (
        !capabilities.webgpu
    ) {

        throw new Error(
            "WebGPU unavailable for image generation"
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

                progress => {

                    const percent =
                        progress?.pct !=
                        null

                        ?
                        ` ${Math.round(
                            progress.pct
                        )}%`

                        :
                        "";


                    const label =
                        `${progress?.message || "Downloading image model"}${percent}`;


                    setStatus(
                        label
                    );


                    if (
                        onProgress
                    ) {

                        onProgress(
                            label
                        );

                    }

                }

            );



    if (
        !loadResult?.ok
    ) {

        throw new Error(
            loadResult?.message ||
            "Image model load failed"
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


    const seed =
        Math.floor(
            Math.random() *
            2000000000
        );


    const job =
        client.generate(

            {

                prompt:
                    prompt,

                seed:
                    seed,

                width:
                    512,

                height:
                    512

            },

            event => {

                const label =
                    event?.phase

                    ?
                    `Generating image · ${event.phase}`

                    :
                    "Generating image…";


                setStatus(
                    label
                );


                if (
                    onProgress
                ) {

                    onProgress(
                        label
                    );

                }

            },

            {

                busyPolicy:
                    "queue",

                debounceMs:
                    0

            }

        );



    const result =
        await job.promise;



    if (
        !result?.ok ||
        !result.blob
    ) {

        throw new Error(
            result?.message ||
            "Image generation failed"
        );

    }


    return result.blob;

}



/* ============================================================
   VIDEO GENERATION

   IMPORTANT:

   This creates a REAL playable local
   WebM video.

   Process:

   text
      ↓
   AI image
      ↓
   animated canvas
      ↓
   WebM video

   This is not full cinematic
   video diffusion.
============================================================ */

async function handleVideoGeneration(
    prompt,
    source
) {

    const live =
        createLiveAssistantBubble(
            "Creating local AI video…"
        );


    try {

        const imageBlob =
            await generateImageBlob(

                prompt,

                label => {

                    live.update(
                        label
                    );

                }

            );


        live.update(
            "Animating the generated scene…"
        );



        const videoBlob =
            await createMotionVideo(
                imageBlob,
                prompt
            );



        live.remove();



        const mediaId =
            await saveMediaBlob(

                videoBlob,

                videoBlob.type ||
                "video/webm"

            );



        addMessage(

            "assistant",

            `Generated local motion video: ${prompt}`,

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


        if (
            source ===
            "voice"
        ) {

            speakText(
                "Your video is ready."
            );

        }

    }

    catch (
        error
    ) {

        live.remove();


        console.error(
            error
        );


        const message =
            "Video generation could not run on this device. This three-file build creates a short local motion video from an AI-generated image; it is not a full cinematic text-to-video diffusion model.";


        addAssistantMessage(
            message
        );


        setStatus(
            "Video unavailable"
        );


        if (
            source ===
            "voice"
        ) {

            speakText(
                message
            );

        }

    }

}



/* ============================================================
   CREATE PLAYABLE VIDEO
============================================================ */

async function createMotionVideo(
    imageBlob,
    prompt
) {

    if (
        !window.MediaRecorder
    ) {

        throw new Error(
            "MediaRecorder unsupported"
        );

    }



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


    const fps =
        30;


    const durationMs =
        6000;



    const stream =
        canvas.captureStream(
            fps
        );



    const mime =
        MediaRecorder
            .isTypeSupported(
                "video/webm;codecs=vp9"
            )

        ?
        "video/webm;codecs=vp9"

        :
        "video/webm";



    const recorder =
        new MediaRecorder(

            stream,

            {

                mimeType:
                    mime,

                videoBitsPerSecond:
                    4000000

            }

        );



    const chunks =
        [];


    recorder.ondataavailable =
        event => {

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
            resolve => {

                recorder.onstop =
                    resolve;

            }
        );



    recorder.start(
        250
    );



    const start =
        performance.now();



    await new Promise(
        resolve => {


            function frame(
                now
            ) {

                const t =
                    Math.min(

                        1,

                        (
                            now -
                            start
                        )

                        /
                        durationMs

                    );



                /*
                 * Slow cinematic zoom.
                 */

                const scale =
                    1.02 +
                    t *
                    0.12;



                const sourceRatio =
                    bitmap.width /
                    bitmap.height;


                const targetRatio =
                    canvas.width /
                    canvas.height;



                let sw =
                    bitmap.width;


                let sh =
                    bitmap.height;



                if (
                    sourceRatio >
                    targetRatio
                ) {

                    sw =
                        sh *
                        targetRatio;

                }

                else {

                    sh =
                        sw /
                        targetRatio;

                }



                sw /=
                    scale;


                sh /=
                    scale;



                const driftX =
                    Math.sin(
                        t *
                        Math.PI
                    )
                    *
                    bitmap.width
                    *
                    0.02;



                const sx =
                    (
                        bitmap.width -
                        sw
                    )
                    /
                    2
                    +
                    driftX;


                const sy =
                    (
                        bitmap.height -
                        sh
                    )
                    /
                    2;



                ctx.clearRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );



                ctx.drawImage(

                    bitmap,

                    sx,
                    sy,
                    sw,
                    sh,

                    0,
                    0,
                    canvas.width,
                    canvas.height

                );



                /*
                 * Cinematic tint.
                 */

                const gradient =
                    ctx.createLinearGradient(

                        0,
                        0,
                        0,
                        canvas.height

                    );


                gradient.addColorStop(
                    0,
                    "rgba(15,0,40,0.05)"
                );


                gradient.addColorStop(
                    1,
                    "rgba(0,0,15,0.28)"
                );


                ctx.fillStyle =
                    gradient;


                ctx.fillRect(

                    0,
                    0,
                    canvas.width,
                    canvas.height

                );



                /*
                 * Moving light particles.
                 */

                for (
                    let i = 0;
                    i < 22;
                    i++
                ) {

                    const x =
                        (
                            i *
                            97
                            +
                            t *
                            220
                            *
                            (
                                1 +
                                (
                                    i %
                                    3
                                )
                            )
                        )
                        %
                        canvas.width;


                    const y =
                        (
                            i *
                            53
                            +
                            Math.sin(
                                t *
                                6
                                +
                                i
                            )
                            *
                            24
                            +
                            canvas.height
                        )
                        %
                        canvas.height;


                    ctx.fillStyle =
                        `rgba(210,190,255,${
                            0.12 +
                            (
                                i %
                                4
                            )
                            *
                            0.04
                        })`;


                    ctx.beginPath();


                    ctx.arc(

                        x,
                        y,

                        1 +
                        (
                            i %
                            2
                        ),

                        0,

                        Math.PI *
                        2

                    );


                    ctx.fill();

                }



                if (
                    t <
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
                mime
        }

    );

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

        "who made galaxy",

        "creator of galaxy"

    ]

    .some(
        phrase =>
            text.includes(
                phrase
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
        /\b(weather|temperature|forecast|rain today|weather today)\b/i
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

        .replace(
            /\bx\b/g,
            "*"
        )

        .trim();



    if (
        !expression ||
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
                `"use strict";return (${expression})`
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
   RESPOND
============================================================ */

function respond(
    text,
    source = "typed"
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
            chat =>
                chat.id ===
                state.currentChatId
        )
    ) {

        state.currentChatId =
            state.chats[0].id;


        saveChats();

    }

}



function createNewChat(
    silent = false
) {

    const chat = {

        id:
            `chat_${Date.now()}_${
                Math.random()
                    .toString(36)
                    .slice(2, 7)
            }`,

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

        els.userInput.focus();

    }

}



/* ============================================================
   CURRENT CHAT
============================================================ */

function getCurrentChat() {

    return (

        state.chats.find(
            chat =>
                chat.id ===
                state.currentChatId
        )

        ||

        null

    );

}



/* ============================================================
   ADD MESSAGES
============================================================ */

function addUserMessage(
    content
) {

    return addMessage(
        "user",
        content
    );

}



function addAssistantMessage(
    content
) {

    return addMessage(
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

        return null;

    }



    const message = {

        id:
            `msg_${Date.now()}_${
                Math.random()
                    .toString(36)
                    .slice(2, 6)
            }`,

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

    };



    chat.messages.push(
        message
    );



    if (
        role ===
            "user"

        &&

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


    return message;

}



/* ============================================================
   CHAT TITLE
============================================================ */

function createTitle(
    content
) {

    /*
     * Do not show secret word
     * as recent chat title.
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


    const clean =
        content

        .replace(
            /\s+/g,
            " "
        )

        .trim();


    return (

        clean.length >
        34

        ?
        `${clean.slice(
            0,
            34
        )}…`

        :
        (
            clean ||
            "New conversation"
        )

    );

}



/* ============================================================
   RECENTS
============================================================ */

function renderRecentChats() {

    els.recentChats.innerHTML =
        "";


    [
        ...state.chats
    ]

    .sort(
        (
            a,
            b
        ) =>
            b.updatedAt -
            a.updatedAt
    )

    .forEach(
        chat => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                `recent-item${
                    chat.id ===
                    state.currentChatId
                    ?
                    " active"
                    :
                    ""
                }`;


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


                    els.sidebar
                        .classList
                        .remove(
                            "open"
                        );

                }
            );



            /*
             * RIGHT CLICK =
             * DELETE CHAT
             */

            item.addEventListener(
                "contextmenu",
                event => {

                    event.preventDefault();


                    if (
                        confirm(
                            `Delete "${chat.title}"?`
                        )
                    ) {

                        deleteChat(
                            chat.id
                        );

                    }

                }
            );


            els.recentChats
                .appendChild(
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
        state.chats
        .filter(
            chat =>
                chat.id !==
                id
        );


    if (
        !state.chats.length
    ) {

        state.currentChatId =
            null;


        localStorage
            .removeItem(
                CURRENT_CHAT_KEY
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
   CLEAR ALL
============================================================ */

function clearEveryChat() {

    if (
        !confirm(
            "Clear all conversations?"
        )
    ) {

        return;

    }


    localStorage
        .removeItem(
            CHAT_KEY
        );


    localStorage
        .removeItem(
            CURRENT_CHAT_KEY
        );


    state.chats =
        [];


    state.currentChatId =
        null;


    createNewChat(
        true
    );


    els.settingsModal
        .classList
        .add(
            "hidden-modal"
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
        !chat ||
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


    chat.messages
        .forEach(
            message => {

                els.chatArea
                    .appendChild(
                        makeMessageElement(
                            message
                        )
                    );

            }
        );


    requestAnimationFrame(
        () => {

            els.chatArea.scrollTop =
                els.chatArea.scrollHeight;

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
        ?
        "G"
        :
        "U";



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

        ?
        "GALAXY"

        :
        "You";



    const text =
        document.createElement(
            "div"
        );


    text.className =
        "message-text";


    text.textContent =
        message.content;



    bubble.append(
        name,
        text
    );



    /*
     * RESTORE GENERATED MEDIA
     */

    if (

        (
            message.type ===
            "image"

            ||

            message.type ===
            "video"
        )

        &&

        message.mediaId

    ) {

        const holder =
            document.createElement(
                "div"
            );


        holder.className =
            "media-holder";


        holder.textContent =
            "Loading saved media…";


        bubble.appendChild(
            holder
        );


        restoreMedia(

            message.mediaId,

            message.type,

            holder

        );

    }



    row.append(
        avatar,
        bubble
    );


    return row;

}



/* ============================================================
   STREAMING MESSAGE
============================================================ */

function createLiveAssistantBubble(
    initialText
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
        "message-row assistant live-message";


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


    const text =
        row.querySelector(
            ".message-text"
        );


    text.textContent =
        initialText;


    els.chatArea
        .appendChild(
            row
        );


    els.chatArea.scrollTop =
        els.chatArea.scrollHeight;


    return {

        update(
            value
        ) {

            text.textContent =
                value;


            els.chatArea.scrollTop =
                els.chatArea.scrollHeight;

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



/* ============================================================
   GREETING
============================================================ */

function updateGreeting() {

    const hour =
        new Date()
            .getHours();


    els.greetingText.textContent =

        hour < 12

        ?
        "Good morning"

        :

        hour < 17

        ?
        "Good afternoon"

        :
        "Good evening";

}



/* ============================================================
   STATUS
============================================================ */

function setStatus(
    text
) {

    els.statusText.textContent =
        text;

}



function setModelStatus(
    text
) {

    if (
        els.modelStatus
    ) {

        els.modelStatus.textContent =
            text;

    }

}



/* ============================================================
   INPUT RESIZE
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


    return (

        days ===
        1

        ?
        "Yesterday"

        :
        `${days} days ago`

    );

}



/* ============================================================
   VOICE WAKE WORD

   Say:
   Galaxy explain gravity

   Galaxy தமிழ் தெரியுமா

   Galaxy create an image of a city
============================================================ */

function prepareVoiceActivation() {

    /*
     * Browsers normally need one
     * click/key interaction before
     * asking microphone permission.
     */

    const start =
        () => {

            if (
                !state.voiceStarted
            ) {

                startVoiceRecognition();

            }


            document
                .removeEventListener(
                    "click",
                    start
                );


            document
                .removeEventListener(
                    "keydown",
                    start
                );

        };


    document
        .addEventListener(
            "click",
            start
        );


    document
        .addEventListener(
            "keydown",
            start
        );

}



/* ============================================================
   START VOICE
============================================================ */

function startVoiceRecognition() {

    const Recognition =
        window.SpeechRecognition
        ||
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

            els.voiceIndicator
                .classList
                .add(
                    "listening"
                );


            if (
                !state.speaking
            ) {

                setStatus(
                    'Listening for "Galaxy"…'
                );

            }

        };



    recognition.onresult =
        event => {

            if (
                state.speaking
            ) {

                return;

            }


            for (
                let i =
                    event.resultIndex;

                i <
                    event.results.length;

                i++
            ) {

                if (
                    !event
                        .results[i]
                        .isFinal
                ) {

                    continue;

                }


                handleVoiceCommand(
                    event
                        .results[i][0]
                        .transcript
                        .trim()
                );

            }

        };



    recognition.onerror =
        () => {

            els.voiceIndicator
                .classList
                .remove(
                    "listening"
                );


            if (
                !state.speaking
            ) {

                setStatus(
                    "Ready"
                );

            }

        };



    recognition.onend =
        () => {

            els.voiceIndicator
                .classList
                .remove(
                    "listening"
                );


            if (
                !state.speaking
            ) {

                setStatus(
                    "Ready"
                );

            }


            if (
                !state.speaking
            ) {

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

            }

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

        .trim()

        .replace(
            /^[,.:;!\-\s]+/,
            ""
        );


    if (
        !command
    ) {

        setStatus(
            "Galaxy heard you"
        );

        return;

    }



    /*
     * IMPORTANT:
     *
     * Voice source CANNOT unlock
     * hidden Game Center.
     */

    processMessage(

        command,

        {
            source:
                "voice"
        }

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


    els.settingsModal
        .classList
        .add(
            "hidden-modal"
        );

}



/* ============================================================
   GALAXY SPEAKS
============================================================ */

function speakText(
    text
) {

    if (
        !window.speechSynthesis
    ) {

        return;

    }


    state.speaking =
        true;


    if (
        state.recognition
    ) {

        try {

            state.recognition.stop();

        }

        catch {
        }

    }


    speechSynthesis.cancel();



    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.rate =
        1;



    utterance.onend =
        () => {

            state.speaking =
                false;


            setTimeout(
                () => {

                    if (
                        state.voiceStarted &&
                        state.recognition
                    ) {

                        try {

                            state.recognition.start();

                        }

                        catch {
                        }

                    }

                },
                600
            );

        };


    speechSynthesis.speak(
        utterance
    );

}



/* ============================================================
   INDEXEDDB MEDIA STORAGE
============================================================ */

function openMediaDB() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const request =
                indexedDB.open(
                    "galaxy_media_v1",
                    1
                );


            request.onupgradeneeded =
                () => {

                    const db =
                        request.result;


                    if (
                        !db
                            .objectStoreNames
                            .contains(
                                "media"
                            )
                    ) {

                        db.createObjectStore(

                            "media",

                            {
                                keyPath:
                                    "id"
                            }

                        );

                    }

                };


            request.onsuccess =
                () => {

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}



/* ============================================================
   SAVE MEDIA
============================================================ */

async function saveMediaBlob(
    blob,
    mime
) {

    const id =
        `media_${Date.now()}_${
            Math.random()
                .toString(36)
                .slice(2, 7)
        }`;


    const db =
        await openMediaDB();



    await new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                db.transaction(
                    "media",
                    "readwrite"
                );


            transaction
                .objectStore(
                    "media"
                )
                .put({

                    id:
                        id,

                    blob:
                        blob,

                    mime:
                        mime,

                    createdAt:
                        Date.now()

                });


            transaction.oncomplete =
                resolve;


            transaction.onerror =
                () => {

                    reject(
                        transaction.error
                    );

                };

        }
    );


    db.close();


    return id;

}



/* ============================================================
   GET MEDIA
============================================================ */

async function getMediaBlob(
    id
) {

    const db =
        await openMediaDB();


    const result =
        await new Promise(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    db.transaction(
                        "media",
                        "readonly"
                    );


                const request =
                    transaction

                    .objectStore(
                        "media"
                    )

                    .get(
                        id
                    );


                request.onsuccess =
                    () => {

                        resolve(
                            request.result ||
                            null
                        );

                    };


                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

            }
        );


    db.close();


    return result;

}



/* ============================================================
   RESTORE SAVED IMAGE / VIDEO
============================================================ */

async function restoreMedia(
    mediaId,
    type,
    holder
) {

    try {

        const record =
            await getMediaBlob(
                mediaId
            );


        if (
            !record?.blob
        ) {

            holder.textContent =
                "Saved media is unavailable.";

            return;

        }


        const url =
            URL.createObjectURL(
                record.blob
            );


        holder.textContent =
            "";


        if (
            type ===
            "image"
        ) {

            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "generated-media generated-image";


            image.src =
                url;


            image.alt =
                "GALAXY generated image";


            holder.appendChild(
                image
            );

        }

        else {

            const video =
                document.createElement(
                    "video"
                );


            video.className =
                "generated-media generated-video";


            video.src =
                url;


            video.controls =
                true;


            video.playsInline =
                true;


            holder.appendChild(
                video
            );

        }

    }

    catch {

        holder.textContent =
            "Saved media is unavailable.";

    }

}



/* ============================================================
   SAFE HTML
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



/* ============================================================
   DELAY
============================================================ */

function delay(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}
