import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  /** 获取所有咨询师 */
  async findAllConsultants(): Promise<User[]> {
    return this.userRepo.find({
      where: { role: 'consultant', isActive: true },
      select: ['id', 'username', 'realName', 'phone', 'avatar', 'role', 'isActive', 'createdAt'],
    });
  }
}
