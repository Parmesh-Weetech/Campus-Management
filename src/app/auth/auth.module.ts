import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from '../rest/controllers/auth.controller';
import { JwtModule } from '../jwt/jwt.module';
import { UserModule } from '../user/user.module';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [JwtModule, UserModule, RefreshTokenModule],
  exports: [AuthService]
})
export class AuthModule {}
