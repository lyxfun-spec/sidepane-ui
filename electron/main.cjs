const path = require('node:path');
const fs = require('node:fs');
const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  shell,
} = require('electron');

const DEFAULT_WIDTH = 440;
const MIN_WIDTH = 360;
const MAX_WIDTH = 720;
const SLIDE_DURATION = 220;
const WINDOWS_SHELL_DISMISS_DELAY = 160;
const TOGGLE_SHORTCUT = 'CommandOrControl+Shift+Space';
const TRAY_ICON_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAJ3SURBVFhH7Vc9TBRBFJ6SktKS0pLSktKSkg4K3CXGAjtiRUFCZSA20GGhuZIYCyszgxIhYAIYEiAmYgxKLsGsBs0qJ475Zm7P2fdmZ3/CdXzJF9i7mfd9M/Pemz0hrtEUk3JYxHKkRzz3FeNyQMRyQsSqJWKViljpAq6KSE6JcTlIQzQHAkbq1CMWYiIiOW2MNwZWEakNT/A6PBCxHKKhy4FJkTr2BGzCxORJZdiVX5V4RhzJTSrFgTOruO0jD3f17POPenRpn33nJRZVmpxIHDqxgBAHVt6csu8CXKCS/2FXX5jtWPHQg83es8/A4P31sh1JxV15g0pboNz4BMPbj97p9OJSH5+lPRPUAMR3Pp2bzyYeH7IYDueptEWsXngGGw7PvdXJz44JnplwDbjiMArDNIbDAyptMz/c4ZiJxZcn5v+nW+064pasIqbkLTbIQ9dE9vfrj4t64mAkR/MG8AEd5JSay+W1L0bMRefyr36y2WZjMZ/G7BqYpga8CZidc1NgPo1pKWfzBu7IMT5ImWyWR0mOr99/0+e//uSEsCMbH76zsYXVEMmZvAFzr3sGErrZjm0HfnfscbglWkosOAc0BzooII4V48yBZ3tnrETpXEYkPUPgDqDiyHa3D9ASDZpAt/UCiUEHd5mJuaVGO6FrIng/RGqFSlvYYyhsRktrn3N1Tg1kJlrbbT1w7xWb32Pw/RG3FZ1QQJ+BClylknlgFwI3osva7wPYXdaCfbBtufAoGpOVXgi2MV2hCdr5qsA2p4QHq8W03sopbGXgxwgNXIX4kVLhzKsApYP6LU9Q7Fir3mt4XSBJzcsrGleX9rmPon3CP+9ELTRPGvLsAAAAAElFTkSuQmCC';

let mainWindow = null;
let tray = null;
let quitting = false;
let docking = false;
let customResizing = false;
let saveTimer = null;
let animationId = 0;
let animationDirection = null;
let shapedWindowSize = null;
let windowState = {
  width: DEFAULT_WIDTH,
  displayId: null,
};

function appIcon(size = 32) {
  return nativeImage
    .createFromBuffer(Buffer.from(TRAY_ICON_BASE64, 'base64'))
    .resize({ width: size, height: size });
}

function stateFilePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  try {
    const saved = JSON.parse(fs.readFileSync(stateFilePath(), 'utf8'));
    windowState = {
      width: Number.isFinite(saved.width) ? saved.width : DEFAULT_WIDTH,
      displayId:
        typeof saved.displayId === 'number' ? saved.displayId : null,
    };
  } catch {
    // 首次启动或状态文件损坏时使用默认值。
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getBounds();
  const display = screen.getDisplayMatching(bounds);
  windowState.displayId = display.id;

  try {
    fs.mkdirSync(path.dirname(stateFilePath()), { recursive: true });
    fs.writeFileSync(stateFilePath(), JSON.stringify(windowState, null, 2));
  } catch (error) {
    console.error('无法保存窗口状态：', error);
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveWindowState, 250);
}

