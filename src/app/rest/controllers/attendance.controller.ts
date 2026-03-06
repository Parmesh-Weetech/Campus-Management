import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { CreateAttendanceReqDTO } from "../dto/request/create-attendance-req.dto";
import { AttendanceResDTO } from "../dto/response/attendance-res.dto";
import { GetCurrentUser } from "src/app/auth/decorators/currentUser.decorator";
import { User } from "src/app/user/entities/user.entity";
import { AttendanceService } from "src/app/attendance/attendance.service";
import { ListAttendanceReqDTO } from "../dto/request/list-attendance-req.dto";
import { AttendanceListResDTO } from "../dto/response/attendance-list-res.dto";
import { UpdateAttendanceReqDTO } from "../dto/request/update-attendance-req.dto";
import { Role } from "src/app/auth/decorators/role.decorator";
import { UserRole } from "src/app/user/types/user-role";
import { AttendanceByDateClassReqDTO } from "../dto/request/get-attendance-by-date-class-req.dto";
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

@Controller({ path: 'attendance' })
@ApiTags('attendance')
@ApiBearerAuth()
export class AttendanceController {
    constructor(
        private readonly attendanceService: AttendanceService
    ) { }

    @Post('create/:studentId')
    @Role(UserRole.ADMIN, UserRole.PROFESSOR)
    @ApiResponse({ status: 201, type: AttendanceResDTO })
    @ApiParam({ name: 'studentId', type: String })
    async createAttendance(
        @Param('studentId', ParseUUIDPipe) studentId: string,
        @Body() createAttendanceReqDTO: CreateAttendanceReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceResDTO> {
        return await this.attendanceService.createAttendance(createAttendanceReqDTO, studentId, user.id);
    }

    @Patch('update/:attendanceId')
    @Role(UserRole.ADMIN, UserRole.PROFESSOR)
    @ApiResponse({ status: 200, type: AttendanceResDTO })
    @ApiParam({ name: 'attendanceId', type: String })
    async updateAttendance(
        @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
        @Body() updateAttendanceReqDTO: UpdateAttendanceReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceResDTO> {
        return await this.attendanceService.updateAttendance(updateAttendanceReqDTO, attendanceId, user.id);
    }

    @Get('list')
    @Role(UserRole.ADMIN, UserRole.PROFESSOR)
    @ApiResponse({ status: 200, type: AttendanceListResDTO })
    async listAttendance(
        @Query() listAttendanceReqDTO: ListAttendanceReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceListResDTO> {
        return await this.attendanceService.listAttendance(listAttendanceReqDTO, user);
    }

    @Get(':studentId')
    @Role(UserRole.ADMIN, UserRole.PROFESSOR)
    @ApiResponse({ status: 200, type: AttendanceResDTO })
    @ApiParam({ name: 'studentId', type: String })
    async getAttendanceByDateAndClass(
        @Param('studentId', ParseUUIDPipe) studentId: string,
        @Query() query: AttendanceByDateClassReqDTO
    ): Promise<AttendanceResDTO> {
        return await this.attendanceService.getAttendanceByStudentDateClass(
            studentId,
            query.date,
            query.className
        );
    }

    @Delete(':attendanceId')
    @Role(UserRole.ADMIN, UserRole.PROFESSOR)
    @ApiResponse({ status: 200, type: AttendanceResDTO })
    @ApiParam({ name: 'attendanceId', type: String })
    async deleteAttendance(
        @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
        @GetCurrentUser() user: User
    ): Promise<AttendanceResDTO> {
        return await this.attendanceService.deleteAttendance(attendanceId, user.id);
    }
}
