const path = require('node:path');
const { app, BrowserWindow, ipcMain, screen } = require('electron');

const WINDOW_SIZES = Object.freeze({
  circle: { width: 352, height: 430 },
  bar: { width: 440, height: 276 },
});

const timerWindows = new Set();
let nextWindowNumber = 1;

if (process.platform === 'darwin') {
  app.setActivationPolicy('accessory');
}

function configureFloatingWindow(window) {
  const level = process.platform === 'darwin' ? 'screen-saver' : 'floating';

  if (process.platform === 'darwin') {
    window.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    });
  }

  window.setAlwaysOnTop(true, level);
  window.setFullScreenable(false);
}

function raiseFloatingWindow(window) {
  if (!window || window.isDestroyed()) return;
  configureFloatingWindow(window);
  window.moveTop();
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function boundsForNewWindow(anchorWindow) {
  const size = WINDOW_SIZES.circle;

  if (!anchorWindow || anchorWindow.isDestroyed()) {
    return size;
  }

  const anchorBounds = anchorWindow.getBounds();
  const displayBounds = screen.getDisplayMatching(anchorBounds).workArea;
  const offset = 28;
  let x = anchorBounds.x + offset;
  let y = anchorBounds.y + offset;

  if (x + size.width > displayBounds.x + displayBounds.width) {
    x = displayBounds.x + offset;
  }

  if (y + size.height > displayBounds.y + displayBounds.height) {
    y = displayBounds.y + offset;
  }

  return { ...size, x, y };
}

function resizeWindowForShape(window, shape) {
  const size = WINDOW_SIZES[shape];
  if (!size || !window || window.isDestroyed()) return;

  const current = window.getBounds();
  const displayBounds = screen.getDisplayMatching(current).workArea;
  const centeredX = current.x + Math.round((current.width - size.width) / 2);
  const centeredY = current.y + Math.round((current.height - size.height) / 2);
  const x = clamp(
    centeredX,
    displayBounds.x,
    displayBounds.x + displayBounds.width - size.width,
  );
  const y = clamp(
    centeredY,
    displayBounds.y,
    displayBounds.y + displayBounds.height - size.height,
  );

  window.setBounds({ x, y, ...size }, process.platform === 'darwin');
  configureFloatingWindow(window);
}

function createTimerWindow(anchorWindow = null) {
  const initialBounds = boundsForNewWindow(anchorWindow);
  const windowNumber = nextWindowNumber;
  nextWindowNumber += 1;

  const window = new BrowserWindow({
    ...initialBounds,
    title: `TimeTimer ${windowNumber}`,
    backgroundColor: '#00000000',
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    acceptFirstMouse: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  timerWindows.add(window);
  configureFloatingWindow(window);

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:')) event.preventDefault();
  });

  window.once('ready-to-show', () => {
    window.showInactive();
    raiseFloatingWindow(window);
    setTimeout(() => raiseFloatingWindow(window), 250);
  });

  window.on('closed', () => {
    timerWindows.delete(window);
  });

  window.loadFile(path.join(__dirname, 'index.html'));
  return window;
}

function windowFromEvent(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

ipcMain.handle('timer-window:create', (event) => {
  const sourceWindow = windowFromEvent(event);
  const newWindow = createTimerWindow(sourceWindow);
  return { id: newWindow.id };
});

ipcMain.handle('timer-window:close', (event) => {
  const sourceWindow = windowFromEvent(event);
  if (sourceWindow && !sourceWindow.isDestroyed()) sourceWindow.close();
  return true;
});

ipcMain.handle('timer-window:set-shape', (event, shape) => {
  const sourceWindow = windowFromEvent(event);
  if (shape === 'circle' || shape === 'bar') {
    resizeWindowForShape(sourceWindow, shape);
  }
  return true;
});

app.whenReady().then(() => {
  createTimerWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createTimerWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
