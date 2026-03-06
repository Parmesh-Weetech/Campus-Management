import * as bcrypt from 'bcrypt';
import { getEnvVal } from '../../common/helper/env';
import { convertIntoNumber } from '../../jwt/helper/utils';

export const comparePasswords = async (password: string, hashPassword: string) => {
    return await bcrypt.compare(password, hashPassword);
}

export const generateHashPassword = async (password: string) => {
    const genSalt = convertIntoNumber(getEnvVal("HASHING_SALT", '20'))
    return await bcrypt.hash(password, genSalt);
}