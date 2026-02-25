import { IsEmail, IsEmpty, IsLowercase, IsNotEmpty, IsString } from "class-validator";

export class LoginReqDTO {
    @IsEmail()
    @IsNotEmpty()
    @IsLowercase()
    email: string;

    @IsString()
    @IsEmpty()
    password: string;
}