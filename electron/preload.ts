import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('db', {
  isDevu: () => ipcRenderer.invoke('isDevu'),
  isProto: () => ipcRenderer.invoke('isProto'),
  setClosable: (closable: boolean) => ipcRenderer.invoke('setClosable', closable),
  log: (level: string, message: string) => ipcRenderer.invoke('log', level, message),
  createFile: (path: string, fileName: string) => ipcRenderer.invoke('createFile', path, fileName),
  readDir: (path: string, isDir: boolean) => ipcRenderer.invoke('readDir', path, isDir),
  readDirJoinPath: (path: string, folderName: string[]) => ipcRenderer.invoke('readDirJoinPath', path, folderName),
  isExistedFileOrFolder: (path: string) => ipcRenderer.invoke('isExistedFileOrFolder', path),
  loadConfig: () => ipcRenderer.invoke('loadConfig'),
  storeConfig: (config: Object) => ipcRenderer.invoke('storeConfig', config),
  folderSelect: () => ipcRenderer.invoke('folderSelect'),
  fileSelect: () => ipcRenderer.invoke('fileSelect'),
  getSettingsPath: () => ipcRenderer.invoke('getSettingsPath'),
  openFile: (path: string, name: string) => ipcRenderer.invoke('openFile', path, name),
  isExitedPath: (path: string) => ipcRenderer.invoke('isExitedPath', path),
  checkWritePermission: (path: string, isFile: boolean) => ipcRenderer.invoke('checkWritePermission', path, isFile),
});
