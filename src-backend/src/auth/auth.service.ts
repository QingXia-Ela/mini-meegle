import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { Op } from 'sequelize';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User) private userModel: typeof User, private jwtService: JwtService) { }

  private md5(p: string) {
    return crypto.createHash('md5').update(p).digest('hex');
  }

  async register(dto: RegisterDto) {
    // 检查邮箱或用户名是否已被占用
    const exist = await this.userModel.findOne({
      where: {
        [Op.or]: [{ email: dto.email }, { name: dto.name }],
      },
    });
    if (exist) throw new ConflictException('邮箱或用户名已被注册');
    const hashed = this.md5(dto.password);
    const user = (await this.userModel.create({ name: dto.name, email: dto.email, md5pwd: hashed })).get({ plain: true });
    return this.sanitize(user);
  }

  async login(dto: LoginDto) {
    const key = dto.emailOrUsername;
    const user = (await this.userModel.findOne({ where: { [Op.or]: [{ email: key }, { name: key }] } }))?.get({ plain: true });
    if (!user) throw new UnauthorizedException('账号或密码错误');
    const hashed = this.md5(dto.password);
    if (user.md5pwd !== hashed) throw new UnauthorizedException('账号或密码错误');

    const payload = { sub: user.id, email: user.email, name: user.name };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      user: this.sanitize(user),
    };
  }

  sanitize(user: User): Omit<User, 'md5pwd'> {
    const { md5pwd, ...rest } = (user as any).toJSON ? user.toJSON() : user;
    return rest;
  }
}
