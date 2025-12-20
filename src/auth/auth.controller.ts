import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { EmailService } from 'src/email/email.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly emailService: EmailService,
    ) {}

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        console.log('Login attempt received in controller');
        return this.authService.login(loginDto);
    }

    @Post('verify-otp')
    async verifyOtp(@Body() body: { email: string; otp: string }) {
        const { email, otp } = body;

        if (!email || !otp) {
            throw new BadRequestException('Email and OTP are required');
        }

        const isValid = await this.emailService.verifyOtp(email, otp);

        if (!isValid) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // OTP verified successfully - in production, you could mark user as verified
        return { message: 'OTP verified successfully' };
    }
}
