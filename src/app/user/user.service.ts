import { Injectable, NotFoundException } from '@nestjs/common';
import { UserResDTO } from '../rest/dto/response/user-res.dto';
import { UserReaderService } from './user-reader.service';
import { CreateUserReqDTO } from '../rest/dto/request/create-user-req.dto';
import * as bcrypt from 'bcrypt';
import { convertIntoNumber } from '../jwt/helper/util';
import { getEnvVal } from '../common/helper';
import { UserWriterService } from './user-writer.service';
import { UserRole } from './types/user-role';

@Injectable()
export class UserService {
    constructor(
        private readonly userReaderService: UserReaderService,
        private readonly userWriterService: UserWriterService
    ) { }

    async findByEmailOrThrow(email: string): Promise<UserResDTO> {
        const user = await this.userReaderService.findByEmail(email);

        if (!user) {
            throw new NotFoundException({ message: "User not found" });
        }

        return {
            success: true,
            expired: false,
            data: user,
            message: "User found.",
            statusCode: 200
        };
    }

    async findByIdOrThrow(userId: string): Promise<UserResDTO> {
        const user = await this.userReaderService.findById(userId);

        if (!user) {
            throw new NotFoundException({ message: "User not found" });
        }

        return {
            success: true,
            expired: false,
            data: user,
            message: "User found.",
            statusCode: 200
        };
    }

    async createUser(createUserReqDTO: CreateUserReqDTO, role: UserRole.PROFESSOR | UserRole.STUDENT): Promise<UserResDTO> {
        const existingUser = await this.findByEmailOrThrow(createUserReqDTO.email);

        const genSalt = convertIntoNumber(getEnvVal("HASHING_SALT", '20'))
        const hashPassword = await bcrypt.hash(createUserReqDTO.password, genSalt);

        return await this.userWriterService.createUser(createUserReqDTO, hashPassword, role);
    }
}
