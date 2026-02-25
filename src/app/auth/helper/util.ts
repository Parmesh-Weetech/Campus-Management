import * as bcrypt from 'bcrypt';

export const comparePasswords = async (password: string, hashPassword: string) => {
    return await bcrypt.compare(password, hashPassword); 
}