import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { AuthService } from '../../auth/services/auth.service';

import { LoginReqDTO } from '../dto/request/login-req.dto';
import { LoginResDTO } from '../dto/response/login-res.dto';
import { LogAround } from '../../common/logger/log-around';
import { ApiResponse } from '@nestjs/swagger';
import { GetCurrentUser } from '../../auth/decorators/currentUser.decorator';
import { User } from '../../user/entities/user.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {

    constructor(private readonly authService: AuthService) { }
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @LogAround()
    @ApiResponse({ status: 200, type: LoginResDTO })
    async login(@Body() loginReqDTO: LoginReqDTO): Promise<LoginResDTO> {
        return await this.authService.login(loginReqDTO)
    }

    @Post('logout')
    @LogAround()
    @ApiResponse({ status: 200 })
    async logout(@GetCurrentUser() user: User, @Body() body: { refreshToken: string }): Promise<string> {
        return await this.authService.logout(user.id, body.refreshToken)
    }
}
