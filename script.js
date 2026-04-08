// -------------------------------
// Word Scramble Game Script
// Levels, unlimited words, instant start, progress bar
// -------------------------------

let currentWord = "";
let scrambledWord = "";
let score = 0;
let lives = 3;
let level = "easy";          
let correctInLevel = 0;      
let timer;
let timeLeft = 10;
let timerStarted = false;
let usedWords = [];
let wordQueue = [];
const WORD_BATCH_SIZE = 15;

// Fallback word lists
const fallbackWords = {
  easy: ["cat","dog","sun","book","tree","fish","hat","pen","cup","ball","bird","star","milk","chair","shoe","door","egg","car","key","leaf"],
  medium: ["javascript","keyboard","internet","computer","browser","picture","monster","holiday","pencil","guitar","library","diamond","teacher"],
  hard: ["algorithm","programming","development","application","microscope","astronomy","biochemistry","mathematics","psychology","architecture","philosophy"]
};

// -------------------------------
// Shuffle letters
function shuffle(word) {
  let shuffled;
  do {
    shuffled = word.split("").sort(() => Math.random() - 0.5).join("");
  } while (shuffled === word);
  return shuffled;
}

// -------------------------------
// Update UI
function updateUI(msg = "") {
  document.getElementById("score").textContent = "⭐ " + score;
  document.getElementById("lives").textContent = "❤️ " + lives;
  if(msg) document.getElementById("message").textContent = msg;
  else document.getElementById("message").textContent = `Guess the word!`;
  updateLevelBar();
}

// -------------------------------
// Update Level Progress Bar
function updateLevelBar() {
  const levelText = document.getElementById("levelText");
  const levelBar = document.getElementById("levelBar");

  // Text
  levelText.textContent = `Level: ${level.toUpperCase()} | Correct: ${correctInLevel}/5`;

  // Width percentage
  const percent = (correctInLevel / 5) * 100;
  levelBar.style.width = percent + "%";

  // Color based on level
  if(level === "easy") levelBar.style.background = "#4CAF50"; // green
  else if(level === "medium") levelBar.style.background = "#FFA500"; // orange
  else if(level === "hard") levelBar.style.background = "#FF4500"; // red
}

// -------------------------------
// Preload words in parallel
async function preloadWords(level) {
  const minLen = level === "easy" ? 3 : level === "medium" ? 6 : 9;
  const maxLen = level === "easy" ? 5 : level === "medium" ? 8 : 20;

  try {
    const res = await fetch(`https://random-word-api.herokuapp.com/word?number=${WORD_BATCH_SIZE}`);
    const data = await res.json();
    data.forEach(word => {
      word = word.toLowerCase();
      if(/^[a-z]+$/.test(word) && word.length >= minLen && word.length <= maxLen && !usedWords.includes(word)) {
        wordQueue.push(word);
      }
    });
  } catch {
    for(let i=0;i<WORD_BATCH_SIZE;i++){
      const fallback = fallbackWords[level][Math.floor(Math.random()*fallbackWords[level].length)];
      wordQueue.push(fallback);
    }
  }

  if(wordQueue.length === 0){
    for(let i=0;i<WORD_BATCH_SIZE;i++){
      const fallback = fallbackWords[level][Math.floor(Math.random()*fallbackWords[level].length)];
      wordQueue.push(fallback);
    }
  }
}

// -------------------------------
// New word
async function newWord() {
  clearInterval(timer);
  timerStarted = false;

  const wordDisplay = document.querySelector(".scrambled-word");
  wordDisplay.textContent = "Loading...";
  wordDisplay.classList.add("loading");

  // If queue empty, preload
  if(wordQueue.length === 0) preloadWords(level);

  // Use fallback immediately if queue empty
  let word = wordQueue.length > 0 ? wordQueue.shift() : fallbackWords[level][Math.floor(Math.random()*fallbackWords[level].length)];
  currentWord = word;
  usedWords.push(word);
  scrambledWord = shuffle(currentWord);

  wordDisplay.textContent = scrambledWord;
  wordDisplay.classList.remove("loading");

  const input = document.getElementById("guessInput");
  input.value = "";
  input.disabled = false;
  input.focus();

  // Refill queue in background if low
  if(wordQueue.length < 5) preloadWords(level);

  startTimer();
  updateUI();
}

// -------------------------------
// Timer
function startTimer() {
  clearInterval(timer);
  timerStarted = true;
  timeLeft = level === "easy" ? 12 : level === "hard" ? 8 : 10;
  document.getElementById("timer").textContent = "⏱ " + timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = "⏱ " + timeLeft;
    if(timeLeft <= 0){
      clearInterval(timer);
      loseLife("⏰ Time's up!");
    }
  }, 1000);
}

// -------------------------------
// Check guess
function checkGuess() {
  const input = document.getElementById("guessInput");
  const guess = input.value.toLowerCase().trim();
  if(!guess) return;

  if(guess === currentWord){
    score++;
    correctInLevel++;
    updateUI();
    updateLevelBar();

    if(correctInLevel >= 5){
      if(level === "easy") level = "medium";
      else if(level === "medium") level = "hard";
      correctInLevel = 0;
      updateUI(`🎉 Level Up! Now ${level.toUpperCase()}`);
      updateLevelBar();
    }

    setTimeout(newWord, 500);
  } else {
    input.classList.add("shake");
    setTimeout(()=>input.classList.remove("shake"), 300);
    loseLife("❌ Wrong!");
  }

  input.value = "";
}

// -------------------------------
// Lose life
function loseLife(msg) {
  lives--;
  updateUI(msg);
  if(lives <= 0) showGameOver();
  else setTimeout(newWord, 500);
}

// -------------------------------
// Reset game
function resetGame() {
  score = 0;
  lives = 3;
  level = "easy";
  correctInLevel = 0;
  usedWords = [];
  wordQueue = [];
  updateUI();
  updateLevelBar();
  newWord();
}

// -------------------------------
// Restart game
function restartGame() {
  const overlay = document.querySelector(".popup-overlay");
  if(overlay) document.body.removeChild(overlay);

  const input = document.getElementById("guessInput");
  input.disabled = false;

  resetGame();
}

// -------------------------------
// Game over popup
function showGameOver() {
  clearInterval(timer);
  const input = document.getElementById("guessInput");
  input.disabled = true;

  const highScoreKey = "highscore";
  const prevHigh = localStorage.getItem(highScoreKey) || 0;
  if(score > prevHigh) localStorage.setItem(highScoreKey, score);

  launchConfetti();

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

// -------------------------------
// Event listeners
document.getElementById("guessInput").addEventListener("input", () => {
  if(!timerStarted) startTimer();
});

document.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    const overlay = document.querySelector(".popup-overlay");
    if(overlay) restartGame();
    else checkGuess();
  }
});

document.addEventListener("visibilitychange", () => {
  if(document.hidden) clearInterval(timer);
  else if(timerStarted) startTimer();
});

function toggleTheme(){
  document.body.classList.toggle("light");
}

// -------------------------------
// Confetti
function launchConfetti(){
  const duration = 2000;
  const end = Date.now() + duration;
  const colors = ['#ffce00','#ff6f61','#6a5acd','#00ced1'];

  (function frame(){
    const timeLeft = end - Date.now();
    if(timeLeft <= 0) return;

    const particleCount = 5 + Math.random()*5;
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

// -------------------------------
// Initialize game
updateUI();
updateLevelBar();
preloadWords(level);
newWord();