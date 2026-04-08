// Word lists
const wordSets = {
  easy: ["cat","dog","sun","book","tree","fish","hat","pen","cup","ball"],
  medium: ["javascript","keyboard","internet","computer","browser","picture","monster","holiday"],
  hard: ["algorithm","programming","development","application","encyclopedia","microscope"]
};

let currentWord = "";
let scrambledWord = "";
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

// Create new word
function newWord() {
  clearInterval(timer);
  timerStarted = false;

  // Reset usedWords if all words used
  if (usedWords.length >= wordSets[difficulty].length) usedWords = [];

  // Pick unused word
  let word;
  let attempts = 0;
  do {
    word = wordSets[difficulty][Math.floor(Math.random() * wordSets[difficulty].length)];
    attempts++;
    if (attempts > 50) break;
  } while (usedWords.includes(word));

  currentWord = word;
  usedWords.push(currentWord);
  scrambledWord = shuffle(currentWord);

  const wordDisplay = document.querySelector(".scrambled-word");
  wordDisplay.textContent = scrambledWord;

  const input = document.getElementById("guessInput");
  input.value = "";
  input.focus();

  document.getElementById("message").textContent =
    `Difficulty: ${difficulty} (${currentWord.length} letters)`;

  startTimer();
}

// Timer
function startTimer() {
  clearInterval(timer);
  timerStarted = true;
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

// Check guess
function checkGuess() {
  const input = document.getElementById("guessInput");
  const guess = input.value.toLowerCase().trim();

  if (!guess) return;

  if (guess === currentWord) {
    score++;
    updateUI();
    document.getElementById("message").textContent = "✅ Correct!";
    setTimeout(newWord, 800);
  } else {
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 300);
    loseLife("❌ Wrong!");
  }

  input.value = "";
}

// Lose life
function loseLife(msg) {
  lives--;
  updateUI();
  document.getElementById("message").textContent = msg;

  if (lives <= 0) {
    showGameOver(); // show popup instead of new word
  } else {
    setTimeout(newWord, 800);
  }
}

// Reset game
function resetGame() {
  score = 0;
  lives = 3;
  usedWords = [];
  updateUI();
  newWord();
}

// Set difficulty
function setDifficulty() {
  difficulty = document.getElementById("difficulty").value;
  usedWords = [];
  newWord();
}

// Toggle theme
function toggleTheme() {
  document.body.classList.toggle("light");
}

// Confetti
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

// Game over popup
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

// Input triggers timer start
document.getElementById("guessInput").addEventListener("input", (e) => {
  if (!timerStarted) startTimer();
});

// Submit on Enter
document.getElementById("guessInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkGuess();
});

// Restart game on Enter if Game Over popup is visible
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const overlay = document.querySelector(".popup-overlay");
    if (overlay) {
      document.body.removeChild(overlay);
      resetGame();
    }
  }
});

// Pause/resume timer on tab visibility
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearInterval(timer);
  else if (timerStarted) startTimer();
});

// Initialize
updateUI();
newWord();