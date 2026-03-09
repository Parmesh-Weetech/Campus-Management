import { Test, TestingModule } from "@nestjs/testing";
import { StudentController } from "../rest/controllers/student.controller";
import { AttendanceService } from "../attendance/attendance.service";
import { User } from "../user/entities/user.entity";
import { AttendanceListResDTO } from "../rest/dto/response/attendance-list-res.dto";
import { Attendance } from "../attendance/entities/attendance.entity";

describe('StudentController', () => {
    let studentController: StudentController;
    let attendanceService: AttendanceService

    const mockAttendanceService = {
        listAttendance: jest.fn(),
        getAttendanceByDateAndClass: jest.fn()
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
            const user = { id: '1', userRole: "STUDENT" } as User;

            const listStudentAttendanceReq = {
                studentId: '1',
                month: '03-2026'
            } as Attendance;

            const mockResponse: AttendanceListResDTO = {
                success: true,
                data: {
                    items: listStudentAttendanceReq[],
                    page: 1,
                    size: 1,
                    total: 1,
                    totalPages: 1,

                }
            }
        })
    })
});