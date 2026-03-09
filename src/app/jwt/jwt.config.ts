import { registerAs } from "@nestjs/config"
import { getEnvVal, isProd, isTest } from "../common/helper"
import * as fs from 'fs';
import { convertToSeconds } from "./helper/utils";

declare global {
    interface EnvVar {
        JWT_ACCESS_TOKEN_EXPIRES_IN: string;
        JWT_REFRESH_TOKEN_EXPIRES_IN: string;
        JWT_AUTH_PUBLIC_SECRET: string;
        JWT_AUTH_PRIVATE_SECRET: string;
        AUTH_PRIVATE_KEY_PATH?: string;
        AUTH_PUBLIC_KEY_PATH?: string;
        JWT_ISSUER: string;
    }
}

export const jwtConfig = registerAs("jwtConfig", () => {

    const accessTokenExpireIn = convertToSeconds(getEnvVal('JWT_ACCESS_TOKEN_EXPIRES_IN', isProd() ? '8h' : (isTest() ? '1s' : '1h')));
    const refreshTokenExpireIn = convertToSeconds(getEnvVal('JWT_REFRESH_TOKEN_EXPIRES_IN', isProd() ? '30d' : (isTest() ? '1h' : '1d')));

    let privateKey = getEnvVal("JWT_AUTH_PRIVATE_SECRET", '');
    let publicKey = getEnvVal("JWT_AUTH_PUBLIC_SECRET", '');

    if (!privateKey) {
        const privateKeyPath = getEnvVal('AUTH_PRIVATE_KEY_PATH');
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    }
    if (!publicKey) {
        const publicKeyPath = getEnvVal('AUTH_PUBLIC_KEY_PATH');
        publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    }

    const jwtIssuer = getEnvVal("JWT_ISSUER", 'localhost:3000');

    return {
        accessTokenExpireIn,
        refreshTokenExpireIn,
        privateKey,
        publicKey,
        jwtIssuer
    }
})