import { ConflictException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService, private readonly jwtService: JwtService) {}
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

        const payload = {
            sub: newUser.id,
            email: newUser.email,
            role: newUser.role,
        }

        return {
            access_token: await this.jwtService.signAsync(payload),
        }
    }

}
