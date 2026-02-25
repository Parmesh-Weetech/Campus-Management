import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from '../rest/controllers/auth.controller';
import { JwtModule } from '../jwt/jwt.module';
import { UserModule } from '../user/user.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [JwtModule, UserModule]
})
export class AuthModule {}
