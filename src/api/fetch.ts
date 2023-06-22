import 'whatwg-fetch';
import { LogLevel, log } from '../util/electron';

export interface Options {
  /**
   * HTTPリクエストヘッダー
   */
  headers?: { [key: string]: string };
  /**
   * HTTPリクエストボディ
   */
  body?: string | Blob | FormData;
}

export interface ErrorCallback {
  /**
   * HTTPエラーレスポンスを処理するためのコールバック関数
   *
   * @param status HTTPステータスコード
   * @param body エラー発生時の応答のボディ
   * @param contentType エラー発生時の応答の Content-Type
   *
   */
  (status: number, body: string, contentType: string): void;
}

async function send<T>(
  method: 'GET' | 'PUT' | 'POST' | 'DELETE',
  url: string,
  options: Options,
  type?: 'blob',
  credentials?: 'include' | 'same-origin' | 'omit'
): Promise<
  | { ok: true; status: number; body: T; statusText: string }
  | {
      ok: false;
      status: number;
      body: string;
      statusText: string;
      contentType: string;
    }
> {
  const { headers } = options;
  const body = options && options.body ? options.body : null;
  const response = await window.fetch(url, {
    mode: 'cors',
    credentials,
    headers,
    method,
    body,
  });
  if (!response.ok) {
    try {
      log(LogLevel.Error, 'APIエラー応答');
      log(LogLevel.Error, `status : ${response.status}, statusText : ${response.statusText}`);

      // エラー時でもレスポンスボディはそのまま取得する
      const resJson = await response.json();
      if (resJson && resJson?.errors[0]) {
        log(LogLevel.Error, `message : ${resJson.errors[0].message}`);
      }
      return {
        ok: response.ok,
        status: response.status,
        body: resJson,
        statusText: response.statusText,
        contentType: response.headers.get('Content-Type') || '',
      };
    } catch (e) {
      return {
        ok: response.ok,
        status: response.status,
        body: '',
        statusText: response.statusText,
        contentType: response.headers.get('Content-Type') || '',
      };
    }
  }
  let resJson;
  if (type === 'blob') {
    resJson = await response.blob();
  } else if (method === 'DELETE') {
    resJson = '';
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    resJson = await response.json();
  }
  return {
    ok: response.ok,
    status: response.status,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    body: resJson,
    statusText: response.statusText,
  };
}

/**
 * GETリクエストを送信する
 *
 * @param url リクエスト先URL
 * @param options HTTPリクエストヘッダー・リクエストボディ
 * @param callback エラー時のコールバック関数
 * @returns レスポンスボディ, エラー時はnullを返す
 * @typeParam T レスポンスのボディの型
 */
export async function get<T>(
  url: string,
  options: Options,
  /**
   * @param status HTTPステータスコード
   */
  callback?: ErrorCallback
): Promise<T | null> {
  const response = await send<T>('GET', url, options || {});
  if (!response.ok && callback) {
    callback(response.status, response.body, response.contentType);
  }
  const resJson = response.ok ? response.body : null;
  return resJson;
}

/**
 * POSTリクエスト
 *
 * @param url リクエスト先URL
 * @param options HTTPリクエストヘッダー・リクエストボディ
 * @param callback エラー時のコールバック関数
 * @returns レスポンスボディ, エラー時はnullを返す
 * @typeParam T レスポンスのボディの型
 */
export async function post<T>(url: string, options: Options, callback?: ErrorCallback): Promise<T | null> {
  const response = await send<T>('POST', url, options);
  if (!response.ok && callback) {
    callback(response.status, response.body, response.contentType);
  }
  const resJson = response.ok ? response.body : null;
  return resJson;
}
