import { Module } from '@nestjs/common';
import { ProfessorService } from './professor.service';

@Module({
  providers: [ProfessorService]
})
export class ProfessorModule {}
