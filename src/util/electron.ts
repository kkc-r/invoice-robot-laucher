import { Buffer } from 'buffer';
import { SettingsType } from '../context/ConfigContext';
import { FILE_NAME_CANCELED } from './constants';

export const LogLevel = {
  Error: 'error',
  Warn: 'warn',
  Info: 'info',
  Debug: 'debug',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

interface ElectronWindow extends Window {
  Buffer: Buffer;
  db: {
    isDevu: () => Promise<boolean>;
    isProto: () => Promise<boolean>;
    setClosable: (closable: boolean) => Promise<void>;
    log: (level: string, message: string) => Promise<void>;
    loadConfig: () => Promise<SettingsType | null>;
    storeConfig: (config: SettingsType) => Promise<void>;
    createFile: (path: string, fileName: string) => Promise<void>;
    readDir: (path: string, isDir: boolean) => Promise<string[]>;
    readDirJoinPath: (path: string, folderName: string) => Promise<string[]>;
    isExistedFileOrFolder: (path: string) => Promise<boolean>;
    folderSelect: () => string[];
    fileSelect: () => string[];
    getSettingsPath: () => string;
    openFile: (path: string, name: string) => Promise<void>;
    isExitedPath: (path: string) => Promise<boolean>;
    checkWritePermission: (path: string, isFile: boolean) => Promise<boolean>;
  };
}
declare const window: ElectronWindow;
window.Buffer = window.Buffer || Buffer;

export const isDevu = async () => {
  return await window.db.isDevu();
};

export const isProto = async () => {
  return await window.db.isProto();
};

export const setClosable = (closable: boolean) => {
  window.db.setClosable(closable);
};

export const log = (level: LogLevel, message: string) => {
  window.db.log(level, message);
};

export const loadConfig = () => {
  return window.db.loadConfig();
};

export const storeConfig = (config: SettingsType) => {
  window.db.storeConfig(config);
};

export const createJobLogFile = (path: string, jobCode: string) => {
  window.db.createFile(path, jobCode + FILE_NAME_CANCELED);
};

export const readDir = (dirPath: string, isDir: boolean) => {
  return window.db.readDir(dirPath, isDir);
};

export const readDirJoinPath = async (dirPath: string, folderName: string) => {
  return await window.db.readDirJoinPath(dirPath, folderName);
};

export const isExistedFileOrFolder = (dirPath: string) => {
  if (dirPath) {
    return window.db.isExistedFileOrFolder(dirPath);
  } else {
    return new Promise<boolean>((resolve) => resolve(false));
  }
};

export const folderSelect = () => {
  return window.db.folderSelect();
};

export const fileSelect = () => {
  return window.db.fileSelect();
};

export const getSettingsPath = () => {
  return window.db.getSettingsPath();
};

export const openFile = (path: string, name: string = '') => {
  window.db.openFile(path, name);
};

export const isExitedPath = (path: string) => {
  if (path) {
    return window.db.isExitedPath(path);
  }

  return new Promise<boolean>((resolve) => resolve(false));
};

export const checkWritePermission = (path: string, isFile: boolean) => {
  return window.db.checkWritePermission(path, isFile);
};
