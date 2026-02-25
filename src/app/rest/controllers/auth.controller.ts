import { Body, Controller, Post } from '@nestjs/common';
import { LoginReqDTO } from '../dto/request/login-req.dto';
import { LoginResDTO } from '../dto/response/login-res.dto';
import { APIResponse } from 'src/app/common/helper';

@Controller('auth')
export class AuthController {
    @Post('login')
    async login(@Body() loginReqDTO: LoginReqDTO): Promise<LoginResDTO> {
        return {
            
        }
    }
}
