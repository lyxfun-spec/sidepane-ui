const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sidepaneDesktop', {
  platform: process.platform,
  hideWindow: () => ipcRenderer.invoke('sidepane:hide-window'),
  beginResize: () => ipcRenderer.send('sidepane:begin-resize'),
  resizeTo: (screenX) => ipcRenderer.send('sidepane:resize-to', screenX),
  endResize: () => ipcRenderer.send('sidepane:end-resize'),
});