function displayFromSavedState() {
  const displays = screen.getAllDisplays();
  return (
    displays.find((display) => display.id === windowState.displayId) ??
    screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  );
}

function sidebarBounds(display, hidden = false) {
  const area = display.workArea;
  const width = Math.min(
    Math.max(windowState.width, MIN_WIDTH),
    Math.min(MAX_WIDTH, area.width)
  );
  return {
    x: hidden ? area.x + area.width + 2 : area.x + area.width - width,
    y: area.y,
    width,
    height: area.height,
  };
}

function setMainWindowBounds(bounds) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setBounds(bounds, false);

  if (
    process.platform === 'win32' &&
    (shapedWindowSize?.width !== bounds.width ||
      shapedWindowSize?.height !== bounds.height)
  ) {
    mainWindow.setShape([
      {
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height,
      },
    ]);
    shapedWindowSize = { width: bounds.width, height: bounds.height };
  }
}

function dockToDisplay(display) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const bounds = sidebarBounds(display);
  docking = true;
  setMainWindowBounds(bounds);
  windowState.width = bounds.width;
  windowState.displayId = display.id;
  setTimeout(() => {
    docking = false;
  }, 150);
  scheduleSave();
}

function beginSidebarResize() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  animationId += 1;
  animationDirection = null;
  customResizing = true;
  docking = true;
}

function resizeSidebarTo(screenX) {
  if (
    !customResizing ||
    !mainWindow ||
    mainWindow.isDestroyed() ||
    !Number.isFinite(screenX)
  ) {
    return;
  }

  const display = screen.getDisplayMatching(mainWindow.getBounds());
  const area = display.workArea;
  windowState.width = Math.min(
    Math.max(Math.round(area.x + area.width - screenX), MIN_WIDTH),
    Math.min(MAX_WIDTH, area.width)
  );
  windowState.displayId = display.id;
  setMainWindowBounds(sidebarBounds(display));
}

function endSidebarResize() {
  if (!customResizing) return;
  customResizing = false;
  docking = false;
  scheduleSave();
}

function animateSidebar(
  showing,
  display,
  { focus = true, restoreAlwaysOnTop = false } = {}
) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const id = ++animationId;
  const visibleBounds = sidebarBounds(display);
  const hiddenBounds = sidebarBounds(display, true);
  const wasVisible = mainWindow.isVisible();
  const currentBounds = mainWindow.getBounds();

  animationDirection = showing ? 'showing' : 'hiding';
  docking = true;
  windowState.width = visibleBounds.width;
  windowState.displayId = display.id;

  let startX = currentBounds.x;
  if (showing && !wasVisible) {
    startX = hiddenBounds.x;
    setMainWindowBounds(hiddenBounds);
    mainWindow.showInactive();
  }

  if (showing && focus) mainWindow.focus();

  const endX = showing ? visibleBounds.x : hiddenBounds.x;
  let startedAt = 0;

  const step = () => {
    if (id !== animationId || !mainWindow || mainWindow.isDestroyed()) return;
    const progress = Math.min((performance.now() - startedAt) / SLIDE_DURATION, 1);
    const eased = showing
      ? 1 - Math.pow(1 - progress, 3)
      : Math.pow(progress, 3);
    const x = Math.round(startX + (endX - startX) * eased);

    setMainWindowBounds({
      ...visibleBounds,
      x,
    });

    if (progress < 1) {
      setTimeout(step, 16);
      return;
    }

    animationDirection = null;
    docking = false;
    if (!showing) {
      mainWindow.hide();
    }
    scheduleSave();
    rebuildTrayMenu();
  };

  const startAnimation = () => {
    if (id !== animationId || !mainWindow || mainWindow.isDestroyed()) return;
    if (restoreAlwaysOnTop) mainWindow.setAlwaysOnTop(true, 'floating');
    startedAt = performance.now();
    step();
  };

  if (restoreAlwaysOnTop && process.platform === 'win32') {
    setTimeout(startAnimation, WINDOWS_SHELL_DISMISS_DELAY);
  } else {
    startAnimation();
  }
}

