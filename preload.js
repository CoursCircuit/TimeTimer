const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('timerWindow', {
  create: () => ipcRenderer.invoke('timer-window:create'),
  close: () => ipcRenderer.invoke('timer-window:close'),
  setShape: (shape) => ipcRenderer.invoke('timer-window:set-shape', shape),
});
