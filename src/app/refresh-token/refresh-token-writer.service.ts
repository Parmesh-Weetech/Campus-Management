import { Injectable } from "@nestjs/common";
import { RefreshToken } from "./entities/refresh-token.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, UpdateResult } from "typeorm";

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
}
