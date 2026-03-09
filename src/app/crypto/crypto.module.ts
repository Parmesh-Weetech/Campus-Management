import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptoService } from './crypto.service';
import { cryptoConfig } from './crypto.config';
import { CryptoController } from '../rest/controllers/crypto.controller';

@Module({
  providers: [CryptoService],
  exports: [CryptoService],
  controllers: [CryptoController],
  imports: [ConfigModule.forFeature(cryptoConfig)],
})
export class CryptoModule { }
