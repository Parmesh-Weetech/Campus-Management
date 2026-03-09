import { Module } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenWriterService } from './refresh-token-writer.service';
import { JwtModule } from '../jwt/jwt.module';
import { UserModule } from '../user/user.module';
import { RefreshTokenReaderService } from './refresh-token-reader.service';
import { RefreshTokenController } from '../rest/controllers/refresh-token.controller';

@Module({
  providers: [RefreshTokenService, RefreshTokenWriterService, RefreshTokenReaderService],
  imports: [TypeOrmModule.forFeature([RefreshToken]), JwtModule, UserModule],
  exports: [RefreshTokenService],
  controllers: [RefreshTokenController]
})
export class RefreshTokenModule { }
