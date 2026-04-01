import { Module } from '@nestjs/common';
import { AttendanceService } from './services/attendance.service';
import { AttendanceController } from '../rest/controllers/attendance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AttendanceWriterService } from './services/attendance-writer.service';
import { AttendanceReaderService } from './services/attendance-reader.service';
import { UserModule } from '../user/user.module';
import { AttendanceSummaryRefreshService } from './services/attendance-summary-refresh.service';

@Module({
  providers: [AttendanceService, AttendanceWriterService, AttendanceReaderService, AttendanceSummaryRefreshService],
  controllers: [AttendanceController],
  imports: [TypeOrmModule.forFeature([Attendance]), UserModule],
  exports: [AttendanceService]
})
export class AttendanceModule {}
