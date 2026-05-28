import { Injectable, UnauthorizedException, OnApplicationBootstrap } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/auth.dto';
import { ConfigService } from '../../config/config.module';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /** 应用启动时自动创建默认管理员账号 */
  async onApplicationBootstrap() {
    const adminUser = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(this.config.get('DEFAULT_ADMIN_PASSWORD', 'admin123456'), 10);
      await this.userRepo.save({
        username: this.config.get('DEFAULT_ADMIN_USERNAME', 'admin'),
        password: hashedPassword,
        role: 'admin',
        realName: '系统管理员',
        phone: '13800000000',
      });
      console.log('✅ 默认管理员账号已创建 (admin / admin123456)');
    }
  }

  /** 用户登录 */
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { username: dto.username } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户名或密码错误，或账号已被停用');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      accessToken: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  /** 获取当前用户信息 */
  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  /** 修改密码 */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) throw new UnauthorizedException('原密码错误');

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { message: '密码修改成功' };
  }

  /** 创建用户（内部方法） */
  async createUser(data: Partial<User>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.userRepo.save(data);
  }

  /** 重置用户密码 */
  async resetPassword(userId: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { message: '密码重置成功' };
  }

  /** 查找用户 */
  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }
}
