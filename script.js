// @ts-check

/** @typedef {"inhale" | "inhale_hold" | "exhale" | "exhale_hold"} Phase */
/** @typedef {Record<Phase, number>} Durations */
/** @typedef {{ name: string, durations: Durations }} Preset */

/** @type {readonly Preset[]} */
const PRESETS = [
    { name: "Resonance 5.5", durations: { inhale: 5.5, inhale_hold: 0, exhale: 5.5, exhale_hold: 0 } },
    { name: "Box 4-4-4-4", durations: { inhale: 4, inhale_hold: 4, exhale: 4, exhale_hold: 4 } },
    { name: "Relaxing 4-7-8", durations: { inhale: 4, inhale_hold: 7, exhale: 8, exhale_hold: 0 } },
];

/** @type {Durations} */
const DEFAULTS = PRESETS[0].durations;

/** @type {readonly Phase[]} */
const PHASES = ["inhale", "inhale_hold", "exhale", "exhale_hold"];

const form = /** @type {HTMLFormElement} */ (document.getElementById("settings"));
const circle = /** @type {HTMLElement} */ (document.querySelector(".circle"));
const counter = /** @type {HTMLOutputElement} */ (document.getElementById("counter"));
const phaseLabel = /** @type {HTMLOutputElement} */ (document.getElementById("phase-label"));
const timerPanel = /** @type {HTMLElement} */ (document.querySelector(".timer-panel"));
const timerOutput = /** @type {HTMLOutputElement} */ (document.getElementById("timer"));
const timerResetBtn = /** @type {HTMLButtonElement} */ (document.getElementById("timer-reset"));
const showTimerCheckbox = /** @type {HTMLInputElement} */ (form.elements.namedItem("show_timer"));
const presetsContainer = /** @type {HTMLElement} */ (document.querySelector(".presets"));

/** @type {Record<Phase, string>} */
const PHASE_LABELS = {
    inhale: "In",
    inhale_hold: "Hold",
    exhale: "Out",
    exhale_hold: "Hold"
};

// Render preset buttons
PRESETS.forEach((preset, index) => {
    const label = document.createElement("label");
    label.className = "preset";
    label.innerHTML = `<input type="radio" name="preset" value="${index}">${preset.name}`;
    presetsContainer.appendChild(label);
});

/**
 * @param {Durations} durations
 */
function applyDurations(durations) {
    for (const [name, value] of Object.entries(durations)) {
        const input = /** @type {HTMLInputElement} */ (form.elements.namedItem(name));
        input.value = String(value);
    }
}

// Handle preset selection
presetsContainer.addEventListener("change", (e) => {
    const target = /** @type {HTMLInputElement} */ (e.target);
    const preset = PRESETS[Number(target.value)];
    if (preset) {
        applyDurations(preset.durations);
    }
});

/**
 * @param {boolean} visible
 */
function setTimerVisibility(visible) {
    timerPanel.hidden = !visible;
}

// Handle timer visibility toggle
showTimerCheckbox.addEventListener("change", () => {
    setTimerVisibility(showTimerCheckbox.checked);
});

// Load settings from localStorage
const settingsStr = localStorage.getItem("settings");
if (settingsStr) {
    /** @type {Record<string, string>} */
    const settings = JSON.parse(settingsStr);

    // Handle checkbox separately (unchecked = key missing from FormData)
    showTimerCheckbox.checked = settings.show_timer === "on";

    for (const [name, value] of Object.entries(settings)) {
        const input = /** @type {HTMLInputElement | null} */ (form.elements.namedItem(name));
        if (input && input.type !== "checkbox") {
            input.value = value;
        }
    }
}

// Apply initial timer visibility
setTimerVisibility(showTimerCheckbox.checked);

// Set defaults for empty fields
for (const [name, value] of Object.entries(DEFAULTS)) {
    const input = /** @type {HTMLInputElement} */ (form.elements.namedItem(name));
    if (!input.value) {
        input.value = String(value);
    }
}

