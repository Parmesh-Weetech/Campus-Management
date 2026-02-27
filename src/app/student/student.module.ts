import { Module } from '@nestjs/common';
import { StudentController } from '../rest/controllers/student.controller';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
    controllers: [StudentController],
    imports: [AttendanceModule]
})
export class StudentModule {}
