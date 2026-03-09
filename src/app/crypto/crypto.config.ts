import { registerAs } from "@nestjs/config";
import * as fs from 'fs';
import { getEnvVal } from "../common/helper";
import { ICryptOptions } from "./types/module-configuration";

declare global {
    interface EnvVar {
        CRYPTO_PUBLIC_KEY?: string;
        CRYPTO_PUBLIC_KEY_PATH?: string;
        CRYPTO_PRIVATE_KEY?: string;
        CRYPTO_PRIVATE_KEY_PATH?: string;
        CRYPTO_ALGORITHM?: string;
        CRYPTO_KEYPHRASS?: string;
    }
}

export const cryptoConfig = registerAs('jwtConfig', () => {
    if (!Number(getEnvVal('HASHING_SALT', '10'))) {
        throw new Error('HASHING_SALT environment variable is not of number type');
    }
    let publicKey = getEnvVal('CRYPTO_PUBLIC_KEY', '');
    if (!publicKey) {
        const publicKeyPath = getEnvVal('CRYPTO_PUBLIC_KEY_PATH');
        publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    }

    let privateKey = getEnvVal('CRYPTO_PRIVATE_KEY', '');
    if (!privateKey) {
        const privateKeyPath = getEnvVal('CRYPTO_PRIVATE_KEY_PATH');
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    }
    return {
        algorithm: getEnvVal('CRYPTO_ALGORITHM'),
        keyphrass: getEnvVal('CRYPTO_KEYPHRASS'),
        saltRound: Number(getEnvVal('HASHING_SALT', '10')),
        privateKey,
        publicKey,
    } as ICryptOptions;
});
