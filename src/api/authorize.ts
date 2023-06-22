import jsSHA from 'jssha';
import { post, ErrorCallback } from './fetch';
import { CODE_VERIFIER_CHARS, GRANT_TYPE, GRANT_TYPE_REFRESH, RSI_API_HOST, RSI_HOST } from '../util/constants';

/**
 * 認証情報を格納するオブジェクト
 */
export interface GetTokenResponse {
  /**
   * アクセストークン
   */
  // eslint-disable-next-line camelcase
  access_token: string;
  /**
   * アクセストークンの有効期限(ミリ秒)
   */
  // eslint-disable-next-line camelcase
  expires_in: number;
  /**
   * リフレッシュトークン <br>
   * リフレッシュトークンを取得するスコープが有効でない場合はnullとなる
   */
  // eslint-disable-next-line camelcase
  refresh_token: string;
}

/**
 * アクセストークン検証APIのレスポンスボディ
 */
interface IntrospectionResponse {
  /**
   * 有効/無効
   */
  // eslint-disable-next-line camelcase
  active: boolean;
  /**
   * クライアントID
   */
  // eslint-disable-next-line camelcase
  client_id: string;
  /**
   * トークン種別
   */
  // eslint-disable-next-line camelcase
  token_type: string;
  // eslint-disable-next-line camelcase
  /**
   * 有効期限
   */
  exp: number;
  // eslint-disable-next-line camelcase
  /**
   * JTI(JWT ID)
   */
  jti: string;
  /**
   * 指定されたJWTのペイロード
   */
  // eslint-disable-next-line camelcase
  payload: {
    // eslint-disable-next-line camelcase
    exp: number;
    // eslint-disable-next-line camelcase
    jti: string;
  };
}

/**
 * PKCEのためのランダムな文字列 `code_verifier`を生成する
 *
 * @returns code_verifier 半角英数字, 記号(`- . _ ~`)を含む48文字のランダムな文字列
 */
export const createCodeVerifier = () => {
  const str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';
  const number = 48;
  const code = Array.from(Array(number))
    .map(() => str[Math.floor(Math.random() * str.length)])
    .join('');
  return code;
};

/**
 * 認可コードを要求時に必要となる `code_challenge`を生成する
 *
 * @param codeVerifier PKCEのためのランダムな文字列 `code_verifier`
 * @returns code_challenge
 * @throws `Length Error` 文字列長が48文字ではない
 * @throws `Format Error` code_verifierに使用できない文字が含まれている
 */
export const createCodeChallenge = (codeVerifier: string) => {
  if (codeVerifier.length !== 48) {
    throw new Error('Length Error');
  }
  [...codeVerifier].forEach((c) => {
    if (!CODE_VERIFIER_CHARS.includes(c)) {
      throw new Error('Format Error');
    }
  });
  const shaObj = new jsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(codeVerifier);
  const hashHEX = shaObj.getHash('BYTES');
  const codeChallenge = window.btoa(hashHEX).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return codeChallenge;
};

/**
 * URLからクエリの値を取得する
 *
 * @param name クエリのキー
 * @param url URL 指定しない場合は現在のURL(`window.location.href`)が参照される
 * @returns クエリの値。エラー時や対象のクエリの値が取得できなかった場合はnullまたは空文字を返す
 */
export const getParam = (name: string, url?: string) => {
  const target = new URL(url === undefined ? window.location.href.replace('#', '/?') : url);
  return target.searchParams.get(name);
};

/**
 * 認可コードを要求用URLを生成する
 *
 * @param isDev
 * @param clientId WFアプリのクライアントID
 * @param codeChallenge 生成したcode_challenge
 * @param redirectURI 認可後のリダイレクトURL
 *
 * @returns 認可コードを要求用URL
 */
export const createAuthorizeURL = (
  isDev: boolean,
  clientId: string,
  codeChallenge: string,
  redirectURI: string,
  ...appendScope: string[]
) => {
  const defaultScopes = [
    'offline_access',
    'aut:tenant:read',
    'aut:me:read',
    'uiframework:header:read',
    'sem:license:read',
    'wfa:job:admin',
    'wfa:site_setting:admin',
  ];
  const scope = defaultScopes.concat(appendScope).join(' ');

  const params =
    `?client_id=${clientId}` +
    `&code_challenge=${codeChallenge}` +
    '&code_challenge_method=S256' +
    '&response_type=code' +
    `&redirect_uri=${redirectURI}` +
    `&scope=${scope}`;

  return `${RSI_HOST(isDev)}/v1/aut/oauth/provider/authorize${params}`;
};

/**
 * アクセストークンを取得する
 *
 * #### インポート
 * ```typescript
 * import { getToken } from 'rj_frontend_common/dist/api/aut/authorize'
 * ```
 * @param redirectURI リダイレクトURL
 * @param code 認可コード
 * @param codeVerifier 認可コード要求時に生成したcode_verifier
 * @param clientId クライアントID
 * @param expiresIn アクセストークンの有効時間(ミリ秒) デフォルト値は3600
 * @param callback エラー時のコールバック関数
 * @returns 認証情報のオブジェクト
 */
export const getToken = async (
  isDev: boolean,
  redirectURI: string,
  code: string,
  codeVerifier: string,
  clientId: string,
  expiresIn?: number,
  callback?: ErrorCallback
) => {
  const expire = expiresIn ? expiresIn : 3600;
  // const expire = expiresIn ? expiresIn : 60;
  const body = JSON.stringify({
    grant_type: GRANT_TYPE,
    redirect_uri: redirectURI,
    code: code,
    client_id: clientId,
    code_verifier: codeVerifier,
    expires_in: expire,
  });
  const response = await post<GetTokenResponse>(
    `${RSI_API_HOST(isDev)}/v1/aut/oauth/provider/token/`,
    {
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body,
    },
    callback
  );
  return response;
};

export const updateToken = async (
  isDev: boolean,
  refreshToken: string,
  clientId: string,
  expiresIn?: number,
  callback?: ErrorCallback
) => {
  const expire = expiresIn ? expiresIn : 3600;
  // const expire = expiresIn ? expiresIn : 60;
  const body = JSON.stringify({
    grant_type: GRANT_TYPE_REFRESH,
    refresh_token: refreshToken,
    client_id: clientId,
    expires_in: expire,
  });
  const response = await post<GetTokenResponse>(
    `${RSI_API_HOST(isDev)}/v1/aut/oauth/provider/token/`,
    {
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body,
    },
    callback
  );
  return response;
};

/**
 * アクセストークンを検証する
 *
 * #### インポート
 * ```typescript
 * import { introspectToken } from 'rj_frontend_common/dist/api/aut/authorize'
 * ```
 * @param token アクセストークン
 * @param clientId クライアントID
 * @param callback エラー時のコールバック関数
 * @returns 有効=true, 無効または検証エラー=false
 */
export const introspectToken = async (
  isDev: boolean,
  token: string | null,
  clientId: string,
  callback?: ErrorCallback
) => {
  if (token === null) {
    return false;
  }
  const body = JSON.stringify({
    token,
    client_id: clientId,
  });
  const response = await post<IntrospectionResponse>(
    `${RSI_API_HOST(isDev)}/v1/aut/oauth/provider/introspect`,
    {
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body,
    },
    callback
  );
  return response === null ? false : response.active;
};
