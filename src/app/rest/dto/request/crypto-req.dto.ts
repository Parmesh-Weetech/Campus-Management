import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AsymmetricCryptoReqDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    text: string;
}

export class AsymmetricDecryptReqDto extends AsymmetricCryptoReqDto { }
export class AsymmetricEncryptReqDto extends AsymmetricCryptoReqDto { }
