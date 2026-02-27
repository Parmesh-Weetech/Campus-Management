import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { AttendanceStatus } from "../../../attendance/types/attendance-status.types";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateAttendanceReqDTO {
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional()
    date?: string;

    @IsEnum(AttendanceStatus)
    @IsOptional()
    @ApiPropertyOptional()
    status?: AttendanceStatus;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional()
    className?: string;
}
