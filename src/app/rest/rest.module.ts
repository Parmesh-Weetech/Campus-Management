import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { UserModule } from "../user/user.module";
import { AuthModule } from "../auth/auth.module";
import { JwtModule } from "../jwt/jwt.module";
import { RefreshTokenModule } from "../refresh-token/refresh-token.module";
import { AuthGuard } from "../auth/guards/auth.guard";
import { AttendanceModule } from "../attendance/attendance.module";
import { StudentModule } from "../student/student.module";
import { CryptoModule } from "../crypto/crypto.module";

@Module({
    imports: [
        UserModule,
        AuthModule,
        JwtModule,
        RefreshTokenModule,
        AttendanceModule,
        StudentModule,
        CryptoModule
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard
        }
    ]
})
export class RestModule { }