import { Injectable } from '@nestjs/common';
import {PrismaService} from 'src/prisma.service';
import { RegisterDto } from 'src/auth/dto/register.dto';
@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) {}

    async getUserByEmail(email: string){
        const user = await this.prismaService.user.findUnique({
            where: {email}
        })
        return user;
    }

    async getUserById(id: number){
        const user = await this.prismaService.user.findUnique({
            where: {id}
        })
        return user;
    }

    async createUser(registerDto: RegisterDto){
        const data = {
            ...registerDto,
            role: registerDto.role,
        }
        return await this.prismaService.user.create({data})
    }
}
