import { notification } from 'antd';

type RequestOptions = {
  showError?: boolean;
  timeout?: number; // ms
};

const URL_BASE = import.meta.env.VITE_API_BASE || '';

interface ModifyRequestInit extends Omit<RequestInit, 'body'> {
  body?: Record<string, any> | string | RequestInit['body'];
}

export function setUserInfo(info: string) {
  localStorage.setItem('userInfo', info);
}

export function getUserInfo() {
  return JSON.parse(localStorage.getItem('userInfo') || 'null');
}

export function cleanUserInfo() {
  localStorage.removeItem('userInfo');
}

async function request<T = any>(input: string, init: ModifyRequestInit = {}, opts: RequestOptions = { showError: true }): Promise<T> {
  const { showError = true, timeout = 10000 } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const token = getUserInfo()?.access_token;
  
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  // 自动设置 Content-Type（非 FormData）并序列化 body
  if (init.body && !(init.body instanceof FormData) && typeof init.body !== 'string') {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json;charset=utf-8');
    init.body = JSON.stringify(init.body);
  }

  let requestWebConnectSuccessMarked = false;

  try {
    const res = await fetch(`${URL_BASE}${input}`, { ...(init as RequestInit), headers, signal: controller.signal });
    clearTimeout(timer);
    requestWebConnectSuccessMarked = true;

    const text = await res.text();
    if (!text) {
      // 空响应体，检查状态码
      if (!res.ok) {
        if (res.status === 401) {
          cleanUserInfo();
          window.location.href = '/login';
          return Promise.reject(new Error('未授权，请重新登录'));
        }
        const err: any = new Error(`${res.status} ${res.statusText}`);
        err.status = res.status;
        err.response = res;
        throw err;
      }
      return undefined as unknown as T;
    }

    // 解析响应体
    let responseData: any;
    try {
      responseData = JSON.parse(text);
    } catch {
      // 如果不是 JSON，直接返回文本
      if (!res.ok) {
        const err: any = new Error(text || `${res.status} ${res.statusText}`);
        err.status = res.status;
        err.response = res;
        throw err;
      }
      return text as unknown as T;
    }

    // 检查是否是统一响应格式 { code, msg, data }
    if (responseData && typeof responseData === 'object' && 'code' in responseData) {
      const { code, msg, data } = responseData;
      
      // 如果 code 不是 200，视为错误
      if (code !== 200) {
        if (code === 401) {
          cleanUserInfo();
          window.location.href = '/login';
          return Promise.reject(new Error(msg || '未授权，请重新登录'));
        }

        if (showError) {
          notification.error({
            message: '请求错误',
            description: msg || `${code} 错误`,
            duration: 5,
          });
        }

        const err: any = new Error(msg || `${code} 错误`);
        err.status = res.status;
        err.code = code;
        err.response = res;
        throw err;
      }

      // code === 200，返回 data
      return data as T;
    }

    // 如果不是统一响应格式，保持原有逻辑
    if (!res.ok) {
      if (res.status === 401) {
        cleanUserInfo();
        window.location.href = '/login';
        return Promise.reject(new Error('未授权，请重新登录'));
      }
      let message = `${res.status} ${res.statusText}`;
      if (responseData && (responseData.message || responseData.msg)) {
        message = responseData.message ?? responseData.msg;
      }

      if (showError) {
        notification.error({
          message: '请求错误',
          description: message,
          duration: 5,
        });
      }

      const err: any = new Error(message);
      err.status = res.status;
      err.response = res;
      throw err;
    }

    return responseData as T;
  } catch (error: any) {
    clearTimeout(timer);
    if (requestWebConnectSuccessMarked) {
      throw error;
    }

    const isAbort = error?.name === 'AbortError';
    if (isAbort) {
      if (showError) notification.open({ message: '请求超时', description: `超过 ${timeout}ms 未响应`, duration: 5, type: 'error' });
      const err = new Error('请求超时');
      err.name = 'AbortError';
      throw err;
    }

    if (showError) notification.open({
      message: '网络错误', description: error?.message ?? String(error), duration: 5, type: 'error',
    });
    throw error;
  }
}

export const get = <T = any>(url: string, opts?: RequestOptions) => request<T>(url, { method: 'GET' }, opts);
export const post = <T = any>(url: string, body?: any, opts?: RequestOptions) => request<T>(url, { method: 'POST', body }, opts);

/*
Usage examples:
 
import request, { get, post } from '@/api/request';
 
// GET
const users = await get<User[]>('/api/users');
 
// POST
const res = await post<{ id: string }>('/api/login', { username, password });
 
*/

export default request;
