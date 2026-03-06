import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from '../rest/controllers/attendance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AttendanceWriterService } from './attendance-writer.service';
import { AttendanceReaderService } from './attendance-reader.service';

@Module({
  providers: [AttendanceService, AttendanceWriterService, AttendanceReaderService],
  controllers: [AttendanceController],
  imports: [TypeOrmModule.forFeature([Attendance])]
})
export class AttendanceModule {}
