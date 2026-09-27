// Always start the birthday experience from the top
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

window.scrollTo(0, 0);

const startScreen = document.getElementById("start-screen");
const darkness = document.getElementById("darkness");

const flames = document.querySelectorAll(".flame");

const memorySection = document.querySelector("#memory-section");
const giftLid = document.querySelector(".gift-lid");
const giftPhoto = document.querySelector(".gift-photo");


let lightRadius = 0;
let animationStarted = false;

let audioContext;
let analyser;
let microphone;
let microphoneStream;

let microphoneReady = false;
let candlesReady = false;

let blowThreshold = 20;
let candlesBeingExtinguished = false;
let blowStartTime = null;
let manualExtinguishUsed = false;


startScreen.addEventListener("click", startExperience);
startScreen.addEventListener("touchstart", startExperience);

document.getElementById("birthday-scene").addEventListener(
    "dblclick",
    () => {

        if (!candlesReady) {
            return;
        }

        if (candlesBeingExtinguished) {
            return;
        }

        if (manualExtinguishUsed) {
            return;
        }

        manualExtinguishUsed = true;

        console.log("Manual candle extinguish triggered.");

        extinguishAllCandles();
    }
);


function startExperience() {

    if (animationStarted) return;

    animationStarted = true;
    setupMicrophone();

    console.log("The birthday experience has started!");

    startScreen.style.opacity = "0";
    startScreen.style.pointerEvents = "none";


    // Start completely dark
    updateDarkness();


    // ========================================
    // MIDDLE CANDLE
    // ========================================

    setTimeout(() => {

        flames[1].classList.add("lit");

        expandLight();

    }, 700);

}


async function setupMicrophone() {

    try {

        microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        audioContext = new AudioContext();

        analyser = audioContext.createAnalyser();

        analyser.fftSize = 512;

        microphone = audioContext.createMediaStreamSource(
            microphoneStream
        );

        microphone.connect(analyser);

        microphoneReady = true;

        console.log("Microphone is ready!");

        detectBlow();

    } catch (error) {

        console.log("Microphone access was not granted.");
        console.log(error);

        microphoneReady = false;
    }
}

function detectBlow() {

    if (!microphoneReady || !analyser) {
        return;
    }

    const data =
        new Uint8Array(analyser.fftSize);

    analyser.getByteTimeDomainData(data);

    let sum = 0;

    for (let i = 0; i < data.length; i++) {

        const value =
            (data[i] - 128) / 128;

        sum += value * value;
    }

    const rms =
        Math.sqrt(
            sum / data.length
        );

    const volume =
        rms * 100;

    if (
        candlesReady &&
        volume > blowThreshold
    ) {

        if (!blowStartTime) {

            blowStartTime =
                performance.now();

        }

        if (
            performance.now() -
            blowStartTime >
            150
        ) {

            console.log(
                "Blow detected!"
            );

            extinguishAllCandles();

            return;
        }

    } else {

        blowStartTime = null;

    }

    requestAnimationFrame(
        detectBlow
    );
}

function extinguishCandle(index) {

    console.log(
        "Trying to extinguish candle:",
        index + 1,
        "Lit:",
        flames[index].classList.contains("lit")
    );

    if (!flames[index].classList.contains("lit")) {
        return;
    }

    flames[index].classList.remove("lit");

    console.log("Candle", index + 1, "extinguished!");
}

function extinguishAllCandles() {

    candlesBeingExtinguished = true;

    // Middle candle
    extinguishCandle(1);

    // Left candle
    setTimeout(() => {
        extinguishCandle(0);
    }, 180);

    // Right candle
    setTimeout(() => {
        extinguishCandle(2);
    }, 360);

    // Allow scrolling after all candles are out
    setTimeout(() => {
        document.body.style.overflowY = "auto";
    }, 600);

}

function expandLight() {

    const startTime = performance.now();

    // How long the entire reveal takes
    const duration = 4500;


    function animate(currentTime) {

        const elapsed = currentTime - startTime;

        let progress = elapsed / duration;

        progress = Math.min(progress, 1);


        // Smooth expansion
        const eased = easeOutCubic(progress);


        /*
            The radius starts small
            and eventually becomes large
            enough to cover the screen.
        */

        lightRadius = eased * 1100;


        updateDarkness();


        /*
            Light reaches the side candles
            roughly halfway through.
        */

        if (progress >= 0.20) {

            flames[0].classList.add("lit");
            flames[2].classList.add("lit");

        }


        if (progress < 1) {

            requestAnimationFrame(animate);

        } else {

            // The reveal is finished.
            candlesReady = true;

            document.querySelector(".candle-instructions").style.opacity = "1";

            console.log("Candles are ready to be blown out.");

        }

    }


    requestAnimationFrame(animate);

}

function updateDarkness() {

    darkness.style.webkitMaskImage = `
        radial-gradient(
            circle at 50% calc(50% - 95px),

            transparent 0px,

            transparent ${lightRadius * 0.35}px,

            rgba(0,0,0,0.15) ${lightRadius * 0.55}px,

            rgba(0,0,0,0.45) ${lightRadius * 0.75}px,

            #000 ${lightRadius}px
        )
    `;


    darkness.style.maskImage = `
        radial-gradient(
            circle at 50% calc(50% - 95px),

            transparent 0px,

            transparent ${lightRadius * 0.35}px,

            rgba(0,0,0,0.15) ${lightRadius * 0.55}px,

            rgba(0,0,0,0.45) ${lightRadius * 0.75}px,

            #000 ${lightRadius}px
        )
    `;

}

