import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly prismaService: PrismaService,
    ) {}

    async register(registerDto: RegisterDto){
        const user = await this.userService.getUserByEmail(registerDto.email);

        if(user){
            throw new ConflictException('Email already in use');
        }

        // Store registration data temporarily with OTP (hashed password will be stored after OTP verification)
        // Send OTP email
        await this.emailService.sendOtpAndStore(registerDto.email);

        // Return a temporary token that can only be used to verify OTP and finalize registration
        // This token contains the registration data but user is not created yet
        const tempPayload = {
            email: registerDto.email,
            name: registerDto.name,
            password: registerDto.password,
            role: registerDto.role || 'CASHIER',
            isRegistrationPending: true,
        }

        return {
            access_token: await this.jwtService.signAsync(tempPayload, { expiresIn: '10m' }),
            requiresOtpVerification: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
        }
    }

    async finalizeRegistration(email: string, name: string, password: string, role: string = 'CASHIER') {
        const user = await this.userService.getUserByEmail(email);

        if(user){
            throw new ConflictException('User already registered with this email');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await this.userService.createUser({
            email,
            name,
            password: hashedPassword,
            role: role as any,
        });

        const payload = {
            sub: newUser.id,
            email: newUser.email,
            role: newUser.role,
        }

        return {
            access_token: await this.jwtService.signAsync(payload),
            message: 'Registration complete! Welcome aboard.',
        }
    }

    async login(loginDto: LoginDto){
        const user = await this.userService.getUserByEmail(loginDto.email);
        if(!user){
            throw new UnauthorizedException('Email or password is incorrect');
        }

        const match = await bcrypt.compare(loginDto.password, user.password);
        if(!match){
            throw new UnauthorizedException('Email or password is incorrect');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        }
        return {
            access_token: await this.jwtService.signAsync(payload),
        }
    }
}
