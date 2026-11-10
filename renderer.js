'use strict';

const widget = document.getElementById('widget');
const ringValue = document.getElementById('ring-value');
const barValue = document.getElementById('bar-value');
const circleTime = document.getElementById('circle-time');
const barTime = document.getElementById('bar-time');
const accessibleTime = document.getElementById('accessible-time');
const minuteInput = document.getElementById('minutes');
const secondInput = document.getElementById('seconds');
const timeInputs = document.getElementById('time-inputs');
const modeToggle = document.getElementById('mode-toggle');
const shapeToggle = document.getElementById('shape-toggle');
const addWindowButton = document.getElementById('add-window');
const deleteWindowButton = document.getElementById('delete-window');
const playPauseButton = document.getElementById('play-pause');
const resetButton = document.getElementById('reset');
const bell = document.getElementById('bell');

const desktopWindow = window.timerWindow ?? {
  create: async () => null,
  close: async () => window.close(),
  setShape: async () => null,
};

const state = {
  mode: 'timer',
  shape: 'circle',
  running: false,
  completed: false,
  durationMs: 5 * 60 * 1000,
  accumulatedMs: 0,
  startedAt: 0,
  frameId: null,
  lastAnnouncedSecond: null,
};

function clampInteger(value, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return minimum;
  return Math.min(Math.max(parsed, minimum), maximum);
}

function normalizeInputs() {
  minuteInput.value = String(clampInteger(minuteInput.value, 0, 599));
  secondInput.value = String(clampInteger(secondInput.value, 0, 59));
}

function durationFromInputs() {
  const minutes = clampInteger(minuteInput.value, 0, 599);
  const seconds = clampInteger(secondInput.value, 0, 59);
  return (minutes * 60 + seconds) * 1000;
}

function formatTime(milliseconds, roundUp = false) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalSeconds = roundUp
    ? Math.ceil(safeMilliseconds / 1000)
    : Math.floor(safeMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const padded = (value) => String(value).padStart(2, '0');

  if (hours > 0) return `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`;
  return `${padded(minutes)}:${padded(seconds)}`;
}

function currentElapsed(now = performance.now()) {
  if (!state.running) return state.accumulatedMs;
  return state.accumulatedMs + Math.max(0, now - state.startedAt);
}

function displayedMilliseconds(now = performance.now()) {
  const elapsed = currentElapsed(now);
  if (state.mode === 'stopwatch') return elapsed;
  return Math.max(0, state.durationMs - elapsed);
}

function progressRatio(now = performance.now()) {
  const elapsed = currentElapsed(now);

  if (state.mode === 'timer') {
    if (state.durationMs <= 0) return 0;
    return Math.max(0, Math.min(1, (state.durationMs - elapsed) / state.durationMs));
  }

  return (elapsed % 60000) / 60000;
}

function updateTimeReadout(now = performance.now()) {
  const milliseconds = displayedMilliseconds(now);
  const formatted = formatTime(milliseconds, state.mode === 'timer');
  const ratio = progressRatio(now);

  circleTime.value = formatted;
  circleTime.textContent = formatted;
  barTime.value = formatted;
  barTime.textContent = formatted;
  ringValue.style.strokeDashoffset = String(1 - ratio);
  barValue.style.transform = `scaleX(${ratio})`;

  const announcedSecond = Math.floor(milliseconds / 1000);
  if (announcedSecond !== state.lastAnnouncedSecond) {
    accessibleTime.value = formatted;
    accessibleTime.textContent = formatted;
    state.lastAnnouncedSecond = announcedSecond;
  }
}

function updateControls() {
  widget.dataset.mode = state.mode;
  widget.dataset.shape = state.shape;
  widget.dataset.running = String(state.running);
  timeInputs.hidden = state.mode === 'stopwatch';
  minuteInput.disabled = state.running;
  secondInput.disabled = state.running;

  const nextMode = state.mode === 'timer' ? 'chronomètre' : 'timer';
  modeToggle.title = `Passer au ${nextMode}`;
  modeToggle.setAttribute('aria-label', `Passer au ${nextMode}`);
  modeToggle.setAttribute('aria-pressed', String(state.mode === 'stopwatch'));

  const nextShape = state.shape === 'circle' ? 'une barre' : 'un cercle';
  shapeToggle.title = `Afficher ${nextShape}`;
  shapeToggle.setAttribute('aria-label', `Afficher ${nextShape}`);
  shapeToggle.setAttribute('aria-pressed', String(state.shape === 'bar'));

  const transportLabel = state.running ? 'Mettre en pause' : 'Démarrer';
  playPauseButton.title = transportLabel;
  playPauseButton.setAttribute('aria-label', transportLabel);
}

