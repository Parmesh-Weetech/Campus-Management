import { Injectable } from "@nestjs/common";
import { RefreshToken } from "./entities/refresh-token.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

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
}