function showWindow({ followCursor = false, focus = true, dismissShell = false } = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const restoreAlwaysOnTop = process.platform === 'win32' && dismissShell;
  mainWindow.setAlwaysOnTop(!restoreAlwaysOnTop, 'floating');
  const display = followCursor
    ? screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    : displayFromSavedState();
  animateSidebar(true, display, { focus, restoreAlwaysOnTop });
}

function hideWindow() {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()) return;
  const display = screen.getDisplayMatching(mainWindow.getBounds());
  animateSidebar(false, display, { focus: false });
}

function toggleWindow({ dismissShell = false } = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (animationDirection === 'showing' || (mainWindow.isVisible() && animationDirection !== 'hiding')) {
    hideWindow();
  } else {
    showWindow({ followCursor: true, dismissShell });
  }
  rebuildTrayMenu();
}

function rebuildTrayMenu() {
  if (!tray || !mainWindow || mainWindow.isDestroyed()) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: mainWindow.isVisible() ? '隐藏 SidePane AI' : '显示 SidePane AI',
        click: toggleWindow,
      },
      {
        label: '移到当前屏幕',
        click: () => showWindow({ followCursor: true }),
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ])
  );
}

function createTray() {
  tray = new Tray(appIcon(16));
  tray.setToolTip('SidePane AI');
  tray.on('click', () => toggleWindow({ dismissShell: true }));
  rebuildTrayMenu();
}

function createWindow() {
  const display = displayFromSavedState();
  const area = display.workArea;
  const width = Math.min(
    Math.max(windowState.width, MIN_WIDTH),
    Math.min(MAX_WIDTH, area.width)
  );

  mainWindow = new BrowserWindow({
    x: area.x + area.width - width,
    y: area.y,
    width,
    height: area.height,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
    frame: false,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: process.platform === 'win32',
    movable: false,
    resizable: false,
    thickFrame: false,
    hasShadow: false,
    roundedCorners: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    title: 'SidePane AI',
    icon: appIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setAlwaysOnTop(true, 'floating');
  if (process.platform === 'darwin') {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  }

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => showWindow());
  mainWindow.on('show', rebuildTrayMenu);
  mainWindow.on('hide', rebuildTrayMenu);
  mainWindow.on('close', (event) => {
    if (quitting) return;
    event.preventDefault();
    hideWindow();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
}

const gotLock = app.requestSingleInstanceLock();
if (process.platform === 'win32') app.setAppUserModelId('com.sidepane.ai');
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow({ followCursor: true }));

  app.whenReady().then(() => {
    if (process.platform === 'darwin') app.dock?.hide();
    loadWindowState();
    createWindow();
    createTray();
    globalShortcut.register(TOGGLE_SHORTCUT, toggleWindow);

    screen.on('display-removed', () => {
      if (mainWindow && !mainWindow.isDestroyed()) dockToDisplay(displayFromSavedState());
    });
    screen.on('display-metrics-changed', (_event, display) => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const current = screen.getDisplayMatching(mainWindow.getBounds());
      if (current.id === display.id) dockToDisplay(display);
    });
  });
}

ipcMain.handle('sidepane:hide-window', () => {
  hideWindow();
});

ipcMain.on('sidepane:begin-resize', beginSidebarResize);
ipcMain.on('sidepane:resize-to', (_event, screenX) => resizeSidebarTo(screenX));
ipcMain.on('sidepane:end-resize', endSidebarResize);

app.on('activate', () => {
  if (!mainWindow || mainWindow.isDestroyed()) createWindow();
  showWindow();
});

app.on('before-quit', () => {
  quitting = true;
  saveWindowState();
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // 侧边栏由托盘和快捷键唤起，窗口关闭时保持应用运行。
});
