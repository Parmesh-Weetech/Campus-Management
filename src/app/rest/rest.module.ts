import { Module } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { AdminModule } from "../admin/admin.module";
import { ProfessorModule } from "../professor/professor.module";
import { StudentModule } from "../student/student.module";
import { AuthModule } from "../auth/auth.module";
import { JwtModule } from "../jwt/jwt.module";
import { RefreshTokenModule } from "../refresh-token/refresh-token.module";

@Module({
    imports: [
        UserModule,
        AdminModule,
        ProfessorModule,
        StudentModule,
        AuthModule,
        JwtModule,
        RefreshTokenModule
    ]
})
export class RestModule { }