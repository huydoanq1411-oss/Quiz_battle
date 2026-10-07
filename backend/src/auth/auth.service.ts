import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private sign(user: { id: number; email: string; name: string }) {
    return {
      token: this.jwt.sign({ sub: user.id }),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async register(email: string, name: string, password: string) {
    if (!email || !name || !password || password.length < 6) {
      throw new BadRequestException('Thiếu thông tin hoặc mật khẩu dưới 6 ký tự');
    }
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Email đã được dùng');
    const user = await this.prisma.user.create({
      data: { email, name, password: await bcrypt.hash(password, 10) },
    });
    return this.sign(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }
    return this.sign(user);
  }
}
