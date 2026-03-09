import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "../../auth/decorators/public.decorator";
import { AsymmetricDecryptReqDto } from "../dto/request/crypto-req.dto";
import { CryptoService } from "../../crypto/crypto.service";
import { isProd } from "../../common/helper";
import { AsymmetricEncryptResDto } from "../dto/response/crypto-res.dto";

@Controller({ path: 'crypto' })
export class CryptoController {
    constructor(private readonly cryptoService: CryptoService) { }

    @Public()
    @Post('asymmetric-encrypt')
    @ApiOperation({
        summary: 'Asymmetric Encrypt Text (For non-production use only)',
        deprecated: true,
    })
    @ApiResponse({ status: 200, description: 'Text encrypted successfully.' })
    async asymmetricEncrypt(
        @Body() dto: AsymmetricDecryptReqDto,
    ): Promise<AsymmetricEncryptResDto> {
        if (!isProd()) {
            return { text: await this.cryptoService.asymmetricEncrypt(dto.text) };
        } else {
            return { text: 'This API is only built for non-prod environments.' };
        }
    }
}