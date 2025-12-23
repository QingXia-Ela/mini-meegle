export class LoginDto {
  // 允许输入邮箱或用户名，两者均可登录
  emailOrUsername: string;
  password: string;
}