// Save settings on form submit
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const dataParsed = Object.fromEntries(formData);
    localStorage.setItem("settings", JSON.stringify(dataParsed));
});

/** @returns {Record<Phase, number>} */
function getDurations() {
    return {
        inhale: parseFloat(/** @type {HTMLInputElement} */ (form.elements.namedItem("inhale")).value) || DEFAULTS.inhale,
        inhale_hold: parseFloat(/** @type {HTMLInputElement} */ (form.elements.namedItem("inhale_hold")).value) || DEFAULTS.inhale_hold,
        exhale: parseFloat(/** @type {HTMLInputElement} */ (form.elements.namedItem("exhale")).value) || DEFAULTS.exhale,
        exhale_hold: parseFloat(/** @type {HTMLInputElement} */ (form.elements.namedItem("exhale_hold")).value) || DEFAULTS.exhale_hold
    };
}

/** @type {number} */
let cycleCount = 0;
/** @type {number | null} */
let phaseTimeoutId = null;
/** @type {number | null} */
let timerIntervalId = null;
/** @type {number} */
let currentPhaseIndex = 0;
/** @type {number} */
let phaseStartTime = 0;
/** @type {number} */
let phaseRemainingMs = 0;

function resetCycleCount() {
    cycleCount = 0;
    counter.textContent = "0";
}

function scheduleNextPhase() {
    const durations = getDurations();
    const phaseName = PHASES[currentPhaseIndex];
    const duration = durations[phaseName];

    // Skip phases with 0 duration
    if (duration === 0) {
        currentPhaseIndex = (currentPhaseIndex + 1) % PHASES.length;
        scheduleNextPhase();
        return;
    }

    const durationMs = phaseRemainingMs > 0 ? phaseRemainingMs : duration * 1000;
    phaseRemainingMs = 0;

    // Set duration BEFORE applying phase (via CSS custom property)
    circle.style.setProperty("--phase-duration", `${durationMs / 1000}s`);

    // Force reflow to ensure transition picks up new duration
    circle.offsetHeight;

    document.body.dataset.phase = phaseName;
    phaseLabel.textContent = PHASE_LABELS[phaseName];

    if (currentPhaseIndex === 0 && phaseStartTime === 0) {
        cycleCount++;
        counter.textContent = String(cycleCount);
    }

    phaseStartTime = Date.now();

    phaseTimeoutId = setTimeout(() => {
        phaseStartTime = 0;
        currentPhaseIndex = (currentPhaseIndex + 1) % PHASES.length;
        scheduleNextPhase();
    }, durationMs);
}

function startBreathingCycle() {
    currentPhaseIndex = 0;
    phaseRemainingMs = 0;
    scheduleNextPhase();
}

startBreathingCycle();

// Timer
let timerStart = Date.now();
/** @type {number} */
let pausedElapsed = 0;

/**
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - timerStart) / 1000);
    timerOutput.textContent = formatTime(elapsed);
}

timerIntervalId = setInterval(updateTimer, 1000);

timerResetBtn.addEventListener("click", () => {
    timerStart = Date.now();
    resetCycleCount();
    updateTimer();
});

// Pause when tab is hidden
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // Pause timer
        pausedElapsed = Date.now() - timerStart;
        if (timerIntervalId !== null) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }

        // Pause breathing cycle
        if (phaseTimeoutId !== null) {
            clearTimeout(phaseTimeoutId);
            phaseTimeoutId = null;
            phaseRemainingMs = Math.max(0, (getDurations()[PHASES[currentPhaseIndex]] * 1000) - (Date.now() - phaseStartTime));
        }

       circle.style.transitionDuration = "0s";
    } else {
        // Resume timer
        timerStart = Date.now() - pausedElapsed;
        timerIntervalId = setInterval(updateTimer, 1000);
        updateTimer();

        circle.style.transitionDuration = "";

        // Resume breathing cycle
        scheduleNextPhase();
    }
});
