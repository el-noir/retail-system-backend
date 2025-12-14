import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
