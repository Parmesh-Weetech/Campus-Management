import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsLowercase, IsNotEmpty, IsString } from "class-validator";

export class LoginReqDTO {
    @IsEmail()
    @IsNotEmpty()
    @IsLowercase()
    @ApiProperty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    password: string;
}