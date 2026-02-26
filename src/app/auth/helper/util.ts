import * as bcrypt from 'bcrypt';
import { getEnvVal } from 'src/app/common/helper';
import { convertIntoNumber } from 'src/app/jwt/helper/util';

export const comparePasswords = async (password: string, hashPassword: string) => {
    return await bcrypt.compare(password, hashPassword); 
}

export const generateHashPassword = async (password: string) => {
    const genSalt = convertIntoNumber(getEnvVal("HASHING_SALT", '20'))
    return await bcrypt.hash(password, genSalt);
}