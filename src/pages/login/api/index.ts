import request from '@/api/request';
import type { LoginDto, RegisterDto, UserLoginResponse, UserRegisterResponse } from '@backend/types';

export function apiLogin(data: LoginDto) {
  return request<UserLoginResponse>('/auth/login', {
    method: 'POST',
    body: data,
  });
}

export function apiRegister(data: RegisterDto) {
  return request<UserRegisterResponse>('/auth/register', {
    method: 'POST',
    body: data,
  });
}