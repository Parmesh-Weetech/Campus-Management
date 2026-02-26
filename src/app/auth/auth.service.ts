import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginReqDTO } from '../rest/dto/request/login-req.dto';
import { LoginResDTO } from '../rest/dto/response/login-res.dto';
import { UserService } from '../user/user.service';
import { comparePasswords } from './helper/util';
import { JwtService } from '../jwt/jwt.service';
import { PayLoadType } from './types/payload.types';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { UserResDTO } from '../rest/dto/response/user-res.dto';
import { CustomExceptionFactory } from '../common/exception/custom-exception.factory';
import { ErrorCode } from '../common/exception/error-code';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService<PayLoadType>,
        private readonly refreshTokenService: RefreshTokenService
    ) { }

    async login(loginReqDTO: LoginReqDTO): Promise<LoginResDTO> {
        const existingUser = await this.userService.findByEmailOrThrow(loginReqDTO.email);

        const passwordMatch = await comparePasswords(loginReqDTO.password, existingUser.data.password);

        if (!passwordMatch) throw CustomExceptionFactory.create(ErrorCode.INVALID_CREDENTIALS);

        const payload: PayLoadType = {
            userId: existingUser.data.id,
            email: existingUser.data.email,
            userRole: existingUser.data.userRole
        }

        const accessToken = await this.jwtService.signAccessToken(payload);
        const refreshToken = await this.jwtService.signRefreshToken(payload);

        await this.refreshTokenService.saveRefreshToken(refreshToken, existingUser.data.id);

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

    async validateUser(userId: string): Promise<UserResDTO> {
        return await this.userService.findByIdOrThrow(userId);
    }
}
