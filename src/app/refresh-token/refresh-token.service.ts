import { Injectable } from '@nestjs/common';
import { RefreshTokenResDTO } from '../rest/dto/response/refresh-token-res.dto';
import { RefreshTokenWriterService } from './refresh-token-writer.service';
import { CustomExceptionFactory } from '../common/exception/custom-exception.factory';
import { ErrorCode } from '../common/exception/error-code';

@Injectable()
export class RefreshTokenService {
    constructor(
        private readonly refreshTokenWriterService: RefreshTokenWriterService
    ) { }

    async saveRefreshToken(refresh_token: string, userId: string): Promise<RefreshTokenResDTO> {
        const savedRefreshToken = await this.refreshTokenWriterService.saveRefreshToken(refresh_token, userId);

        if (!savedRefreshToken) throw CustomExceptionFactory.create(ErrorCode.REFRESH_TOKEN_SAVE_FAILED);

        return {
            success: true,
            data: savedRefreshToken,
            expired: false,
            message: "Refresh-Token saved successfully",
            statusCode: 200,
        }
    }
}
