import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from '../rest/controllers/student.controller';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  providers: [StudentService],
  controllers: [StudentController],
  imports: [AttendanceModule]
})
export class StudentModule {}
