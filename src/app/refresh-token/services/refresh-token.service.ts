import { Injectable } from '@nestjs/common';
import { RefreshTokenResDTO } from '../../rest/dto/response/refresh-token-res.dto';
import { RefreshTokenWriterService } from './refresh-token-writer.service';
import { CustomExceptionFactory } from '../../common/exception/custom-exception.factory';
import { ErrorCode } from '../../common/exception/error-code';
import { LoginResDTO } from '../../rest/dto/response/login-res.dto';
import { RefreshTokenReaderService } from './refresh-token-reader.service';
import { JwtService } from '../../jwt/services/jwt.service';
import { PayLoadType } from '../../auth/types/payload.types';
import { UserService } from '../../user/services/user.service';
import { DeleteResult } from 'typeorm';

@Injectable()
export class RefreshTokenService {
    constructor(
        private readonly refreshTokenWriterService: RefreshTokenWriterService,
        private readonly refreshTokenReaderService: RefreshTokenReaderService,
        private readonly jwtService: JwtService<PayLoadType>,
        private readonly userService: UserService
    ) { }

    async saveRefreshToken(refreshToken: string, userId: string): Promise<RefreshTokenResDTO> {
        const savedRefreshToken = await this.refreshTokenWriterService.saveRefreshToken(refreshToken, userId);

        if (!savedRefreshToken) throw CustomExceptionFactory.create(ErrorCode.REFRESH_TOKEN_SAVE_FAILED);

        return {
            success: true,
            data: savedRefreshToken,
            expired: false,
            message: "Refresh-Token saved successfully",
            statusCode: 200,
        }
    }

    async refreshAccessToken(refreshToken?: string): Promise<LoginResDTO> {
        if (!refreshToken || typeof refreshToken !== "string") {
            throw CustomExceptionFactory.create(ErrorCode.INVALID_AUTHORIZATION_FORMAT);
        }

        const [type, authorization] = refreshToken.split(" ");

        const token = type === "Bearer" ? authorization : undefined;
        if (!token) throw CustomExceptionFactory.create(ErrorCode.INVALID_AUTHORIZATION_FORMAT);

        const existingRefreshToken = await this.refreshTokenReaderService.findByRefreshToken(token);
        if (!existingRefreshToken) throw CustomExceptionFactory.create(ErrorCode.REFRESH_TOKEN_NOT_FOUND);

        const validateAndDecodeToken = await this.jwtService.validateRefreshToken(token);

        const existingUser = await this.userService.findByIdOrThrow(validateAndDecodeToken.userId);

        const payload: PayLoadType = {
            userId: existingUser.data.id,
            email: existingUser.data.email,
            userRole: existingUser.data.userRole
        }

        const newAccessToken = await this.jwtService.signAccessToken(payload);
        const newRefreshToken = await this.jwtService.signRefreshToken(payload);

        const updateRefreshToken = await this.refreshTokenWriterService.updateRefreshToken(token, newRefreshToken, existingUser.data.id);
        if (updateRefreshToken.affected === null
            || updateRefreshToken.affected === undefined
            || updateRefreshToken.affected === 0
        ) {
            throw CustomExceptionFactory.create(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        return {
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            },
            expired: false,
            message: "Refresh the access token successful.",
            statusCode: 200
        }
    }

    async deleteToken(userId: string, refreshToken: string): Promise<DeleteResult> {
        return await this.refreshTokenWriterService.deleteToken(userId, refreshToken);
    }
}
