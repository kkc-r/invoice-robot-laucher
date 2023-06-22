import { createContext, ReactNode, useContext, useState, VFC, useEffect } from 'react';
import {
  createAuthorizeURL,
  createCodeChallenge,
  createCodeVerifier,
  getParam,
  getToken,
  introspectToken,
} from '../api/authorize';
import { fetchAppInstances } from '../api/appInstance';
import { isDevu, isProto } from '../util/electron';
import {
  CLIENT_ID,
  EXPIRES_IN,
  REDIRECT_URI,
  REFRESH_KEY,
  RSI_WORKPLACE_URL,
  TOKEN_KEY,
  VERIFIER_KEY,
} from '../util/constants';

/**
 * 認証Context
 */
export type AuthType = {
  /** アクセストークン */
  accessToken: string | null;
  /** アクセストークンの保存 */
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  /** リフレッシュトークン */
  refreshToken: string | null;
  /** リフレッシュトークンの保存 */
  setRefreshToken: React.Dispatch<React.SetStateAction<string | null>>;
  appInstanceId: string;
  serviceClass: string;
  isDev: boolean;
  clientId: string;
};

/**
 * 認証を行うためのパラメーター
 */
export type AuthProps = {
  /**
   * 子コンポーネント
   */
  children: ReactNode;
};

const AuthContext = createContext({} as AuthType);

/**
 * 認証情報のContextを参照する
 * @returns 認証情報を参照・変更するContext
 */
export const useAuthContext: () => AuthType = () => useContext(AuthContext);

export const AuthProvider: VFC<AuthProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [appInstanceId, setAppInstanceId] = useState('');
  const [serviceClass, setServiceClass] = useState('');
  const [isDev, setIsDev] = useState(false);
  const [clientId, setClientId] = useState('');
  const value = {
    accessToken,
    setAccessToken,
    refreshToken,
    setRefreshToken,
    appInstanceId,
    serviceClass,
    isDev,
    clientId,
  };

  const setVerifier = () => {
    const verifier = createCodeVerifier();
    window.localStorage.setItem(VERIFIER_KEY, verifier);
    return verifier;
  };
  const getVerifier = () => {
    return window.localStorage.getItem(VERIFIER_KEY);
  };

  const setAccessTokenToStorage = (token: string | null) => {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
  };

  const setRefreshTokenToStorage = (token: string | null) => {
    if (REFRESH_KEY && token) {
      window.localStorage.setItem(REFRESH_KEY, token);
    }
  };

  const getStorageAccessToken = () => {
    return window.localStorage.getItem(TOKEN_KEY);
  };

  const getStorageRefreshToken = () => {
    if (!REFRESH_KEY) {
      return null;
    }
    return window.localStorage.getItem(REFRESH_KEY);
  };

  const clearStorage = () => {
    window.localStorage.removeItem(VERIFIER_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
    if (REFRESH_KEY) {
      window.localStorage.removeItem(REFRESH_KEY);
    }
  };

  const initAuthorize = async () => {
    // エンドポイント確認
    const isDevelopment = await isDevu();
    const isDevuProto = await isProto();
    const clientId = CLIENT_ID(isDevelopment, isDevuProto);
    setIsDev(isDevelopment);
    setClientId(clientId);

    // URLから認可コード取得
    const code = getParam('code');
    if (code) {
      const verifier = getVerifier() || setVerifier();
      const response = await getToken(isDevelopment, REDIRECT_URI, code, verifier, clientId, EXPIRES_IN);
      if (response) {
        setAccessTokenToStorage(response.access_token);
        setRefreshTokenToStorage(response.refresh_token);
        window.location.assign(REDIRECT_URI);
        return;
      } else {
        window.location.assign(RSI_WORKPLACE_URL(isDevelopment));
        return;
      }
    }
    // URLから認可コード取得エラー検知
    if (getParam('error')) {
      window.location.assign(RSI_WORKPLACE_URL(isDevelopment));
      return;
    }
    // 認可コード取得要求
    if (getStorageAccessToken() === null) {
      const verifier = setVerifier();
      const challenge = createCodeChallenge(verifier);
      const authURL = createAuthorizeURL(isDevelopment, clientId, challenge, REDIRECT_URI);
      window.location.assign(authURL);
      return;
    }
    // アクセストークン検証
    const accessToken = getStorageAccessToken();
    const refreshToken = getStorageRefreshToken();
    const result = await introspectToken(isDevelopment, accessToken, clientId);
    if (!result) {
      // トークン不正 or 期限切れのためWeb Storageを削除してリロードする
      clearStorage();
      window.location.assign(REDIRECT_URI);
      return;
    }
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    if (accessToken != null) {
      getAppInstance(accessToken, isDevelopment);
    }
  };

  const getAppInstance = async (accessToken: string, isDev: boolean) => {
    const instances = await fetchAppInstances(accessToken, isDev);
    if (instances.length > 0) {
      setAppInstanceId(instances[0].id.toString());
      setServiceClass(instances[0].serviceClass);
    }
  };

  useEffect(() => {
    initAuthorize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
