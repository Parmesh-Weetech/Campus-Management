import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { AuthService } from '../../auth/auth.service';

import { LoginReqDTO } from '../dto/request/login-req.dto';
import { LoginResDTO } from '../dto/response/login-res.dto';
import { LogAround } from '../../common/logger/log-around';
import { ApiResponse } from '@nestjs/swagger';

@Controller('auth')
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
}
