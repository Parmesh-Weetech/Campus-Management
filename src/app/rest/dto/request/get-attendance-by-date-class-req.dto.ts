import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AttendanceByDateClassReqDTO {
    @IsOptional()
    @IsDateString()
    date?: string;

    @IsString()
    @IsNotEmpty()
    className: string;
}
