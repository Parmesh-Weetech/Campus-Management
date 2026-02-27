import { IsEmail, IsLowercase, IsNotEmpty, IsString } from "class-validator";

export class LoginReqDTO {
    @IsEmail()
    @IsNotEmpty()
    @IsLowercase()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}