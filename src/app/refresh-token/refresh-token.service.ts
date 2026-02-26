import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { RefreshTokenResDTO } from '../rest/dto/response/refresh-token-res.dto';

@Injectable()
export class RefreshTokenService {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>
    ) { }

    async saveRefreshToken(refresh_token: string, userId: string): Promise<RefreshTokenResDTO> {
        const saveRefreshToken = await this.refreshTokenRepository.save({
            refresh_token,
            user: { id: userId }
        });

        if (!saveRefreshToken) throw new InternalServerErrorException({ message: "Internal Server Error while saving token" });

        return {
            success: true,
            expired: false,
            message: "Refresh-Token saved successfully",
            statusCode: 200,
            data: saveRefreshToken
        }
    }
}
