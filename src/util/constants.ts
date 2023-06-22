// HACK
const environment = (isDev: boolean) => (isDev ? 'devu' : 'na');

// na
const clientId = '70wi7HFmylxtZeoNziE5Mikosr23Uuzr';
// devu 製品管理用
const clientIdDev = '70kMB4Ph0vlvyH8E78XTJnvblT5dXhh9';
// devu プロト用
const clientIdDevProto = '70D9bLrS0VpXa6lEE9LseUCdkmkqnyzv';
export const CLIENT_ID = (isDev: boolean, isProto: boolean) =>
  isDev ? (isProto ? clientIdDevProto : clientIdDev) : clientId;

export const RSI_WORKPLACE_URL = (isDev: boolean) => `https://${environment(isDev)}.accounts.ricoh.com/portal/top.html`;
export const APP_INSTANCE_URL = (isDev: boolean) =>
  `https://www.${environment(isDev)}.smart-integration.ricoh.com/v1/appdata/pub/appinstances`;
export const JOB_EXEC_URL = (isDev: boolean, appInstanceId: string) =>
  `https://www.${environment(isDev)}.smart-integration.ricoh.com/v1/appdata/pub/appinstances/${appInstanceId}/jobs`;
export const JOB_LOGS_URL = (isDev: boolean, appInstanceId: string) =>
  `https://www.${environment(isDev)}.smart-integration.ricoh.com/v1/appdata/pub/appinstances/${appInstanceId}/joblogs`;
export const RSI_HOST = (isDev: boolean) => `https://${environment(isDev)}.accounts.ricoh.com`;
export const RSI_API_HOST = (isDev: boolean) => `https://api.${environment(isDev)}.smart-integration.ricoh.com`;
export const LOGOUT_REDIRECT = (isDev: boolean) => `https://${environment(isDev)}.accounts.ricoh.com`;

export const CODE_VERIFIER_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';
export const GRANT_TYPE = 'authorization_code';
export const GRANT_TYPE_REFRESH = 'refresh_token';
export const VERIFIER_KEY = 'code_verifier';
export const REDIRECT_URI = 'http://localhost:3000';
export const TOKEN_KEY = 'access';
export const REFRESH_KEY = 'refresh';
export const EXPIRES_IN = 3600;
/** [default] ロボット処理監視タイムアウト(min) */
export const MONITORING_TIMEOUT = '20';
/** WFがエラーになった(ジョブ実行APIは200応答)場合に作成する実行結果ファイル名；ジョブコード_canceld.log */
export const FILE_NAME_CANCELED = '_canceled.log';
