import { Test, TestingModule } from "@nestjs/testing";
import { AttendanceController } from "../rest/controllers/attendance.controller"
import { AttendanceService } from "./attendance.service";
import { User } from "../user/entities/user.entity";
import { AttendanceStatus } from "./types/attendance-status.types";

describe('AttendanceController', () => {
    let attendanceController: AttendanceController;
    let attendanceService: AttendanceService;

    const mockAttendanceService = {
        createAttendance: jest.fn(),
        updateAttendance: jest.fn(),
        listAttendance: jest.fn(),
        getAttendanceByStudentDateClass: jest.fn(),
        deleteAttendance: jest.fn()
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AttendanceController],
            providers: [
                {
                    provide: AttendanceService,
                    useValue: mockAttendanceService,
                },
            ],
        }).compile();

        attendanceController = module.get<AttendanceController>(AttendanceController);
        attendanceService = module.get<AttendanceService>(AttendanceService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Create Attendance', () => {
        it('Should call attendanceService.createAttendance and return response', async () => {
            const user = { id: '1' } as User;
            const studentId = '2';
            const createAttendanceReq = {
                date: '2026-03-03',
                status: AttendanceStatus.PRESENT,
                className: 'Maths'
            };

            const attendanceRes = {
                id: '10',
                student: studentId,
                recordedBy: user.id,
                date: '2026-03-03',
                status: AttendanceStatus.PRESENT,
                className: 'Maths'
            };

            const mockResponse = {
                success: true,
                expired: false,
                message: 'Attendance recorded successfully.',
                statusCode: 201,
                data: attendanceRes
            };

            mockAttendanceService.createAttendance.mockResolvedValue(mockResponse);

            const result = await attendanceController.createAttendance(
                studentId,
                createAttendanceReq,
                user
            );

            expect(result).toEqual(mockResponse);
            expect(attendanceService.createAttendance).toHaveBeenCalledWith(
                createAttendanceReq,
                studentId,
                user.id
            );
        });
    });

    describe('Update Attendance', () => {
        it('Should call attendanceService.updateAttendance and return response', async () => {
            const user = { id: '1' } as User;
            const attendanceId = '10';
            const updateAttendanceReq = {
                status: AttendanceStatus.ABSENT
            };

            const attendanceRes = {
                id: '10',
                student: '2',
                recordedBy: user.id,
                date: '2026-03-03',
                status: AttendanceStatus.ABSENT,
                className: 'Maths'
            };

            const mockResponse = {
                success: true,
                expired: false,
                message: 'Attendance updated successfully.',
                statusCode: 200,
                data: attendanceRes
            };

            mockAttendanceService.updateAttendance.mockResolvedValue(mockResponse);

            const result = await attendanceController.updateAttendance(
                attendanceId,
                updateAttendanceReq,
                user
            );

            expect(result).toEqual(mockResponse);
            expect(attendanceService.updateAttendance).toHaveBeenCalledWith(
                updateAttendanceReq,
                attendanceId,
                user.id
            );
        });
    });

    describe('List Attendance', () => {
        it('Should call attendanceService.listAttendance and return response', async () => {
            const user = { id: '1' } as User;
            const listAttendanceReq = {
                month: '2026-03',
                className: 'Maths',
                page: 1,
                size: 10
            };

            const attendanceRes = {
                student: '1',
                recordedBy: '2',
                date: '2026-03-03',
                status: AttendanceStatus.PRESENT,
                className: 'Maths'
            };

            const mockResponse = {
                success: true,
                data: {
                    items: [attendanceRes],
                    page: 1,
                    size: 10,
                    total: 1,
                    totalPages: 1
                },
                expired: false,
                statusCode: 200,
                message: 'Attendance list fetched successfully.'
            };

            mockAttendanceService.listAttendance.mockResolvedValue(mockResponse);

            const result = await attendanceController.listAttendance(
                listAttendanceReq,
                user
            );

            expect(result).toEqual(mockResponse);
            expect(attendanceService.listAttendance).toHaveBeenCalledWith(
                listAttendanceReq,
                user
            );
        });
    });

    describe('Get Attendance by Date and Class', () => {
        it('Should call attendanceService.getAttendanceByStudentDateClass and return response', async () => {
            const studentId = '2';
            const query = {
                date: '2026-03-03',
                className: 'Maths'
            };

            const attendanceRes = {
                student: '2',
                recordedBy: '1',
                date: '2026-03-03',
                status: AttendanceStatus.PRESENT,
                className: 'Maths'
            };

            const mockResponse = {
                success: true,
                data: attendanceRes,
                expired: false,
                statusCode: 200,
                message: 'Attendance Found.'
            };

            mockAttendanceService.getAttendanceByStudentDateClass.mockResolvedValue(mockResponse);

            const result = await attendanceController.getAttendanceByDateAndClass(
                studentId,
                query
            );

            expect(result).toEqual(mockResponse);
            expect(attendanceService.getAttendanceByStudentDateClass).toHaveBeenCalledWith(
                studentId,
                query.date,
                query.className
            );
        });
    });

    describe('Delete Attendance', () => {
        it('Should call attendanceService.deleteAttendance and return response', async () => {
            const user = { id: '1' } as User;
            const attendanceId = '10';

            const attendanceRes = {
                id: '10',
                student: '2',
                recordedBy: '1',
                date: '2026-03-03',
                status: AttendanceStatus.PRESENT,
                className: 'Maths'
            };

            const mockResponse = {
                success: true,
                expired: false,
                message: 'Attendance deleted successfully.',
                statusCode: 200,
                data: attendanceRes
            };

            mockAttendanceService.deleteAttendance.mockResolvedValue(mockResponse);

            const result = await attendanceController.deleteAttendance(
                attendanceId,
                user
            );

            expect(result).toEqual(mockResponse);
            expect(attendanceService.deleteAttendance).toHaveBeenCalledWith(
                attendanceId,
                user.id
            );
        });
    });
})
