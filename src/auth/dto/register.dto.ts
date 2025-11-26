import {IsEmail, IsNotEmpty, IsString, IsStrongPassword} from "class-validator";

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsStrongPassword()
    password: string;

    role: Role;
}