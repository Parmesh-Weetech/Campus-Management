import * as dotenv from 'dotenv';
import * as path from 'path';
import { LoginReqDTO } from '../../src/app/rest/dto/request/login-req.dto';

dotenv.config({ path: path.resolve('.env') });

export function mockAdmin(): LoginReqDTO {
    return {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
    }
}