function cancelFrame() {
  if (state.frameId !== null) {
    cancelAnimationFrame(state.frameId);
    state.frameId = null;
  }
}

function playBell() {
  if (!bell) return;
  bell.pause();
  bell.currentTime = 0;
  bell.play().catch(() => {});
}

function finishCountdown() {
  state.running = false;
  state.completed = true;
  state.accumulatedMs = state.durationMs;
  state.startedAt = 0;
  cancelFrame();
  updateTimeReadout();
  updateControls();
  playBell();
}

function tick(now) {
  if (!state.running) return;

  if (state.mode === 'timer' && currentElapsed(now) >= state.durationMs) {
    finishCountdown();
    return;
  }

  updateTimeReadout(now);
  state.frameId = requestAnimationFrame(tick);
}

function showInvalidDuration() {
  timeInputs.classList.remove('invalid');
  void timeInputs.offsetWidth;
  timeInputs.classList.add('invalid');
  minuteInput.focus();
}

function start() {
  if (state.mode === 'timer') {
    if (state.completed) {
      state.accumulatedMs = 0;
      state.completed = false;
    }

    if (state.accumulatedMs === 0) state.durationMs = durationFromInputs();
    if (state.durationMs <= 0) {
      showInvalidDuration();
      return;
    }
  }

  state.startedAt = performance.now();
  state.running = true;
  updateControls();
  cancelFrame();
  state.frameId = requestAnimationFrame(tick);
}

function pause() {
  if (!state.running) return;
  state.accumulatedMs = currentElapsed();
  state.startedAt = 0;
  state.running = false;
  cancelFrame();
  updateTimeReadout();
  updateControls();
}

function reset() {
  cancelFrame();
  state.running = false;
  state.completed = false;
  state.accumulatedMs = 0;
  state.startedAt = 0;
  state.lastAnnouncedSecond = null;

  if (state.mode === 'timer') {
    normalizeInputs();
    state.durationMs = durationFromInputs();
  }

  updateTimeReadout();
  updateControls();
}

function togglePlayPause() {
  if (state.running) pause();
  else start();
}

function changeMode() {
  pause();
  state.mode = state.mode === 'timer' ? 'stopwatch' : 'timer';
  reset();
}

async function changeShape() {
  state.shape = state.shape === 'circle' ? 'bar' : 'circle';
  updateControls();
  await desktopWindow.setShape(state.shape);
}

function handleInputChange() {
  if (state.running) return;
  state.completed = false;
  state.accumulatedMs = 0;
  state.durationMs = durationFromInputs();
  updateTimeReadout();
}

modeToggle.addEventListener('click', changeMode);
shapeToggle.addEventListener('click', () => {
  changeShape().catch(() => {});
});
addWindowButton.addEventListener('click', () => {
  desktopWindow.create().catch(() => {});
});
deleteWindowButton.addEventListener('click', () => {
  desktopWindow.close().catch(() => {});
});
playPauseButton.addEventListener('click', togglePlayPause);
resetButton.addEventListener('click', reset);

[minuteInput, secondInput].forEach((input) => {
  input.addEventListener('input', handleInputChange);
  input.addEventListener('blur', () => {
    normalizeInputs();
    handleInputChange();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') togglePlayPause();
  });
});

document.addEventListener('keydown', (event) => {
  const isEditing = event.target instanceof HTMLInputElement;
  if (!isEditing && event.code === 'Space') {
    event.preventDefault();
    togglePlayPause();
  }
  if (!isEditing && event.key.toLowerCase() === 'r') reset();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.running) {
    cancelFrame();
    state.frameId = requestAnimationFrame(tick);
  }
});

window.addEventListener('beforeunload', cancelFrame);

reset();
