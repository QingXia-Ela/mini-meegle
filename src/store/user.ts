import { create } from 'zustand'
import type {  UserLoginResponse } from '@backend/types';
import { getUserInfo } from '@/api/request';

export const useUserStore = create<{
  userInfo: UserLoginResponse;
  setUserInfo: (info: UserLoginResponse) => void;
}>((set) => ({
  userInfo: getUserInfo(),
  setUserInfo: (info: UserLoginResponse) => set({ userInfo: info }),
}))