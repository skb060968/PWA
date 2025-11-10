/* ==============================
   Learn English App – Final JS
   ============================== */

const levelFiles = {
  easy: ["easy1.json"],
  medium: ["medium1.json"],
  advanced: ["advanced1.json"]
};

let username = "";
let selectedLevel = "";
let currentFileIndex = 0;
let phrases = [];
let index = 0;
let attempted = 0;
let translationRevealed = false;
let voices = [];
let voicesLoaded = false;

window.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const welcome = document.getElementById("welcome-screen");

  // 🌙 Restore theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.body.classList.add("dark");

  // 💾 Load saved progress
  const savedProgress = JSON.parse(localStorage.getItem("progress") || "{}");
  if (savedProgress.username) {
    username = savedProgress.username;
    selectedLevel = savedProgress.selectedLevel || "";
    currentFileIndex = savedProgress.currentFileIndex || 0;
    index = savedProgress.index || 0;
    document.getElementById("username").value = username;

    // 🧩 Auto-resume if a level was in progress
    if (selectedLevel) {
      splash.style.display = "none";
      welcome.style.display = "none";
      const phrase = document.getElementById("phrase-screen");
      phrase.style.display = "flex";
      document.getElementById("loader").style.display = "block";
      loadPhrases(levelFiles[selectedLevel][currentFileIndex]);
      return; // Skip splash animation
    }
  }

  // 🚀 Normal splash → welcome flow
  setTimeout(() => {
    splash.classList.add("rotate-out");
    setTimeout(() => {
      splash.style.display = "none";
      welcome.style.display = "flex";
      welcome.classList.add("rotate-in");
    }, 600);
  }, 1500);

  loadVoices();
});

function toggleTheme() {
  const body = document.body;
  const icon = document.getElementById("theme-icon");
  body.classList.toggle("dark");
  const darkMode = body.classList.contains("dark");
  icon.textContent = darkMode ? "☀️" : "🌙";
  localStorage.setItem("theme", darkMode ? "dark" : "light");
}

function unlockSpeech() {
  if (!("speechSynthesis" in window)) return;
  const dummy = new SpeechSynthesisUtterance("");
  speechSynthesis.speak(dummy);
}

/* =========================
   START TEST / LOAD PHRASES
   ========================= */
async function startTest(level) {
  unlockSpeech();
  await loadVoices();

  username = document.getElementById("username").value.trim();
  if (!username) {
    alert("Please enter your name to begin.");
    return;
  }

  selectedLevel = level;
  currentFileIndex = 0;
  index = 0;
  saveProgress();

  const welcome = document.getElementById("welcome-screen");
  const phrase = document.getElementById("phrase-screen");

  welcome.classList.add("rotate-out");
  setTimeout(() => {
    welcome.style.display = "none";
    phrase.style.display = "flex";
    phrase.classList.add("rotate-in");
    document.getElementById("loader").style.display = "block";
    loadPhrases(levelFiles[level][currentFileIndex]);
  }, 600);
}

function saveProgress() {
  const progress = {
    username,
    selectedLevel,
    currentFileIndex,
    index
  };
  localStorage.setItem("progress", JSON.stringify(progress));
}

