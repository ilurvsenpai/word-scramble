// Unlimited word game script

let currentWord = "";
let scrambledWord = "";
let score = 0;
let lives = 3;
let timeLeft = 10;
let timer;
let level = "easy";            // start at easy
let correctInLevel = 0;        // correct answers in current level
let timerStarted = false;
let usedWords = [];

// Fallback small lists in case API fails
const fallbackWords = {
  easy: ["cat","dog","sun","book","tree","fish","hat","pen","cup","ball"],
  medium: ["javascript","keyboard","internet","computer","browser","picture"],
  hard: ["algorithm","programming","development","application","microscope"]
};

// Shuffle letters
function shuffle(word) {
  let shuffled;
  do {
    shuffled = word.split("").sort(() => Math.random() - 0.5).join("");
  } while (shuffled === word);
  return shuffled;
}

// Update UI
function updateUI(msg="") {
  document.getElementById("score").textContent = "⭐ " + score;
  document.getElementById("lives").textContent = "❤️ " + lives;
  if(msg) document.getElementById("message").textContent = msg;
  else document.getElementById("message").textContent = `Level: ${level.toUpperCase()} | Correct in level: ${correctInLevel}/5`;
}

// Update level progress bar
function updateLevelBar() {
  const bar = document.getElementById("levelBar");
  const percent = (correctInLevel / 5) * 100;
  bar.style.width = percent + "%";

  // Change color per level
  if (level === "easy") bar.style.background = "#4CAF50";       // green
  else if (level === "medium") bar.style.background = "#FFA500"; // orange
  else if (level === "hard") bar.style.background = "#FF4500";   // red
}

// Fetch a random word from API
async function fetchRandomWord() {
  const minLen = level === "easy" ? 3 : level === "medium" ? 6 : 9;
  const maxLen = level === "easy" ? 5 : level === "medium" ? 8 : 20;

  try {
    const res = await fetch("https://random-word-api.herokuapp.com/word?number=1");
    const data = await res.json();
    const word = data[0].toLowerCase();
    if(/^[a-z]+$/.test(word) && word.length >= minLen && word.length <= maxLen) {
      if(!usedWords.includes(word)) return word;
    }
  } catch {
    // API failed
  }

  // fallback word
  const available = fallbackWords[level].filter(w => !usedWords.includes(w));
  if(available.length === 0) usedWords = []; // reset fallback used words
  return available[Math.floor(Math.random() * fallbackWords[level].length)];
}

// Create new word
async function newWord() {
  clearInterval(timer);
  timerStarted = false;

  const wordDisplay = document.querySelector(".scrambled-word");
  wordDisplay.textContent = "Loading...";
  wordDisplay.classList.add("loading");

  let word = await fetchRandomWord();
  currentWord = word;
  usedWords.push(word);

  scrambledWord = shuffle(currentWord);
  wordDisplay.textContent = scrambledWord;
  wordDisplay.classList.remove("loading");

  const input = document.getElementById("guessInput");
  input.value = "";
  input.disabled = false;
  input.focus();

  startTimer();
  updateUI();
  updateLevelBar();
}

// Timer
function startTimer() {
  clearInterval(timer);
  timerStarted = true;
  timeLeft = level === "easy" ? 12 : level === "hard" ? 8 : 10;
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
  if(!guess) return;

  if(guess === currentWord) {
    score++;
    correctInLevel++;
    updateUI();
    updateLevelBar();

    // Level up
    if(correctInLevel >= 5) {
      if(level === "easy") level = "medium";
      else if(level === "medium") level = "hard";
      correctInLevel = 0;
      updateLevelBar();
      updateUI(`🎉 Level Up! Now ${level.toUpperCase()}`);
    }

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
  updateUI(msg);
  if(lives <= 0) showGameOver();
  else setTimeout(newWord, 800);
}

// Reset game
function resetGame() {
  score = 0;
  lives = 3;
  level = "easy";
  correctInLevel = 0;
  usedWords = [];
  updateUI();
  updateLevelBar();
  newWord();
}

// Restart game from popup or Enter key
function restartGame() {
  const overlay = document.querySelector(".popup-overlay");
  if (overlay) document.body.removeChild(overlay);

  const input = document.getElementById("guessInput");
  input.disabled = false;

  resetGame();
}

// Game over popup
function showGameOver() {
  clearInterval(timer);

  const input = document.getElementById("guessInput");
  input.disabled = true;

  const highScoreKey = `highscore`;
  const prevHigh = localStorage.getItem(highScoreKey) || 0;

  if(score > prevHigh) {
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
    <p>High Score: ${Math.max(score, prevHigh)}</p>
    <button id="restartBtn">Play Again</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  document.getElementById("restartBtn").addEventListener("click", restartGame);
}

// Input triggers timer start
document.getElementById("guessInput").addEventListener("input", () => {
  if(!timerStarted) startTimer();
});

// Enter key handler
document.addEventListener("keydown", (e) => {
  if(e.key === "Enter") {
    const overlay = document.querySelector(".popup-overlay");
    if(overlay) restartGame();
    else checkGuess();
  }
});

// Pause/resume timer on tab visibility
document.addEventListener("visibilitychange", () => {
  if(document.hidden) clearInterval(timer);
  else if(timerStarted) startTimer();
});

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
    if(timeLeft <= 0) return;

    const particleCount = 5 + Math.random() * 5;
    for(let i=0;i<particleCount;i++){
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
      setTimeout(()=>{confetti.style.transform=`translateY(${window.innerHeight}px) rotate(${Math.random()*720}deg)`; confetti.style.opacity=0},10);
      setTimeout(()=>document.body.removeChild(confetti),1100);
    }
    requestAnimationFrame(frame);
  })();
}

// Initialize
updateUI();
updateLevelBar();
newWord();