function easeOutCubic(t) {

    return 1 - Math.pow(1 - t, 3);

}

window.addEventListener("scroll", updateGift);

function updateGift() {

    const sectionTop =
        memorySection.getBoundingClientRect().top;

    const scrollDistance =
        memorySection.offsetHeight - window.innerHeight;

    const scrolled =
        Math.max(0, -sectionTop);

    const progress =
        Math.min(1, scrolled / scrollDistance);


    // =========================================
    // LID
    // =========================================

    // 0.00 - 0.20
    // Box stays completely closed.

    // 0.20 - 0.45
    // Lid moves to the right.

    const lidProgress =
        Math.max(
            0,
            Math.min(
                1,
                (progress - 0.20) / 0.25
            )
        );

    const lidEased =
        1 - Math.pow(1 - lidProgress, 3);

    const lidX =
        lidEased * 500;

    const lidRotation =
        lidEased * 5;

    giftLid.style.setProperty(
        "--lid-x",
        `${lidX}px`
    );

    giftLid.style.setProperty(
        "--lid-rotation",
        `${lidRotation}deg`
    );

    // =========================================
    // PHOTO RISE
    // =========================================

    // Photo starts rising after the lid has moved.

    const photoProgress =
        Math.max(
            0,
            Math.min(
                1,
                (progress - 0.45) / 0.20
            )
        );

    const photoEased =
        1 - Math.pow(1 - photoProgress, 3);


    // Move photo upward
    const photoY =
        -(photoEased * 400);

    giftPhoto.style.setProperty(
        "--photo-y",
        `${photoY}px`
    );
}

const soundOrb = document.getElementById("sound-orb");
const birthdayAudio = document.getElementById("birthday-audio");

let orbAnimating = false;
let orbAnimationFrame = null;

// ========================================
// AUDIO ORB
// ========================================

soundOrb.addEventListener("click", async () => {

    console.log("Orb clicked.");

    try {

        if (birthdayAudio.paused) {

            console.log("Attempting to play audio...");

            await birthdayAudio.play();

            console.log("Audio is playing.");

            // Start visual animation
            if (!orbAnimating) {
                orbAnimating = true;
                animateOrb();
            }

        } else {

            birthdayAudio.pause();

            console.log("Audio paused.");

            orbAnimating = false;

            if (orbAnimationFrame) {
                cancelAnimationFrame(orbAnimationFrame);
            }

            // Return orb to normal
            document.documentElement.style.setProperty(
                "--orb-scale",
                "1"
            );

            document.documentElement.style.setProperty(
                "--orb-glow",
                "20px"
            );
        }

    } catch (error) {

        console.error(
            "Audio playback failed:",
            error
        );

    }

});


// ========================================
// ORB ANIMATION
// ========================================

function animateOrb() {

    if (!orbAnimating) {
        return;
    }

    const time = performance.now();

    /*
        Gentle breathing motion.

        The orb never becomes completely still,
        even during quieter parts of the recording.
    */

    const breathing =
        Math.sin(time * 0.0025) * 0.025;


    /*
        Slight additional movement based on
        how far through the recording we are.

        This gives the animation some variation
        without requiring an audio analyser.
    */

    const audioTime =
        birthdayAudio.currentTime;

    const audioDuration =
        birthdayAudio.duration || 1;

    const progress =
        audioTime / audioDuration;


    const voicePulse =
        Math.sin(progress * Math.PI * 18) * 0.025;


    /*
        Combine both movements.
    */

    const scale =
        1 + breathing + voicePulse;


    const glow =
        20 +
        ((scale - 0.95) * 180);


    document.documentElement.style.setProperty(
        "--orb-scale",
        scale.toFixed(3)
    );

    document.documentElement.style.setProperty(
        "--orb-glow",
        `${glow.toFixed(1)}px`
    );


    // ========================================
    // RINGS
    // ========================================

    const rings =
        document.querySelectorAll(".orb-ring");


    rings.forEach((ring, index) => {

        const ringPulse =
            Math.sin(
                time * (0.0015 + index * 0.0005)
                + index
            );

        const scale =
            1 + ringPulse * 0.035;

        const opacity =
            0.2 +
            ((ringPulse + 1) * 0.08);

        ring.style.transform = `
            translate(-50%, -50%)
            scale(${scale})
        `;

        ring.style.opacity = opacity;

    });


    orbAnimationFrame =
        requestAnimationFrame(animateOrb);
}


// ========================================
// AUDIO END
// ========================================

birthdayAudio.addEventListener("ended", () => {

    console.log("Audio finished.");

    orbAnimating = false;

    if (orbAnimationFrame) {
        cancelAnimationFrame(orbAnimationFrame);
    }


    // Slowly return to resting state

    document.documentElement.style.setProperty(
        "--orb-scale",
        "1"
    );

    document.documentElement.style.setProperty(
        "--orb-glow",
        "20px"
    );


    const rings =
        document.querySelectorAll(".orb-ring");

    rings.forEach((ring) => {

        ring.style.transform =
            "translate(-50%, -50%) scale(1)";

        ring.style.opacity = "";

    });

});
