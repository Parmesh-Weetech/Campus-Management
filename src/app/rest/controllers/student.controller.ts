import { Controller, Get, Query } from "@nestjs/common";
import { AttendanceService } from "src/app/attendance/attendance.service";
import { GetCurrentUser } from "src/app/auth/decorators/currentUser.decorator";
import { Role } from "src/app/auth/decorators/role.decorator";
import { User } from "src/app/user/entities/user.entity";
import { UserRole } from "src/app/user/types/user-role";
import { AttendanceListResDTO } from "../dto/response/attendance-list-res.dto";
import { ListStudentAttendanceReqDTO } from "../dto/request/list-student-attendance-req.dto";
import { AttendanceResDTO } from "../dto/response/attendance-res.dto";
import { AttendanceByDateClassReqDTO } from "../dto/request/get-attendance-by-date-class-req.dto";
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";

@Controller({ path: 'student' })
@ApiTags('student')
@ApiBearerAuth()
export class StudentController {
    constructor(
        private readonly attendanceService: AttendanceService
    ) { }

    @Get('attendance/list')
    @Role(UserRole.STUDENT)
    @ApiResponse({ status: 200, type: AttendanceListResDTO })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'size', required: false })
    @ApiQuery({ name: 'month', required: false })
    @ApiQuery({ name: 'className', required: false })
    async listAttendance(
        @Query() listStudentAttendanceReqDTO: ListStudentAttendanceReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceListResDTO> {
        return await this.attendanceService.listAttendance(listStudentAttendanceReqDTO, user);
    }

    @Get('attendance')
    @Role(UserRole.STUDENT)
    @ApiResponse({ status: 200, type: AttendanceResDTO })
    @ApiQuery({ name: 'date', required: true })
    @ApiQuery({ name: 'className', required: true })
    async getAttendanceByDateAndClass(
        @Query() query: AttendanceByDateClassReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceResDTO> {
        return await this.attendanceService.getAttendanceByStudentDateClass(
            user.id,
            query.date,
            query.className
        );
    }
}
