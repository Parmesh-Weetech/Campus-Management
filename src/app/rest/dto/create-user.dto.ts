import { IsEmail, IsNotEmpty, IsNumber, IsPhoneNumber, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(20)
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(10)
    @MaxLength(10)
    phone: string;
}