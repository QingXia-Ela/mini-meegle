import { AuthController } from "./auth.controller";

type ExtractResponse<T extends Record<string, any>, U extends keyof T> = T[U] extends (...args: any[]) => Promise<infer R> ? R : never;

export interface UserRegisterResponse extends ExtractResponse<AuthController, 'register'> { }

export interface UserLoginResponse extends ExtractResponse<AuthController, 'login'> { }

type C = ExtractResponse<AuthController, 'login'>
