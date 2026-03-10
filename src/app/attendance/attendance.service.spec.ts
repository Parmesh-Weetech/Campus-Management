import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { AttendanceWriterService } from './attendance-writer.service';
import { AttendanceReaderService } from './attendance-reader.service';
import { UserService } from '../user/user.service';
import { ErrorCode } from '../common/exception/error-code';
import { CustomException } from '../common/exception/custom-exception';
import { UserRole } from '../user/types/user-role';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceWriterService: AttendanceWriterService;
  let attendanceReaderService: AttendanceReaderService;
  let userService: UserService;

  const mockAttendanceWriterService = {
    createAttendance: jest.fn(),
    updateAttendance: jest.fn(),
    deleteAttendance: jest.fn(),
  };

  const mockAttendanceReaderService = {
    findByStudentDateClass: jest.fn(),
    findByIdWithRelations: jest.fn(),
    findDuplicateForUpdate: jest.fn(),
    listAttendance: jest.fn(),
  };

  const mockUserService = {
    findByIdOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: AttendanceWriterService, useValue: mockAttendanceWriterService },
        { provide: AttendanceReaderService, useValue: mockAttendanceReaderService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceWriterService = module.get<AttendanceWriterService>(AttendanceWriterService);
    attendanceReaderService = module.get<AttendanceReaderService>(AttendanceReaderService);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAttendance', () => {
    it('should create attendance and return response', async () => {
      const createAttendanceReq = {
        date: '2026-03-03',
        status: 'PRESENT',
        className: 'Maths',
      };
      const studentId = '2';
      const currentUserId = '1';

      mockUserService.findByIdOrThrow
        .mockResolvedValueOnce({ data: { id: studentId, userRole: UserRole.STUDENT } })
        .mockResolvedValueOnce({ data: { id: currentUserId, userRole: UserRole.ADMIN } });
      mockAttendanceReaderService.findByStudentDateClass.mockResolvedValue(null);
      mockAttendanceWriterService.createAttendance.mockResolvedValue({
        id: '10',
        student: { id: studentId },
        recordedBy: { id: currentUserId },
        date: createAttendanceReq.date,
        status: createAttendanceReq.status,
        className: createAttendanceReq.className,
      });

      const result = await service.createAttendance(
        createAttendanceReq,
        studentId,
        currentUserId
      );

      expect(userService.findByIdOrThrow).toHaveBeenCalledTimes(2);
      expect(attendanceReaderService.findByStudentDateClass).toHaveBeenCalledWith(
        studentId,
        createAttendanceReq.date,
        createAttendanceReq.className
      );
      expect(attendanceWriterService.createAttendance).toHaveBeenCalledWith(
        createAttendanceReq,
        studentId,
        currentUserId
      );
      expect(result).toMatchObject({
        success: true,
        statusCode: 201,
      });
    });

    it('should throw when studentId is missing', async () => {
      await expect(
        service.createAttendance({} as never, '', '1')
      ).rejects.toBeInstanceOf(CustomException);

      await expect(
        service.createAttendance({} as never, '', '1')
      ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
    });

    it('should throw when student is not a student role', async () => {
      mockUserService.findByIdOrThrow
        .mockResolvedValueOnce({ data: { id: '2', userRole: UserRole.ADMIN } })
        .mockResolvedValueOnce({ data: { id: '1', userRole: UserRole.ADMIN } });

      await expect(
        service.createAttendance({ date: '2026-03-03', className: 'Maths' } as never, '2', '1')
      ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
    });

    it('should throw when attendance already exists', async () => {
      mockUserService.findByIdOrThrow
        .mockResolvedValueOnce({ data: { id: '2', userRole: UserRole.STUDENT } })
        .mockResolvedValueOnce({ data: { id: '1', userRole: UserRole.ADMIN } });
      mockAttendanceReaderService.findByStudentDateClass.mockResolvedValue({ id: '10' });

      await expect(
        service.createAttendance({ date: '2026-03-03', className: 'Maths' } as never, '2', '1')
      ).rejects.toMatchObject({ code: ErrorCode.ATTENDANCE_ALREADY_EXISTS });
    });

    it('should throw when recordedBy user is missing', async () => {
      mockUserService.findByIdOrThrow
        .mockResolvedValueOnce({ data: { id: '2', userRole: UserRole.STUDENT } })
        .mockResolvedValueOnce(null);
      mockAttendanceReaderService.findByStudentDateClass.mockResolvedValue(null);

      await expect(
        service.createAttendance({ date: '2026-03-03', className: 'Maths' } as never, '2', '1')
      ).rejects.toMatchObject({ code: ErrorCode.USER_NOT_FOUND });
    });

    it('should throw when attendance creation fails', async () => {
      mockUserService.findByIdOrThrow
        .mockResolvedValueOnce({ data: { id: '2', userRole: UserRole.STUDENT } })
        .mockResolvedValueOnce({ data: { id: '1', userRole: UserRole.ADMIN } });
      mockAttendanceReaderService.findByStudentDateClass.mockResolvedValue(null);
      mockAttendanceWriterService.createAttendance.mockResolvedValue(null);

      await expect(
        service.createAttendance({ date: '2026-03-03', className: 'Maths' } as never, '2', '1')
      ).rejects.toMatchObject({ code: ErrorCode.ATTENDANCE_CREATE_FAILED });
    });
  });

  describe('updateAttendance', () => {
    it('should update attendance and return response', async () => {
      const existingAttendance = {
        id: '10',
        student: { id: '2' },
        date: '2026-03-03',
        className: 'Maths',
      };

      mockAttendanceReaderService.findByIdWithRelations.mockResolvedValue(existingAttendance);
      mockAttendanceReaderService.findDuplicateForUpdate.mockResolvedValue(null);
      mockAttendanceWriterService.updateAttendance.mockResolvedValue({
        ...existingAttendance,
        status: 'ABSENT',
      });

      const result = await service.updateAttendance(
        { status: 'ABSENT' } as never,
        '10',
        '1'
      );

      expect(attendanceReaderService.findByIdWithRelations).toHaveBeenCalledWith('10');
      expect(attendanceReaderService.findDuplicateForUpdate).toHaveBeenCalled();
      expect(attendanceWriterService.updateAttendance).toHaveBeenCalled();
      expect(result).toMatchObject({
        success: true,
        statusCode: 200,
      });
    });

    it('should throw when update payload is empty', async () => {
      await expect(
        service.updateAttendance({} as never, '10', '1')
      ).rejects.toMatchObject({ code: ErrorCode.ATTENDANCE_EMPTY_UPDATE_PAYLOAD });
    });

    it('should throw when attendance not found', async () => {
      mockAttendanceReaderService.findByIdWithRelations.mockResolvedValue(null);

      await expect(
        service.updateAttendance({ status: 'ABSENT' } as never, '10', '1')
      ).rejects.toMatchObject({ code: ErrorCode.ATTENDANCE_NOT_FOUND });
    });

    it('should throw when attendanceId is missing', async () => {
      await expect(
        service.updateAttendance({ status: 'ABSENT' } as never, '', '1')
      ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
    });

    it('should throw when currentUserId is missing', async () => {
      await expect(
        service.updateAttendance({ status: 'ABSENT' } as never, '10', '')
      ).rejects.toMatchObject({ code: ErrorCode.USER_NOT_IN_REQUEST });
    });

    it('should throw when duplicate attendance exists for update', async () => {
      const existingAttendance = {
        id: '10',
        student: { id: '2' },
        date: '2026-03-03',
        className: 'Maths',
      };

      mockAttendanceReaderService.findByIdWithRelations.mockResolvedValue(existingAttendance);
      mockAttendanceReaderService.findDuplicateForUpdate.mockResolvedValue({ id: '11' });

      await expect(
        service.updateAttendance({ status: 'ABSENT' } as never, '10', '1')
      ).rejects.toMatchObject({ code: ErrorCode.ATTENDANCE_ALREADY_EXISTS });
    });

    it('should throw when update fails', async () => {
      const existingAttendance = {
        id: '10',
        student: { id: '2' },
        date: '2026-03-03',
        className: 'Maths',
      };

      mockAttendanceReaderService.findByIdWithRelations.mockResolvedValue(existingAttendance);
      mockAttendanceReaderService.findDuplicateForUpdate.mockResolvedValue(null);
      mockAttendanceWriterService.updateAttendance.mockResolvedValue(null);

      await expect(
        service.updateAttendance({ status: 'ABSENT' } as never, '10', '1')
      ).rejects.toMatchObject({ code: ErrorCode.ATTENDANCE_UPDATE_FAILED });
    });
  });

  describe('listAttendance', () => {
    it('should list attendance and return response', async () => {
      mockAttendanceReaderService.listAttendance.mockResolvedValue([
        [{ id: '10' }],
        1,
      ]);

      const result = await service.listAttendance(
        { month: '2026-03', className: 'Maths', studentId: '2' } as never,
        { id: '1', userRole: UserRole.ADMIN } as never
      );

      expect(attendanceReaderService.listAttendance).toHaveBeenCalled();
      expect(result).toMatchObject({
        success: true,
        statusCode: 200,
      });
    });

    it('should throw when student scope is violated', async () => {
      await expect(
        service.listAttendance(
          { studentId: '2' } as never,
          { id: '1', userRole: UserRole.STUDENT } as never
        )
      ).rejects.toMatchObject({ code: ErrorCode.ATTENDANCE_STUDENT_SCOPE_VIOLATION });
    });

    it('should throw when studentId is missing for admin', async () => {
      await expect(
        service.listAttendance(
          { month: '2026-03' } as never,
          { id: '1', userRole: UserRole.ADMIN } as never
        )
      ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
    });

    it('should allow student to list own attendance without studentId', async () => {
      mockAttendanceReaderService.listAttendance.mockResolvedValue([[], 0]);

      const result = await service.listAttendance(
        { month: '2026-03' } as never,
        { id: '1', userRole: UserRole.STUDENT } as never
      );

      expect(result).toMatchObject({ success: true, statusCode: 200 });
    });
  });

  describe('getAttendanceByStudentDateClass', () => {
    it('should return attendance for student/date/class', async () => {
      mockAttendanceReaderService.findByStudentDateClass.mockResolvedValue({
        id: '10',
      });

      const result = await service.getAttendanceByStudentDateClass(
        '2',
        '2026-03-03',
        'Maths'
      );

      expect(attendanceReaderService.findByStudentDateClass).toHaveBeenCalledWith(
        '2',
        '2026-03-03',
        'Maths'
      );
      expect(result).toMatchObject({
        success: true,
        statusCode: 200,
      });
    });

    it('should throw when className is missing', async () => {
      await expect(
        service.getAttendanceByStudentDateClass('2', '2026-03-03', '')
      ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
    });

    it('should throw when attendance not found', async () => {
      mockAttendanceReaderService.findByStudentDateClass.mockResolvedValue(null);

      await expect(
        service.getAttendanceByStudentDateClass('2', '2026-03-03', 'Maths')
      ).rejects.toMatchObject({ code: ErrorCode.ATTENDANCE_NOT_FOUND });
    });

    it('should use today when date is missing', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-05T10:00:00Z'));
      mockAttendanceReaderService.findByStudentDateClass.mockResolvedValue({ id: '10' });

      const result = await service.getAttendanceByStudentDateClass(
        '2',
        undefined,
        'Maths'
      );

      expect(attendanceReaderService.findByStudentDateClass).toHaveBeenCalledWith(
        '2',
        '2026-03-05',
        'Maths'
      );
      expect(result).toMatchObject({ success: true, statusCode: 200 });
      jest.useRealTimers();
    });
  });

  describe('deleteAttendance', () => {
    it('should delete attendance and return response', async () => {
      mockAttendanceReaderService.findByIdWithRelations.mockResolvedValue({ id: '10' });
      mockAttendanceWriterService.deleteAttendance.mockResolvedValue(undefined);

      const result = await service.deleteAttendance('10', '1');

      expect(attendanceReaderService.findByIdWithRelations).toHaveBeenCalledWith('10');
      expect(attendanceWriterService.deleteAttendance).toHaveBeenCalledWith('10');
      expect(result).toMatchObject({
        success: true,
        statusCode: 200,
      });
    });

    it('should throw when attendanceId is missing', async () => {
      await expect(
        service.deleteAttendance('', '1')
      ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
    });

    it('should throw when currentUserId is missing', async () => {
      await expect(
        service.deleteAttendance('10', '')
      ).rejects.toMatchObject({ code: ErrorCode.USER_NOT_IN_REQUEST });
    });

    it('should throw when attendance not found', async () => {
      mockAttendanceReaderService.findByIdWithRelations.mockResolvedValue(null);

      await expect(
        service.deleteAttendance('10', '1')
      ).rejects.toMatchObject({ code: ErrorCode.ATTENDANCE_NOT_FOUND });
    });
  });
});
