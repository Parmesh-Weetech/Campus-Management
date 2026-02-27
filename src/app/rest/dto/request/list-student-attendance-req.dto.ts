import { OmitType } from "@nestjs/swagger";
import { ListAttendanceReqDTO } from "./list-attendance-req.dto";

export class ListStudentAttendanceReqDTO extends OmitType(ListAttendanceReqDTO, [
    'studentId'
]) { }