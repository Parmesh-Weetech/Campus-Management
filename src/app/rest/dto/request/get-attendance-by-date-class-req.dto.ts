import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AttendanceByDateClassReqDTO {
    @IsOptional()
    @IsDateString()
    @ApiProperty()
    date: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    className: string;
}
