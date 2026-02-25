import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './app/user/user.module';
import { environmentConfig, postgresConfig } from './app/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './app/admin/admin.module';
import { ProfessorModule } from './app/professor/professor.module';
import { StudentModule } from './app/student/student.module';
import { AuthModule } from './app/auth/auth.module';

const envPath = path.resolve('.env');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envPath,
      ignoreEnvFile: process.env.READ_LOCAL_ENV === 'true',
      load: [
        environmentConfig,
        postgresConfig
      ]
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('postgresConfig')!,
      }),
    }),
    UserModule,
    AdminModule,
    ProfessorModule,
    StudentModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {

}
