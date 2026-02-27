import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AttendanceByDateClassReqDTO {
    @IsOptional()
    @IsDateString()
    @ApiPropertyOptional()
    date?: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    className: string;
}
