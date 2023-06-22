import { app, BrowserWindow, ipcMain, safeStorage, dialog, shell, session, autoUpdater } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import * as log from 'electron-log';
import * as ElectronStore from 'electron-store';
import * as fs from 'node:fs';

let win: BrowserWindow | null = null;
let subWindow: BrowserWindow | null = null;
const store = new ElectronStore({ name: 'settings' });
const safeStore = new ElectronStore({
  name: 'config',
  encryptionKey:
    'IZqKCS5mnwFnUKw.yHMt_AODPiDLgd0sQcx71PRC58LsWhKADBhPkL9Hi_YHhkT5b.d_E-KA6PsPGO7fC248VDOkmc3I536y79p2LG2b3sbEoiv6uCN_eLfUMOXEUYPzbsqQL18XQOHX2Xq.QJqb2DPfh5WBNa6Y5QkK_MV9GBRx0eBpmZaYzkpOWGw3jR5K8U0FRkOysnOIvU9v4lew1tU0ZKrOhEgKwUO63VykGQdh.ssk7yhD0OI6ny31b64n',
});
let isDevu = false;
let isProto = false;

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

  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    log.info('メインプロセスが多重起動しました。終了します。');
    app.quit();
  }

  // 起動オプションチェック
  if (process.argv.find((arg) => arg === '--devu')) {
    // devu向け
    isDevu = true;
    if (process.argv.find((arg) => arg === '--proto')) {
      // devuのプロト用向け
      isProto = true;
    }
  }

  win = new BrowserWindow({
    width: 500,
    height: 750,
    useContentSize: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      preload: path.join(__dirname, 'preload.js'),
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
    // log.info(`will-navigate : ${url}`);
    if (url.includes('password-reset-request')) {
      event.preventDefault();
      // NOTE
      // パスワードリセット時はメインウィンドウ内で画面遷移するためアプリの画面にリダイレクトできない
      // 子ウィンドウでパスワードリセット画面を表示するようにし、メインウィンドウはログイン画面のままにする
      subWindow = new BrowserWindow();
      subWindow.on('closed', () => {
        subWindow = null;
      });
      subWindow.loadURL(url);
      // NOTE リダイレクトしないとログアウトボタン押下後にアプリの画面に遷移されない
      win?.loadURL(`file://${__dirname}/../index.html`);
    } else if (url === 'http://localhost:3000/') {
      event.preventDefault();
      win?.loadURL(`file://${__dirname}/../index.html`);
    } else {
      win?.loadURL(url);
    }
  });

  win.webContents.on('will-redirect', (event: Electron.Event, url: string) => {
    // log.info(`will-redirect : ${url}`);
    if (url.includes('http://localhost:3000/?code=') && win != null) {
      url = url.replace('http://localhost:3000/?', '');
      event.preventDefault();
      win.loadURL(`file://${__dirname}/../index.html#${url}`);
    } else if (url === 'http://localhost:3000/') {
      event.preventDefault();
      win?.loadURL(`file://${__dirname}/../index.html`);
    } else if (
      url === 'https://devu.accounts.ricoh.com/portal/top.html' ||
      url === 'https://na.accounts.ricoh.com/portal/top.html'
    ) {
      event.preventDefault();
      win?.loadURL(`file://${__dirname}/../index.html`);
    }
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

ipcMain.handle('isDevu', (_event) => {
  return isDevu;
});

ipcMain.handle('isProto', (_event) => {
  return isProto;
});

ipcMain.handle('setClosable', (_event, closable) => {
  // 閉じるボタンの有効/無効
  win?.setClosable(closable);
});

ipcMain.handle('log', async (_event, level, message) => {
  switch (level) {
    case 'error':
      log.error(message);
      break;
    case 'warn':
      log.warn(message);
      break;
    case 'info':
      log.info(message);
      break;
    default:
      log.debug(message);
      break;
  }
});

ipcMain.handle('createFile', async (_event, dirPath, fileName) => {
  fs.writeFile(path.join(dirPath, fileName), '', (err) => {
    if (err) {
      log.error(`${fileName}の作成失敗`);
    }
    log.info(`${fileName}を作成`);
  });
});

ipcMain.handle('readDir', async (_event, data, isDir) => {
  return fs
    .readdirSync(data, {
      withFileTypes: true,
    })
    .filter((dirent) => {
      if (isDir) {
        return dirent.isDirectory();
      } else {
        return dirent.isFile();
      }
    })
    .map((dirent) => dirent.name);
});

ipcMain.handle('readDirJoinPath', async (_event, dirPath, folderName) => {
  return fs
    .readdirSync(path.join(dirPath, folderName), {
      withFileTypes: true,
    })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);
});

ipcMain.handle('loadConfig', async (_event) => {
  let config = store.store;
  const accountInfo: any = safeStore.store;
  if (Object.keys(accountInfo).length > 0) {
    const isEncryptAvailable = safeStorage.isEncryptionAvailable();
    Object.keys(accountInfo as Object).map((key) => {
      accountInfo[key] =
        isEncryptAvailable && accountInfo[key]
          ? safeStorage.decryptString(Buffer.from(accountInfo[key].split(',').map((v: string) => parseInt(v, 10))))
          : '';
    });
    config = { account: accountInfo, ...config };
  }

  return config;
});

ipcMain.handle('storeConfig', async (_event, config) => {
  const accountInfo = config.account;
  delete config.account;
  const isEncryptAvailable = safeStorage.isEncryptionAvailable();
  Object.keys(accountInfo as Object).map((key) => {
    accountInfo[key] = isEncryptAvailable ? safeStorage.encryptString(accountInfo[key]).join() : '';
  });

  store.set(config);
  safeStore.set(accountInfo);
});

ipcMain.handle('folderSelect', async (_event) => {
  const options: Electron.OpenDialogOptions = {
    properties: ['openDirectory'],
  };
  const folder = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
  if (folder) {
    return folder.filePaths;
  }
});

ipcMain.handle('fileSelect', async (_event) => {
  const options: Electron.OpenDialogOptions = {
    properties: ['openFile'],
    filters: [{ name: 'Excelファイル', extensions: ['xls', 'xlsx'] }],
  };
  const file = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
  if (file) {
    return file.filePaths;
  }
});

ipcMain.handle('isExistedFileOrFolder', (_event, data) => {
  return (
    fs
      .readdirSync(data, {
        withFileTypes: true,
      })
      .filter((dirent) => dirent.isFile() || dirent.isDirectory()).length > 0
  );
});

ipcMain.handle('getSettingsPath', (_event, _data) => {
  return path.join(app.getPath('userData'), 'settings.json');
});

ipcMain.handle('openFile', async (_event, targetPath, name) => {
  if (name) {
    targetPath = path.join(targetPath, name);
  }
  await shell.openPath(targetPath);
});

ipcMain.handle('isExitedPath', (_event, targetPath) => {
  return fs.existsSync(targetPath);
});

ipcMain.handle('checkWritePermission', (_event, dirPath, isFile) => {
  return new Promise<boolean>((resolve) => {
    try {
      if (isFile) {
        // read
        fs.readFileSync(dirPath);
      } else {
        // read
        fs.readdirSync(dirPath);

        // write
        const testDirPath = path.join(dirPath, 'launcher_create_test');
        fs.mkdirSync(testDirPath);

        // delete
        fs.rmdirSync(testDirPath);
      }

      resolve(true);
    } catch (e) {
      log.error('書き込み権限チェックNG');
      log.error(e);
      resolve(false);
    }
  });
});
