import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, password: string, role: Role = Role.USER): Promise<User> {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = randomBytes(32).toString('hex');

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        emailVerificationToken,
        role,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });
  }

  async generateTwoFactorCode(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: code,
        twoFactorExpiry: expiry,
      },
    });

    return code;
  }

  async verifyTwoFactorCode(email: string, code: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user || !user.twoFactorCode || !user.twoFactorExpiry) {
      return false;
    }

    const isCodeValid = user.twoFactorCode === code;
    const isNotExpired = new Date() < user.twoFactorExpiry;

    if (isCodeValid && isNotExpired) {
      // Clear the 2FA code after successful verification
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: null,
          twoFactorExpiry: null,
        },
      });
      return true;
    }

    return false;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async createAdmin(email: string, password: string): Promise<User> {
    return this.create(email, password, Role.ADMIN);
  }
}