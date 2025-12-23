import { notification } from 'antd';

type RequestOptions = {
  showError?: boolean;
  timeout?: number; // ms
};

const URL_BASE = import.meta.env.VITE_API_BASE || '';

interface ModifyRequestInit extends Omit<RequestInit, 'body'> {
  body?: Record<string, any> | string | RequestInit['body'];
}

export function setLoginToken(token: string) {
  localStorage.setItem('token', token);
}

export function getLoginToken() {
  return localStorage.getItem('token');
}

export function cleanLoginToken() {
  localStorage.removeItem('token');
}

async function request<T = any>(input: string, init: ModifyRequestInit = {}, opts: RequestOptions = { showError: true }): Promise<T> {
  const { showError = true, timeout = 10000 } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const token = localStorage.getItem('token');

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

    if (!res.ok) {
      if (res.status === 401) {
        cleanLoginToken();
        window.location.href = '/login';
        return Promise.reject(new Error('未授权，请重新登录'));
      }
      let message = `${res.status} ${res.statusText}`;
      try {
        const data = await res.clone().json();
        if (data && (data.message || data.msg)) message = data.message ?? data.msg;
      } catch { /** todo */ }

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

    const text = await res.text();
    if (!text) return undefined as unknown as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
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
