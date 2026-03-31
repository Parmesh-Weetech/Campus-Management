import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RefreshToken } from "./entities/refresh-token.entity";
import { Repository } from "typeorm";
import { RefreshTokenResDTO } from "../rest/dto/response/refresh-token-res.dto";

@Injectable()
export class RefreshTokenReaderService {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>
    ) { }

    async findByRefreshToken(refreshToken: string): Promise<RefreshToken | null> {
        return await this.refreshTokenRepository.findOne({ where: { refreshToken } });
    }
}