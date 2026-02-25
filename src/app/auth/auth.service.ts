import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginReqDTO } from '../rest/dto/request/login-req.dto';
import { LoginResDTO } from '../rest/dto/response/login-res.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { comparePasswords } from './helper/util';
import { JwtService } from '../jwt/jwt.service';
import { PayLoadType } from './types/payload.types';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService<PayLoadType>
    ) { }

    async login(loginReqDTO: LoginReqDTO): Promise<LoginResDTO> {
        const existingUser = await this.userService.findByEmailOrThrow(loginReqDTO.email);

        const passwordMatch = await comparePasswords(loginReqDTO.password, existingUser.data.password);

        if (!passwordMatch) throw new BadRequestException({ message: "Invalid Credentials!" });

        const payload: PayLoadType = {
            userId: existingUser.data.id,
            email: existingUser.data.email,
            userRole: existingUser.data.userRole
        }

        const accessToken = await this.jwtService.signAccessToken(payload);
        const refreshToken = await this.jwtService.signRefreshToken(payload);

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
}
