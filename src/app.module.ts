import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';

import { environmentConfig, postgresConfig } from './app/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestModule } from './app/rest/rest.module';

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
    RestModule
  ],
})
export class AppModule {

}
