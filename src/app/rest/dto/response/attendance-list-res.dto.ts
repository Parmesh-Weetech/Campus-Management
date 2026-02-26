import { Attendance } from "../../../attendance/entities/attendance.entity";
import { APIResponse } from "../../../common/helper/response";

export class AttendanceListResDTO extends APIResponse {
    data: {
        items: Attendance[];
        total: number;
        page: number;
        size: number;
        totalPages: number;
    };
}
