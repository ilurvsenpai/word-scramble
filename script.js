// Fallback word lists
const wordSets = {
  easy: ["cat","dog","sun","book","tree","fish","hat","pen","cup","ball"],
  medium: ["javascript","keyboard","internet","computer","browser","picture","monster","holiday"],
  hard: ["algorithm","programming","development","application","encyclopedia","microscope"]
};

let currentWord = "";
let score = 0;
let lives = 3;
let timeLeft = 10;
let timer;
let difficulty = "medium";

let timerStarted = false;
let usedWords = [];

// Shuffle letters
function shuffle(word) {
  let shuffled;
  do {
    shuffled = word.split("").sort(() => Math.random() - 0.5).join("");
  } while (shuffled === word);
  return shuffled;
}

// Update UI
function updateUI() {
  document.getElementById("score").textContent = "⭐ " + score;
  document.getElementById("lives").textContent = "❤️ " + lives;
}

// Fetch random word with proper difficulty
async function fetchWord() {
  let word = "";
  let attempts = 0;

  let minLen = 3, maxLen = 100;
  if (difficulty === "easy") { minLen = 3; maxLen = 5; }
  else if (difficulty === "medium") { minLen = 6; maxLen = 8; }
  else if (difficulty === "hard") { minLen = 9; maxLen = 20; }

  while (attempts < 20) {
    attempts++;
    try {
      const res = await fetch("https://random-word-api.herokuapp.com/word");
      const data = await res.json();
      word = data[0].toLowerCase();
      if (/^[a-z]+$/.test(word) && word.length >= minLen && word.length <= maxLen) {
        return word;
      }
    } catch {
      break;
    }
  }

  // fallback
  const filteredWords = wordSets[difficulty].filter(w => w.length >= minLen && w.length <= maxLen);
  return filteredWords[Math.floor(Math.random() * filteredWords.length)];
}

// Create new word
async function newWord() {
  clearInterval(timer);
  timerStarted = false;

  const wordDisplay = document.querySelector(".scrambled-word");
  wordDisplay.textContent = "Loading...";
  wordDisplay.classList.add("loading");

  let word;
  let attempts = 0;
  do {
    word = await fetchWord();
    attempts++;
    if (attempts > 20) break;
  } while (usedWords.includes(word));

  currentWord = word;
  usedWords.push(currentWord);

  wordDisplay.textContent = shuffle(currentWord);
  wordDisplay.classList.remove("loading");

  const input = document.getElementById("guessInput");
  input.value = "";
  input.focus();

  document.getElementById("message").textContent =
    `Difficulty: ${difficulty} (${currentWord.length} letters)`;

  document.getElementById("timer").textContent = "⏱ Ready";
}

// Timer
function startTimer() {
  timeLeft = difficulty === "easy" ? 12 : difficulty === "hard" ? 8 : 10;
  document.getElementById("timer").textContent = "⏱ " + timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = "⏱ " + timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      loseLife("⏰ Time's up!");
    }
  }, 1000);
}

// Input triggers timer
document.getElementById("guessInput").addEventListener("input", (e) => {
  if (e.target.value.length > 0 && !timerStarted) {
    timerStarted = true;
    startTimer();
  }
});

// Enter submits
document.getElementById("guessInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const value = e.target.value.trim();
    if (value !== "") checkGuess();
  }
});

// Check guess
function checkGuess() {
  const input = document.getElementById("guessInput");
  const guess = input.value.toLowerCase();

  if (guess === currentWord) {
    score++;
    document.getElementById("message").textContent = "✅ Correct!";
    newWord();
  } else {
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 300);
    loseLife("❌ Wrong!");
  }

  updateUI();
}

// Lose life
function loseLife(msg) {
  lives--;
  document.getElementById("message").textContent = msg;

  if (lives <= 0) showGameOver();
  else newWord();
}

// Reset game
function resetGame() {
  score = 0;
  lives = 3;
  usedWords = [];
  updateUI();
  newWord();
}

// Difficulty
function setDifficulty() {
  difficulty = document.getElementById("difficulty").value;
  usedWords = [];
  newWord();
}

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle("light");
}

// Pause/resume timer
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearInterval(timer);
  else if (timerStarted) startTimer();
});

// Confetti animation
function launchConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;
  const colors = ['#ffce00','#ff6f61','#6a5acd','#00ced1'];

  (function frame() {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) return;

    const particleCount = 5 + Math.random() * 5;
    for (let i = 0; i < particleCount; i++) {
      const confetti = document.createElement("div");
      confetti.style = `
        position: fixed;
        width: 8px; height: 8px;
        background: ${colors[Math.floor(Math.random()*colors.length)]};
        top: ${Math.random()*window.innerHeight}px;
        left: ${Math.random()*window.innerWidth}px;
        opacity: 0.9;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translateY(0) rotate(${Math.random()*360}deg);
        transition: transform 1s linear, opacity 1s linear;
      `;
      document.body.appendChild(confetti);
      setTimeout(() => {
        confetti.style.transform = `translateY(${window.innerHeight}px) rotate(${Math.random()*720}deg)`;
        confetti.style.opacity = 0;
      }, 10);
      setTimeout(() => document.body.removeChild(confetti), 1100);
    }
    requestAnimationFrame(frame);
  })();
}

// Game Over popup
function showGameOver() {
  clearInterval(timer);

  const highScoreKey = `highscore_${difficulty}`;
  const prevHigh = localStorage.getItem(highScoreKey) || 0;

  if (score > prevHigh) {
    localStorage.setItem(highScoreKey, score);
    launchConfetti();
  }

  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const card = document.createElement("div");
  card.className = "popup-card";
  card.innerHTML = `
    <h2>Game Over!</h2>
    <p>Your Score: ${score}</p>
    <p>High Score (${difficulty}): ${Math.max(score, prevHigh)}</p>
    <button id="restartBtn">Play Again</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  document.getElementById("restartBtn").addEventListener("click", () => {
    document.body.removeChild(overlay);
    resetGame();
  });
}

// Initialize
updateUI();
newWord();