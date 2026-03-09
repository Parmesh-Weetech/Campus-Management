import { Body, Controller, Post } from "@nestjs/common";
import { RefreshTokenService } from "../../refresh-token/refresh-token.service";
import { Public } from "../../auth/decorators/public.decorator";
import { LoginResDTO } from "../dto/response/login-res.dto";

@Controller({ path: 'refresh-token' })
export class RefreshTokenController {
    constructor(private readonly refreshTokenService: RefreshTokenService) { }

    @Public()
    @Post('generate/access-token')
    async refreshAccessToken(@Body() body: { refreshToken: string }): Promise<LoginResDTO> {
        return await this.refreshTokenService.refreshAccessToken(body.refreshToken);
    }
}