import { ReactNode, createContext, useContext, useState, useEffect, FC } from 'react';
import { loadConfig, storeConfig } from '../util/electron';
import { MONITORING_TIMEOUT } from '../util/constants';

export type ConfigType = {
  /** マスター情報ファイルパス */
  masterFilePath: string;
  /** 明細書Zip処理フォルダパス */
  statementZipFolderPath: string;
  /** 明細書処理フォルダパス */
  statementFolderPath: string;
  /** 請求書処理フォルダパス */
  invoiceFolderPath: string;
  /** 締日仕分け親フォルダパス */
  deadlineFolderPath: string;
  /** 登録待ちフォルダパス */
  standbyFolderPath: string;
  /** 登録済みフォルダパス */
  sentFolderPath: string;
  /** 月次退避親フォルダパス */
  backupFolderPath: string;
  /** 実行結果記録フォルダパス */
  executetionLogFolderPath: string;
  /** MakeLeapsの認証企業 */
  certifiedCompanyName: string;
};
export type AccountType = {
  /** ML ユーザ名 */
  id: string;
  /** ML パスワード */
  password: string;
};
export type ActionType = {
  /** ロボット処理待ちタイムアウト(min) */
  timeout: string;
};
export type RobotType = {
  /** ロボットプロセス名 */
  processName: string;
};

export type SettingsType = ConfigType & {
  account: AccountType;
  action: ActionType;
  robot: RobotType;
};

export type ConfigContextType = {
  config: SettingsType;
  setConfig: (config: SettingsType) => void;
  saveConfig: (config: SettingsType) => void;
};

type Props = {
  children: ReactNode;
};

export const ConfigContext = createContext({} as ConfigContextType);
export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: FC<Props> = (props) => {
  const { children } = props;
  const [config, setConfig] = useState<SettingsType>({
    masterFilePath: '',
    statementZipFolderPath: '',
    statementFolderPath: '',
    invoiceFolderPath: '',
    deadlineFolderPath: '',
    standbyFolderPath: '',
    sentFolderPath: '',
    backupFolderPath: '',
    executetionLogFolderPath: '',
    certifiedCompanyName: '',
    account: {
      id: '',
      password: '',
    },
    action: {
      timeout: '',
    },
    robot: {
      processName: '',
    },
  });

  useEffect(() => {
    loadConfig().then(async (value) => {
      if (value) {
        const tmpConfig = {
          masterFilePath: value.masterFilePath ?? '',
          statementZipFolderPath: value.statementZipFolderPath ?? '',
          statementFolderPath: value.statementFolderPath ?? '',
          invoiceFolderPath: value.invoiceFolderPath ?? '',
          deadlineFolderPath: value.deadlineFolderPath ?? '',
          standbyFolderPath: value.standbyFolderPath ?? '',
          sentFolderPath: value.sentFolderPath ?? '',
          backupFolderPath: value.backupFolderPath ?? '',
          executetionLogFolderPath: value.executetionLogFolderPath ?? '',
          certifiedCompanyName: value.certifiedCompanyName ?? '',
          account: value.account ?? {
            id: '',
            password: '',
          },
          action: value.action ?? { timeout: MONITORING_TIMEOUT },
          robot: value.robot ?? {
            processName: '',
          },
        };
        // 1以上の整数でない場合はデフォルト値を設定
        tmpConfig.action.timeout = new RegExp(/^[1-9]+(\.[1-9]+)?$/).test(tmpConfig.action.timeout)
          ? tmpConfig.action.timeout
          : MONITORING_TIMEOUT;
        setConfig(tmpConfig);
      }
    });
  }, []);

  const saveConfig = (config: SettingsType) => {
    storeConfig(config);
  };

  return <ConfigContext.Provider value={{ config, setConfig, saveConfig }}>{children}</ConfigContext.Provider>;
};
