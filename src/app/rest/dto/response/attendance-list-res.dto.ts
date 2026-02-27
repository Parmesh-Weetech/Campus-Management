import { ApiProperty } from "@nestjs/swagger";
import { Attendance } from "../../../attendance/entities/attendance.entity";
import { APIResponse } from "../../../common/helper/response";

class AttendanceListDataDTO {
    @ApiProperty({ type: () => [Attendance] }) items: Attendance[];
    @ApiProperty() total: number;
    @ApiProperty() page: number;
    @ApiProperty() size: number;
    @ApiProperty() totalPages: number;
}

export class AttendanceListResDTO extends APIResponse {
    @ApiProperty({ type: AttendanceListDataDTO })
    data: AttendanceListDataDTO;
}
