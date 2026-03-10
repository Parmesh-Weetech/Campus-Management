import { Test, TestingModule } from "@nestjs/testing";
import { StudentController } from "../rest/controllers/student.controller";
import { AttendanceService } from "../attendance/attendance.service";
import { User } from "../user/entities/user.entity";
import { UserRole } from "../user/types/user-role";

describe('StudentController', () => {
    let studentController: StudentController;
    let attendanceService: AttendanceService

    const mockAttendanceService = {
        listAttendance: jest.fn(),
        getAttendanceByStudentDateClass: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [StudentController],
            providers: [
                {
                    provide: AttendanceService,
                    useValue: mockAttendanceService,
                },
            ],
        }).compile();

        studentController = module.get<StudentController>(StudentController);
        attendanceService = module.get<AttendanceService>(AttendanceService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('List Attendance', () => {
        it('Should call attendanceService.listAttendance and return response', async () => {
            const user = { id: '1', userRole: UserRole.STUDENT } as User;

            const listStudentAttendanceReq = {
                month: '03-2026',
                className: "Maths"
            };

            const listStudentAttendanceRes = {
                student: '1',
                recordedBy: '2',
                date: '2026-03-03',
                status: "PRESENT",
                className: "Maths"
            }

            const mockResponse = {
                success: true,
                data: {
                    items: [listStudentAttendanceRes],
                    page: 1,
                    size: 1,
                    total: 1,
                    totalPages: 1,

                },
                expired: false,
                statusCode: 200,
                message: "List of attendance fetched successfully."
            }

            mockAttendanceService.listAttendance.mockResolvedValue(mockResponse);

            const result = await studentController.listAttendance(listStudentAttendanceReq, user);

            expect(result).toEqual(mockResponse);
            expect(attendanceService.listAttendance).toHaveBeenCalledWith(listStudentAttendanceReq, user);
        })
    });

    describe('Get Attendance by Date and Class', () => {
        it('Should call attendance.getAttendanceByStudentDateClass and return response', async () => {
            const user = { id: '1', userRole: UserRole.STUDENT } as User;

            const attendanceByDateAndClassReq = {
                className: "Maths",
                date: "2026-03-03"
            }

            const attendanceRes = {
                student: '1',
                recordedBy: '2',
                date: '2026-03-03',
                status: "PRESENT",
                className: "Maths"
            }

            const mockResponse = {
                success: true,
                data: attendanceRes,
                expired: false,
                statusCode: 200,
                message: "List of attendance fetched successfully."
            }

            mockAttendanceService.getAttendanceByStudentDateClass.mockResolvedValue(mockResponse);

            const result = await studentController.getAttendanceByDateAndClass(attendanceByDateAndClassReq, user);

            expect(result).toEqual(mockResponse);
            expect(attendanceService.getAttendanceByStudentDateClass).toHaveBeenCalledWith(user.id, attendanceByDateAndClassReq.date, attendanceByDateAndClassReq.className);
        })
    });
});