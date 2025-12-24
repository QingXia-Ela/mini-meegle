import { AuthController } from './auth.controller';
import { SpaceController } from '../space/space.controller';
import { WorkItemController } from 'src/work-item/work-item.controller';

type ExtractResponse<
  T extends Record<string, any>,
  U extends keyof T,
> = T[U] extends (...args: any[]) => Promise<infer R> ? R : never;

export interface UserRegisterResponse extends ExtractResponse<
  AuthController,
  'register'
> {}

export interface UserLoginResponse extends ExtractResponse<
  AuthController,
  'login'
> {}

export interface UserSpacesResponse extends ExtractResponse<
  SpaceController,
  'findMySpaces'
> {}

export interface CreateSpaceResponse extends ExtractResponse<
  SpaceController,
  'create'
> {}

export interface WorkItemResponse extends ExtractResponse<
  WorkItemController,
  'findBySpaceId'
> {}
