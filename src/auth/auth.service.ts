import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private mailerService: MailerService,
  ) {}

  async register(email: string, password: string): Promise<{ message: string }> {
    const user = await this.usersService.create(email, password);
    
    // Send email verification
    await this.sendVerificationEmail(user);
    
    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    await this.usersService.verifyEmail(token);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async login(email: string, password: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const isPasswordValid = await this.usersService.validatePassword(user, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate and send 2FA code
    const code = await this.usersService.generateTwoFactorCode(email);
    await this.send2FACode(user, code);

    return { message: 'Login successful. Please check your email for the 2FA code.' };
  }

  async verify2FA(email: string, code: string): Promise<{ message: string; user: Partial<User> }> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isCodeValid = await this.usersService.verifyTwoFactorCode(email, code);
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid or expired 2FA code');
    }

    return {
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const verificationUrl = `http://localhost:3000/auth/verify-email?token=${user.emailVerificationToken}`;
    
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verify your email - Watchlist App',
      html: `
        <h1>Welcome to Watchlist App!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
      `,
    });
  }

  private async send2FACode(user: User, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Your 2FA Code - Watchlist App',
      html: `
        <h1>Your 2FA Code</h1>
        <p>Your authentication code is:</p>
        <h2 style="color: #4CAF50; font-size: 24px; letter-spacing: 2px;">${code}</h2>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `,
    });
  }
}