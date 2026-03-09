import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as fs from 'fs';

import { getEnvVal } from '../common/helper';
import { JwtService } from './jwt.service';
import { jwtConfig } from './jwt.config';

@Module({
    providers: [JwtService],
    imports: [
        NestJwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async () => ({
                privateKey: fs.readFileSync(getEnvVal("AUTH_PRIVATE_KEY_PATH"), 'utf8'),
                publicKey: fs.readFileSync(getEnvVal("AUTH_PUBLIC_KEY_PATH"), 'utf-8'),
                signOptions: {
                    algorithm: 'RS256',
                    issuer: getEnvVal("JWT_ISSUER"),
                }
            })
        }),
        ConfigModule.forFeature(jwtConfig)
    ],
    exports: [JwtService]
})
export class JwtModule { }
