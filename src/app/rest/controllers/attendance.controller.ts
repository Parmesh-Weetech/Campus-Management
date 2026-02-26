import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { CreateAttendanceReqDTO } from "../dto/request/create-attendance-req.dto";
import { AttendanceResDTO } from "../dto/response/attendance-res.dto";
import { GetCurrentUser } from "src/app/auth/decorators/currentUser.decorator";
import { User } from "src/app/user/entities/user.entity";
import { AttendanceService } from "src/app/attendance/attendance.service";
import { ListAttendanceReqDTO } from "../dto/request/list-attendance-req.dto";
import { AttendanceListResDTO } from "../dto/response/attendance-list-res.dto";
import { UpdateAttendanceReqDTO } from "../dto/request/update-attendance-req.dto";

@Controller('attendance')
export class AttendanceController {
    constructor(
        private readonly attendanceService: AttendanceService
    ) { }

    @Post('create/:studentId')
    async createAttendance(
        @Param('studentId', ParseUUIDPipe) studentId: string,
        @Body() createAttendanceReqDTO: CreateAttendanceReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceResDTO> {
        return await this.attendanceService.createAttendance(createAttendanceReqDTO, studentId, user.id);
    }

    @Patch(':attendanceId')
    async updateAttendance(
        @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
        @Body() updateAttendanceReqDTO: UpdateAttendanceReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceResDTO> {
        return await this.attendanceService.updateAttendance(updateAttendanceReqDTO, attendanceId, user.id);
    }

    @Get('list')
    async listAttendance(
        @Query() listAttendanceReqDTO: ListAttendanceReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceListResDTO> {
        return await this.attendanceService.listAttendance(listAttendanceReqDTO, user);
    }

    @Delete(':attendanceId')
    async deleteAttendance(
        @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
        @GetCurrentUser() user: User
    ): Promise<AttendanceResDTO> {
        return await this.attendanceService.deleteAttendance(attendanceId, user.id);
    }
}
