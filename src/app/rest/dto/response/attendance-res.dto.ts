import { Attendance } from "../../../attendance/entities/attendance.entity";
import { APIResponse } from "../../../common/helper/response";

export class AttendanceResDTO extends APIResponse {
    data: Attendance
}