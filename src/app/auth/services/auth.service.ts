import { Injectable } from '@nestjs/common';
import { LoginReqDTO } from '../../rest/dto/request/login-req.dto';
import { LoginResDTO } from '../../rest/dto/response/login-res.dto';
import { UserService } from '../../user/services/user.service';
import { JwtService } from '../../jwt/services/jwt.service';
import { PayLoadType } from '../types/payload.types';
import { RefreshTokenService } from '../../refresh-token/services/refresh-token.service';
import { UserResDTO } from '../../rest/dto/response/user-res.dto';
import { CustomExceptionFactory } from '../../common/exception/custom-exception.factory';
import { ErrorCode } from '../../common/exception/error-code';
import { CryptoService } from '../../crypto/services/crypto.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService<PayLoadType>,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly cryptoService: CryptoService
    ) { }

    async login(loginReqDTO: LoginReqDTO): Promise<LoginResDTO> {
        const existingUser = await this.userService.findByEmailWithPasswordOrThrow(loginReqDTO.email);

        const decryptedPassword = await this.cryptoService.asymmetricDecrypt(loginReqDTO.password);

        const isPasswordCorrect = await this.cryptoService.compareHash(
            existingUser.password,
            decryptedPassword,
        );

        if (!isPasswordCorrect) {
            throw CustomExceptionFactory.create(ErrorCode.INVALID_CREDENTIALS);
        }

        const payload: PayLoadType = {
            userId: existingUser.id,
            email: existingUser.email,
            userRole: existingUser.userRole
        }

        const accessToken = await this.jwtService.signAccessToken(payload);
        const refreshToken = await this.jwtService.signRefreshToken(payload);

        await this.refreshTokenService.saveRefreshToken(refreshToken, existingUser.id);

        return {
            success: true,
            expired: false,
            data: {
                accessToken,
                refreshToken
            },
            message: "Login Successful",
            statusCode: 200
        }
    }

    async logout(userId: string, refreshToken: string): Promise<string> {
        const logoutResponse = await this.refreshTokenService.deleteToken(userId, refreshToken);

        if (logoutResponse.affected === null || logoutResponse.affected === undefined || logoutResponse.affected === 0) {
            return "Failed to logout! Try again...";
        }

        return "Logout successful."
    }

    async validateUser(userId: string): Promise<UserResDTO> {
        return await this.userService.findByIdOrThrow(userId);
    }
}
