const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const targetUrl = process.env.SIDEPANE_SCREENSHOT_URL ?? 'http://127.0.0.1:5173';
const outputPath = path.resolve(
  process.env.SIDEPANE_SCREENSHOT_PATH ?? 'docs/images/sidepane-ui.png'
);

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width: 440,
    height: 900,
    show: false,
    webPreferences: {
      offscreen: true,
    },
  });

  try {
    await window.loadURL(targetUrl);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const image = await window.webContents.capturePage();
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, image.toPNG());
    console.log(`Screenshot written to ${outputPath}`);
    app.quit();
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
