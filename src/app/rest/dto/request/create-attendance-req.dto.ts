import { IsDateString, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { AttendanceStatus } from "../../../attendance/types/attendance-status.types";

export class CreateAttendanceReqDTO {
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @IsString()
    @IsNotEmpty()
    className: string;
}