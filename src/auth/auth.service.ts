import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
    ) {}

    async register(registerDto: RegisterDto){
        const user = await this.userService.getUserByEmail(registerDto.email);

        if(user){
            throw new ConflictException('Email already in Use');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const newUser = await this.userService.createUser({
            ...registerDto,
            password: hashedPassword,
        })

        // Send OTP email
        await this.emailService.sendOtpAndStore(registerDto.email);

        const payload = {
            sub: newUser.id,
            email: newUser.email,
            role: newUser.role,
        }

        return {
            access_token: await this.jwtService.signAsync(payload),
            requiresOtpVerification: true,
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
