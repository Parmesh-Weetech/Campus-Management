import { Inject, Injectable } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { jwtConfig } from './jwt.config';
import { JwtService as Jwt } from '@nestjs/jwt';

@Injectable()
export class JwtService<T extends Object> {

    constructor(
        @Inject(jwtConfig.KEY)
        private readonly config: ConfigType<typeof jwtConfig>,

        private readonly jwtService: Jwt
    ) { }

    private omitExpAndIss(payload: T): Omit<T, 'exp' | 'iss'> {
        const { exp, iss, ...rest } = payload as T & { exp?: number; iss?: string };
        return rest as Omit<T, 'exp' | 'iss'>;
    }

    async signAccessToken(payload: T): Promise<string> {
        const cleanPayload = this.omitExpAndIss(payload);

        return this.jwtService.sign(cleanPayload, {
            expiresIn: this.config.accessTokenExpireIn
        });
    }

    async signRefreshToken(payload: T): Promise<string> {
        const cleanPayload = this.omitExpAndIss(payload);

        return this.jwtService.sign({
            ...cleanPayload, isRefreshToken: true
        }, {
            expiresIn: this.config.refreshTokenExpireIn
        })
    }
}
