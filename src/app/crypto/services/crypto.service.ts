import { Inject, Injectable } from '@nestjs/common';
import { cryptoConfig } from '../crypto.config';
import { ConfigType } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LogAround } from '../../common/logger/log-around';
import { ErrorCode } from '../../common/exception/error-code';
import { CustomExceptionFactory } from '../../common/exception/custom-exception.factory';

@Injectable()
export class CryptoService {
    constructor(
        @Inject(cryptoConfig.KEY)
        private readonly config: ConfigType<typeof cryptoConfig>,
    ) { }

    public get publicKey(): string {
        return this.config.publicKey;
    }

    protected get privateKey(): string {
        return this.config.privateKey;
    }

    @LogAround()
    public async hash(text: string): Promise<string> {
        return await bcrypt.hash(text, this.config.saltRound);
    }

    @LogAround()
    public async compareHash(hash: string, value: string): Promise<boolean> {
        return await bcrypt.compare(value, hash);
    }
    @LogAround()
    public asymmetricEncrypt(text: string): string {
        try {
            const encrypted = crypto.publicEncrypt(
                {
                    key: this.publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256',
                },
                Buffer.from(text, 'utf8'),
            );

            const encryptedBase64 = encrypted.toString('base64');
            return encryptedBase64;
        } catch (error) {
            console.error('Asymmetric Encryption Error:', error);
            throw error;
        }
    }

    @LogAround()
    public asymmetricDecrypt(encryptedText: string): string {
        try {
            const decrypted = crypto.privateDecrypt(
                {
                    key: this.privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256',
                },
                Buffer.from(encryptedText, 'base64'),
            );
            const decryptedText = decrypted.toString('utf8');
            return decryptedText;
        } catch (error) {
            console.error('Asymmetric Decryption Error:', error);
            throw CustomExceptionFactory.create(ErrorCode.INVALID_ENCRYPTED_TEXT);
        }
    }
}
