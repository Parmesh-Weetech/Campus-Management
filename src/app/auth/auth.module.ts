import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from '../rest/controllers/auth.controller';
import { JwtModule } from '../jwt/jwt.module';
import { UserModule } from '../user/user.module';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [JwtModule, UserModule, RefreshTokenModule, CryptoModule],
  exports: [AuthService]
})
export class AuthModule { }
