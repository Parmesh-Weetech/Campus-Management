import { IsDateString, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { AttendanceStatus } from "../../../attendance/types/attendance-status.types";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAttendanceReqDTO {
    @IsDateString()
    @IsNotEmpty()
    @ApiProperty()
    date: string;

    @IsEnum(AttendanceStatus)
    @ApiProperty()
    status: AttendanceStatus;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    className: string;
}