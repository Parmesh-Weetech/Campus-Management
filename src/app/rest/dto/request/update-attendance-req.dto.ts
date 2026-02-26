import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { AttendanceStatus } from "../../../attendance/types/attendance-status.types";

export class UpdateAttendanceReqDTO {
    @IsDateString()
    @IsOptional()
    date?: string;

    @IsEnum(AttendanceStatus)
    @IsOptional()
    status?: AttendanceStatus;

    @IsString()
    @IsOptional()
    className?: string;
}
