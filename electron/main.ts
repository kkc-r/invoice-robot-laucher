import { app, BrowserWindow, session } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import * as log from 'electron-log';

let win: BrowserWindow | null = null;

function createWindow() {
  // 自動アップデート
  require('update-electron-app')();
  autoUpdater.on('update-available', () => {
    log.info('update-available');
  });
  autoUpdater.on('update-not-available', () => {
    log.info('update-not-available');
  });
  autoUpdater.on('error', (error: Error) => {
    log.info('error');
    log.info(error);
  });
  autoUpdater.checkForUpdates();

  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    log.info('メインプロセスが多重起動しました。終了します。');
    app.quit();
  }

  win = new BrowserWindow({
    width: 500,
    height: 750,
    useContentSize: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
    },
  });
  win.setMenu(null);

  win.webContents.on('before-input-event', (event, input) => {
    if (input.key.toLowerCase() === 'f12') {
      win?.webContents.openDevTools();
      event.preventDefault();
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:3000/index.html');
  } else {
    // 'build/index.html'
    win.loadURL(`file://${__dirname}/../index.html`);
  }

  win.on('closed', () => {
    // ローカルストレージ（トークン）を削除
    session.defaultSession.clearStorageData();
    win = null;
  });

  win.webContents.on('will-navigate', (event: any, url: string) => {
    log.info(`will-navigate : ${url}`);
  });

  win.webContents.on('will-redirect', (event: Electron.Event, url: string) => {
    log.info(`will-redirect : ${url}`);
  });

  // Hot Reloading
  if (isDev) {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
      forceHardReset: true,
      hardResetMethod: 'exit',
    });
  }
}

app.whenReady().then(() => {
  const date = new Date();
  const prefix = date.getFullYear() + ('00' + (date.getMonth() + 1)).slice(-2) + ('00' + date.getDate()).slice(-2);
  log.transports.file.fileName = `${prefix}_${log.transports.file.fileName}`;
  log.transports.console.level = 'silly';
  log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}] {text}';
  log.transports.file.level = isDev ? false : 'info';

  // メインウィンドウを表示
  createWindow();

  app.on('ready', createWindow);
});

app.on('window-all-closed', () => {
  log.info('アプリ終了');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
