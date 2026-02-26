import { Module } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenWriterService } from './refresh-token-writer.service';

@Module({
  providers: [RefreshTokenService, RefreshTokenWriterService],
  imports: [TypeOrmModule.forFeature([RefreshToken])],
  exports: [RefreshTokenService]
})
export class RefreshTokenModule {}
