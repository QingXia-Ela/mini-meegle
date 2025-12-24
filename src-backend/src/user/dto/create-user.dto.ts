export class CreateUserDto {
  name: string;
  email: string;
  md5pwd: string;
  avatar?: string;
}
