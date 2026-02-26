import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { jwtConfig } from './jwt.config';
import { JwtService as Jwt } from '@nestjs/jwt';
import { CustomExceptionFactory } from '../common/exception/custom-exception.factory';
import { ErrorCode } from '../common/exception/error-code';

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

    async validateAccessToken(accessToken: string): Promise<T> {
        const payload = await this.jwtService.verify(accessToken);

        if (payload.isRefreshToken) throw CustomExceptionFactory.create(ErrorCode.INVALID_ACCESS_TOKEN);

        return payload as T;
    }
}
