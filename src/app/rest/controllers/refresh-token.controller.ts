import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { RefreshTokenService } from "../../refresh-token/services/refresh-token.service";
import { Public } from "../../auth/decorators/public.decorator";
import { LoginResDTO } from "../dto/response/login-res.dto";

@Controller({ path: 'refresh', version: '1' })
export class RefreshTokenController {
    constructor(private readonly refreshTokenService: RefreshTokenService) { }

    @Public()
    @Post('access-token')
    @HttpCode(HttpStatus.OK)
    async refreshAccessToken(@Body() body?: { refreshToken?: string }): Promise<LoginResDTO> {
        return await this.refreshTokenService.refreshAccessToken(body?.refreshToken);
    }
}
