import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GetAttendanceByDateClassReqDTO {
    @IsOptional()
    @IsDateString()
    date?: string;

    @IsString()
    @IsNotEmpty()
    className: string;
}
