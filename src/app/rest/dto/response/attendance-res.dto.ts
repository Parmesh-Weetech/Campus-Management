import { ApiProperty } from "@nestjs/swagger";
import { Attendance } from "../../../attendance/entities/attendance.entity";
import { APIResponse } from "../../../common/helper/response";

export class AttendanceResDTO extends APIResponse {
    @ApiProperty({ type: () => Attendance })
    data: Attendance;
}