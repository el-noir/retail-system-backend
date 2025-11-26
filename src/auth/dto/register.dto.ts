import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from "class-validator";
import { Role } from "@prisma/client";
export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsStrongPassword()
    password: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;    
}