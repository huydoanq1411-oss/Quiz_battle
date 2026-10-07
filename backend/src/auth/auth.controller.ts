import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private prisma: PrismaService) {}

  @Post('register')
  register(@Body() b: { email: string; name: string; password: string }) {
    return this.auth.register(b.email, b.name, b.password);
  }

  @Post('login')
  login(@Body() b: { email: string; password: string }) {
    return this.auth.login(b.email, b.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true },
    });
  }
}