function loadPhrases(fileName) {
  fetch(fileName)
    .then((res) => res.json())
    .then((data) => {
      const allPhrases = data.categories
        ? data.categories.flatMap((cat) => cat.phrases)
        : data.phrases;
      phrases = shuffleArray(allPhrases);
      setTimeout(() => {
        document.getElementById("loader").style.display = "none";
        showPhrase();
      }, 400);
    })
    .catch((err) => {
      console.error(err);
      alert("Could not load phrases (offline or missing file).");
      document.getElementById("loader").style.display = "none";
    });
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/* =========================
   PHRASE DISPLAY & CONTROL
   ========================= */
function showPhrase() {
  translationRevealed = false;
  const nextBtn = document.querySelector(".controls button:nth-child(2)");
  if (nextBtn) nextBtn.disabled = true;

  const phrase = phrases[index];
  const hinglish = document.getElementById("hinglish-phrase");
  const english = document.getElementById("english-translation");

  english.style.display = "none";
  english.classList.remove("phrase-flip");

  if (phrase.type === "translation" || phrase.type === "qa-hindi") {
    hinglish.textContent = phrase.hindi;
    speak(phrase.hindi, "hi-IN");
  } else if (phrase.type === "qa-english") {
    hinglish.textContent = phrase.english;
    speak(phrase.english, "en-IN");
  }

  hinglish.classList.remove("phrase-flip");
  void hinglish.offsetWidth;
  hinglish.classList.add("phrase-flip");

  // 📊 Update progress text + bar
  document.getElementById("progress-text").textContent = 
    `Progress: ${index + 1} / ${phrases.length}`;
  document.documentElement.style.setProperty(
    "--progress-width",
    `${((index + 1) / phrases.length) * 100}%`
  );

  saveProgress();
}

function revealTranslation() {
  const phrase = phrases[index];
  const english = document.getElementById("english-translation");

  english.textContent = phrase.type === "qa-english" ? phrase.answer : phrase.english;
  english.style.display = "block";
  void english.offsetWidth;
  english.classList.add("phrase-flip");

  setTimeout(() => speak(english.textContent, "en-IN"), 400);
  attempted++;
  translationRevealed = true;

  const nextBtn = document.querySelector(".controls button:nth-child(2)");
  if (nextBtn) nextBtn.disabled = false;
}

function nextPhrase() {
  if (!translationRevealed) return;
  index++;
  if (index >= phrases.length) {
    setTimeout(celebrate, 400);
    return;
  }
  showPhrase();
}

/* =========================
   CELEBRATION / END SCREEN
   ========================= */
function celebrate() {
  const phrase = document.getElementById("phrase-screen");
  const celebration = document.getElementById("celebration");
  const cheer = document.getElementById("cheer-sound");

  phrase.classList.add("rotate-out");
  setTimeout(() => {
    phrase.style.display = "none";
    phrase.classList.remove("rotate-out");

    celebration.style.display = "flex";
    celebration.classList.add("rotate-in");

    const nameSpan = document.getElementById("user-name");
    if (nameSpan) nameSpan.textContent = username || "Learner";

    if (cheer) {
      cheer.currentTime = 0;
      cheer.play().catch((err) => console.warn("Audio play failed:", err));
	  launchConfetti(); // 🎉 Trigger confetti here
    }
  }, 600);
}

/* =========================
   CONFETTI ANIMATION
   ========================= */
function launchConfetti() {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = { spread: 360, ticks: 60, gravity: 0.8, decay: 0.9, startVelocity: 25 };

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
      colors: ["#0078D4", "#FFD700", "#32CD32", "#FF69B4"],
    });
  }, 200);
}


function restartApp() {
  localStorage.removeItem("progress");
  document.getElementById("celebration").style.display = "none";
  document.getElementById("welcome-screen").style.display = "flex";
  document.getElementById("username").value = "";
  document.getElementById("welcome-screen").classList.remove("rotate-out");
  document.getElementById("welcome-screen").classList.add("rotate-in");
}

function exitApp() {
  document.getElementById("celebration").style.display = "none";
  document.getElementById("phrase-screen").style.display = "none";
  document.getElementById("welcome-screen").style.display = "flex";
  document.getElementById("welcome-screen").classList.add("rotate-in");
}

/* =========================
   SPEECH SYNTHESIS
   ========================= */
function loadVoices() {
  return new Promise((resolve) => {
    const fetchVoices = () => {
      voices = speechSynthesis.getVoices();
      if (voices.length) {
        voicesLoaded = true;
        resolve(voices);
      }
    };
    fetchVoices();
    speechSynthesis.onvoiceschanged = fetchVoices;
  });
}

async function speak(text, lang) {
  if (!("speechSynthesis" in window)) return;
  if (!voicesLoaded) await loadVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  const matchedVoice =
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(lang.split("-")[0])) ||
    voices.find((v) => v.lang.toLowerCase().includes("en-in")) ||
    voices.find((v) => v.lang.toLowerCase().includes("en"));
  if (matchedVoice) utterance.voice = matchedVoice;
  utterance.lang = matchedVoice ? matchedVoice.lang : lang;
  speechSynthesis.cancel();
  setTimeout(() => {
    try {
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis failed:", err);
    }
  }, 150);
}
