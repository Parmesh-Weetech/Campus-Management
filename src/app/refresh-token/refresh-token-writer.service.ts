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

    async saveRefreshToken(refresh_token: string, userId: string): Promise<RefreshToken> {
        return await this.refreshTokenRepository.save({
            refresh_token,
            user: { id: userId }
        });
    }
}
