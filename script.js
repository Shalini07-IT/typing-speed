/* =========================================================
   VelocityType — Typing Speed Test Logic
   Vanilla JavaScript, no dependencies.
   ========================================================= */

(() => {
  'use strict';

  /* ---------------- Paragraph bank ---------------- */
  const PARAGRAPHS = [
    "The quick brown fox jumps over the lazy dog while the sun sets behind the rolling hills of the countryside.",
    "Success is not final, failure is not fatal, it is the courage to continue that truly counts in the end.",
    "Programming is the art of telling another human what one wants the computer to do with absolute precision.",
    "The only way to do great work is to love what you do, and to keep pushing forward even when it gets hard.",
    "In the middle of every difficulty lies opportunity, waiting patiently for someone brave enough to find it.",
    "Technology is best when it brings people together and helps them accomplish things they never thought possible.",
    "The journey of a thousand miles begins with a single step, taken with confidence and an open mind.",
    "Creativity is intelligence having fun, exploring new ideas without fear of judgment or failure along the way.",
    "Every accomplishment starts with the decision to try, even when the outcome remains completely uncertain.",
    "Practice makes progress, not perfection, and every small improvement compounds into something remarkable over time.",
    "The stars are not afraid to appear like fireflies, scattered across a sky that never truly sleeps at night.",
    "A reader lives a thousand lives before they die, while a person who never reads lives only one.",
    "Life is what happens when you are busy making other plans, so cherish every single moment along the way.",
    "Simplicity is the ultimate sophistication, achieved only after removing everything that does not truly matter.",
    "The best time to plant a tree was twenty years ago, and the second best time is always right now."
  ];

  /* ---------------- Motivational quotes ---------------- */
  const QUOTES = [
    "Speed is earned, one keystroke at a time.",
    "Precision today becomes velocity tomorrow.",
    "Every typo is just a checkpoint on the way to mastery.",
    "Your fingers are learning faster than you think.",
    "Consistency beats intensity — keep showing up.",
    "Champions are built one accurate word at a time.",
    "The keyboard bends to those who practice daily.",
    "You're not just typing, you're training your reflexes."
  ];

  /* ---------------- State ---------------- */
  let state = {
    duration: 15,
    timeLeft: 15,
    timerId: null,
    isRunning: false,
    isFinished: false,
    paragraph: '',
    chars: [],          // array of span elements
    typedCount: 0,
    correctCount: 0,
    mistakes: 0,
    combo: 0,
    bestCombo: 0,
    startTime: null,
    history: [],         // wpm samples for live calc smoothing
  };

  /* ---------------- DOM refs ---------------- */
  const $ = (id) => document.getElementById(id);

  const paragraphDisplay = $('paragraphDisplay');
  const hiddenInput = $('hiddenInput');
  const typingCard = $('typingCard');
  const focusHint = $('focusHint');

  const timeLeftEl = $('timeLeft');
  const timerRing = $('timerRing');
  const progressFill = $('progressFill');

  const liveWpm = $('liveWpm');
  const liveCpm = $('liveCpm');
  const liveAccuracy = $('liveAccuracy');
  const liveMistakes = $('liveMistakes');
  const liveCombo = $('liveCombo');
  const comboChip = $('comboChip');

  const durationButtons = document.querySelectorAll('.duration-btn');
  const restartBtn = $('restartBtn');
  const themeToggle = $('themeToggle');
  const soundToggle = $('soundToggle');

  const testScreen = $('testScreen');
  const resultsScreen = $('resultsScreen');
  const confettiLayer = $('confettiLayer');

  const xpLevel = $('xpLevel');
  const xpText = $('xpText');
  const xpFill = $('xpFill');

  const bestWpmDisplay = $('bestWpmDisplay');

  const RING_CIRC = 2 * Math.PI * 34; // matches r=34 in SVG

  /* ---------------- LocalStorage keys ---------------- */
  const LS_BEST = 'velocitytype_best_wpm';
  const LS_XP = 'velocitytype_xp';
  const LS_THEME = 'velocitytype_theme';

  /* ============================================================
     INITIALISATION
     ============================================================ */
  function init() {
    timerRing.style.strokeDasharray = RING_CIRC;
    timerRing.style.strokeDashoffset = 0;

    loadTheme();
    spawnParticles(28);
    loadBestScore();
    loadXP();
    bindEvents();
    loadParagraph();
  }

  /* ============================================================
     PARTICLES
     ============================================================ */
  function spawnParticles(count) {
    const container = $('particles');
    const colors = ['#5ff2ff', '#ff5fd1', '#a463ff', '#4dff9e'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 2 + Math.random() * 5;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = `radial-gradient(circle, ${colors[i % colors.length]}, transparent)`;
      const duration = 12 + Math.random() * 14;
      p.style.animationDuration = `${duration}s`;
      p.style.animationDelay = `-${Math.random() * duration}s`;
      container.appendChild(p);
    }
  }

  /* ============================================================
     THEME
     ============================================================ */
  function loadTheme() {
    const saved = localStorage.getItem(LS_THEME);
    if (saved === 'light') document.body.classList.add('light');
  }
  function toggleTheme() {
    document.body.classList.toggle('light');
    localStorage.setItem(LS_THEME, document.body.classList.contains('light') ? 'light' : 'dark');
  }

  /* ============================================================
     BEST SCORE / XP (LocalStorage)
     ============================================================ */
  function loadBestScore() {
    const best = parseInt(localStorage.getItem(LS_BEST) || '0', 10);
    bestWpmDisplay.textContent = best;
  }
  function saveBestScore(wpm) {
    const best = parseInt(localStorage.getItem(LS_BEST) || '0', 10);
    if (wpm > best) {
      localStorage.setItem(LS_BEST, String(wpm));
      bestWpmDisplay.textContent = wpm;
      return true;
    }
    return false;
  }

  function loadXP() {
    const xp = parseInt(localStorage.getItem(LS_XP) || '0', 10);
    renderXP(xp);
  }
  function addXP(amount) {
    let xp = parseInt(localStorage.getItem(LS_XP) || '0', 10);
    xp += amount;
    localStorage.setItem(LS_XP, String(xp));
    renderXP(xp, true);
  }
  function renderXP(xp, animate) {
    const level = Math.floor(xp / 100) + 1;
    const into = xp % 100;
    xpLevel.textContent = level;
    xpText.textContent = `${into} / 100 XP`;
    requestAnimationFrame(() => {
      xpFill.style.width = `${into}%`;
    });
  }

  /* ============================================================
     PARAGRAPH RENDERING
     ============================================================ */
  function loadParagraph() {
    const text = PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)];
    state.paragraph = text;
    paragraphDisplay.innerHTML = '';
    state.chars = [];

    text.split('').forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      paragraphDisplay.appendChild(span);
      state.chars.push(span);
    });
    if (state.chars.length) state.chars[0].classList.add('current');
  }

  /* ============================================================
     TEST LIFECYCLE
     ============================================================ */
  function resetState(newParagraph = true) {
    clearInterval(state.timerId);
    state.timeLeft = state.duration;
    state.isRunning = false;
    state.isFinished = false;
    state.typedCount = 0;
    state.correctCount = 0;
    state.mistakes = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.startTime = null;
    state.history = [];

    timeLeftEl.textContent = state.timeLeft;
    timerRing.style.strokeDashoffset = 0;
    timerRing.classList.remove('warning');
    progressFill.style.width = '0%';

    liveWpm.textContent = '0';
    liveCpm.textContent = '0';
    liveAccuracy.innerHTML = '100<small>%</small>';
    liveMistakes.textContent = '0';
    liveCombo.textContent = '0';
    comboChip.classList.remove('on-fire');

    hiddenInput.value = '';
    focusHint.style.opacity = '1';
    typingCard.classList.remove('focused');

    if (newParagraph) loadParagraph();
  }

  function startTest() {
    if (state.isRunning || state.isFinished) return;
    state.isRunning = true;
    state.startTime = Date.now();

    state.timerId = setInterval(() => {
      state.timeLeft--;
      timeLeftEl.textContent = state.timeLeft;

      const elapsedFrac = (state.duration - state.timeLeft) / state.duration;
      timerRing.style.strokeDashoffset = RING_CIRC * elapsedFrac;
      progressFill.style.width = `${elapsedFrac * 100}%`;

      if (state.timeLeft <= 5) timerRing.classList.add('warning');

      updateLiveStats();

      if (state.timeLeft <= 0) {
        finishTest();
      }
    }, 1000);
  }

  function finishTest() {
    clearInterval(state.timerId);
    state.isRunning = false;
    state.isFinished = true;

    const finalWpmVal = calcWPM();
    const finalCpmVal = calcCPM();
    const finalAccVal = calcAccuracy();

    showResults(finalWpmVal, finalCpmVal, finalAccVal);
  }

  /* ============================================================
     STAT CALCULATIONS
     ============================================================ */
  function calcWPM() {
    const elapsedMin = (state.duration - state.timeLeft) / 60 || (1 / 60);
    const words = state.correctCount / 5;
    return Math.max(0, Math.round(words / elapsedMin));
  }
  function calcCPM() {
    const elapsedMin = (state.duration - state.timeLeft) / 60 || (1 / 60);
    return Math.max(0, Math.round(state.correctCount / elapsedMin));
  }
  function calcAccuracy() {
    if (state.typedCount === 0) return 100;
    return Math.max(0, Math.round((state.correctCount / state.typedCount) * 100));
  }

  function updateLiveStats() {
    animateStatUpdate(liveWpm, calcWPM());
    animateStatUpdate(liveCpm, calcCPM());
    const acc = calcAccuracy();
    liveAccuracy.innerHTML = `${acc}<small>%</small>`;
    liveMistakes.textContent = state.mistakes;
    liveCombo.textContent = state.combo;
  }

  function animateStatUpdate(el, value) {
    if (el.textContent === String(value)) return;
    el.textContent = value;
    el.classList.remove('glow-pulse');
    void el.offsetWidth; // reflow to restart animation
    el.classList.add('glow-pulse');
  }

  /* ============================================================
     TYPING HANDLER
     ============================================================ */
  function handleInput() {
    if (state.isFinished) return;
    if (!state.isRunning) startTest();

    const typedValue = hiddenInput.value;
    const idx = typedValue.length - 1;

    // Handle backspace: rebuild full comparison each time for robustness.
    rebuildComparison(typedValue);

    if (typedValue.length >= state.chars.length) {
      // Completed paragraph early — load a fresh one to keep typing for remaining time
      loadParagraph();
      hiddenInput.value = '';
    }
  }

  function rebuildComparison(typedValue) {
    let correct = 0;
    let mistakesThisPass = 0;

    for (let i = 0; i < state.chars.length; i++) {
      const span = state.chars[i];
      span.classList.remove('current');

      if (i < typedValue.length) {
        const typedChar = typedValue[i];
        const targetChar = state.paragraph[i];
        if (typedChar === targetChar) {
          if (!span.classList.contains('correct')) {
            span.classList.remove('incorrect');
            span.classList.add('correct');
          }
          correct++;
        } else {
          if (!span.classList.contains('incorrect')) {
            span.classList.remove('correct');
            span.classList.add('incorrect');
            mistakesThisPass++;
          }
        }
      } else {
        span.classList.remove('correct', 'incorrect');
      }
    }

    // Track newly made mistake (compare last char only, to avoid double counting)
    const lastIdx = typedValue.length - 1;
    if (lastIdx >= 0 && lastIdx < state.chars.length) {
      const lastSpan = state.chars[lastIdx];
      const isCorrect = lastSpan.classList.contains('correct');
      if (typedValue.length > state.typedCount) {
        // New character typed forward
        state.typedCount = typedValue.length;
        if (isCorrect) {
          state.correctCount++;
          state.combo++;
          state.bestCombo = Math.max(state.bestCombo, state.combo);
          if (state.combo > 0 && state.combo % 15 === 0) {
            comboChip.classList.add('on-fire');
          }
        } else {
          state.mistakes++;
          state.combo = 0;
          comboChip.classList.remove('on-fire');
          typingCard.classList.remove('shake');
          void typingCard.offsetWidth;
          typingCard.classList.add('shake');
          playSound('error');
        }
        if (isCorrect) playSound('key');
      }
    }

    // Set current cursor position
    if (typedValue.length < state.chars.length) {
      state.chars[typedValue.length].classList.add('current');
    }

    updateLiveStats();
  }

  /* ============================================================
     SOUND (optional, generated via WebAudio — no external files)
     ============================================================ */
  let audioCtx = null;
  function playSound(type) {
    if (!soundToggle.checked) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = type === 'error' ? 160 : 440 + Math.random() * 120;
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) { /* audio not available — silently ignore */ }
  }

  /* ============================================================
     RESULTS SCREEN
     ============================================================ */
  function getMedal(wpm) {
    if (wpm >= 80) return { name: 'Master', emoji: '👑' };
    if (wpm >= 60) return { name: 'Expert', emoji: '🏆' };
    if (wpm >= 35) return { name: 'Intermediate', emoji: '🥈' };
    return { name: 'Beginner', emoji: '🥉' };
  }

  function showResults(wpm, cpm, accuracy) {
    testScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');

    const medal = getMedal(wpm);
    $('medalBadge').textContent = `${medal.emoji} ${medal.name}`;
    $('trophyIcon').textContent = medal.emoji;
    $('motivationQuote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    countUp($('finalWpm'), wpm);
    countUp($('finalCpm'), cpm);
    countUp($('finalMistakes'), state.mistakes);
    countUp($('finalCombo'), state.bestCombo);

    $('finalAccuracy').innerHTML = `${accuracy}<small>%</small>`;

    const wasNewBest = saveBestScore(wpm);
    const best = parseInt(localStorage.getItem(LS_BEST) || '0', 10);
    countUp($('finalBest'), best);
    $('newBestCard').style.outline = wasNewBest ? `2px solid var(--neon-yellow)` : 'none';

    // XP reward: based on wpm + accuracy + small bonus for combo
    const xpEarned = Math.round(wpm * 0.6 + accuracy * 0.3 + state.bestCombo * 0.2);
    addXP(Math.max(5, xpEarned));

    launchConfetti();
  }

  function countUp(el, target) {
    const duration = 800;
    const start = 0;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + (target - start) * eased);
      const hasSmall = el.querySelector('small');
      el.textContent = value;
      if (hasSmall) el.innerHTML = `${value}<small>%</small>`;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function launchConfetti() {
    confettiLayer.innerHTML = '';
    const colors = ['#5ff2ff', '#ff5fd1', '#a463ff', '#4dff9e', '#ffd86b'];
    const count = 70;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
      piece.style.animationDelay = `${Math.random() * 0.6}s`;
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      confettiLayer.appendChild(piece);
    }
    // Clean up after animation finishes
    setTimeout(() => { confettiLayer.innerHTML = ''; }, 6000);
  }

  /* ============================================================
     RIPPLE EFFECT
     ============================================================ */
  function attachRipple(el) {
    el.addEventListener('click', (e) => {
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  }

  /* ============================================================
     EVENT BINDING
     ============================================================ */
  function bindEvents() {
    // Duration selection
    durationButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        durationButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.duration = parseInt(btn.dataset.time, 10);
        resetState(true);
      });
    });

    // Typing card focus
    typingCard.addEventListener('click', () => {
      hiddenInput.focus();
    });
    hiddenInput.addEventListener('focus', () => {
      typingCard.classList.add('focused');
    });
    hiddenInput.addEventListener('blur', () => {
      typingCard.classList.remove('focused');
    });
    hiddenInput.addEventListener('input', handleInput);

    // Prevent paste cheating
    hiddenInput.addEventListener('paste', (e) => e.preventDefault());

    // Restart
    restartBtn.addEventListener('click', () => resetState(true));
    attachRipple(restartBtn);

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Results screen actions
    $('tryAgainBtn').addEventListener('click', () => {
      resultsScreen.classList.add('hidden');
      testScreen.classList.remove('hidden');
      resetState(true);
    });
    attachRipple($('tryAgainBtn'));

    $('changeTimeBtn').addEventListener('click', () => {
      resultsScreen.classList.add('hidden');
      testScreen.classList.remove('hidden');
      resetState(true);
      document.querySelector('.control-bar').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    attachRipple($('changeTimeBtn'));

    // Click anywhere on test screen background also focuses input for convenience
    document.addEventListener('keydown', (e) => {
      if (!resultsScreen.classList.contains('hidden')) return;
      if (document.activeElement !== hiddenInput && e.key.length === 1) {
        hiddenInput.focus();
      }
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', init);
})();
