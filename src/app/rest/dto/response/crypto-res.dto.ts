import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AsymmetricCryptoResDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    text: string;
}

export class AsymmetricDecryptResDto extends AsymmetricCryptoResDto { }
export class AsymmetricEncryptResDto extends AsymmetricCryptoResDto { }
