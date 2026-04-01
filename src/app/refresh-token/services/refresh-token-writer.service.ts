import { Injectable } from "@nestjs/common";
import { RefreshToken } from "../entities/refresh-token.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, Repository, UpdateResult } from "typeorm";

@Injectable()
export class RefreshTokenWriterService {

    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>
    ) { }

    async saveRefreshToken(refreshToken: string, userId: string): Promise<RefreshToken> {
        return await this.refreshTokenRepository.save({
            refreshToken,
            user: { id: userId }
        });
    }

    async updateRefreshToken(oldRefreshToken: string, newRefreshToken: string, userId: string): Promise<UpdateResult> {
        return await this.refreshTokenRepository.update({
            user: { id: userId },
            refreshToken: oldRefreshToken
        }, {
            refreshToken: newRefreshToken
        });
    }

    async deleteToken(userId: string, refreshToken: string): Promise<DeleteResult> {
        return await this.refreshTokenRepository.delete({
            user: { id: userId },
            refreshToken
        })
    }
}
