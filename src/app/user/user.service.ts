import { Injectable } from '@nestjs/common';
import { UserResDTO } from '../rest/dto/response/user-res.dto';
import { UserReaderService } from './user-reader.service';
import { CreateUserReqDTO } from '../rest/dto/request/create-user-req.dto';
import { UserWriterService } from './user-writer.service';
import { UserRole } from './types/user-role';
import { CustomExceptionFactory } from '../common/exception/custom-exception.factory';
import { ErrorCode } from '../common/exception/error-code';
import { generateHashPassword } from '../auth/helper/util';

@Injectable()
export class UserService {
    constructor(
        private readonly userReaderService: UserReaderService,
        private readonly userWriterService: UserWriterService
    ) { }

    async findByEmailOrThrow(email: string): Promise<UserResDTO> {
        const user = await this.userReaderService.findByEmail(email);

        if (!user) throw CustomExceptionFactory.create(ErrorCode.USER_NOT_FOUND);

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

        if (!user) throw CustomExceptionFactory.create(ErrorCode.USER_NOT_FOUND);

        return {
            success: true,
            expired: false,
            data: user,
            message: "User found.",
            statusCode: 200
        };
    }

    async createUser(createUserReqDTO: CreateUserReqDTO, role: UserRole.PROFESSOR | UserRole.STUDENT): Promise<UserResDTO> {
        const existingUserWithEmail = await this.userReaderService.findByEmail(createUserReqDTO.email);
        if (existingUserWithEmail) throw CustomExceptionFactory.create(ErrorCode.USER_ALREADY_EXISTS_WITH_EMAIL);

        const existingUserWithPhone = await this.userReaderService.findByPhone(createUserReqDTO.phoneNumber);
        if (existingUserWithPhone) throw CustomExceptionFactory.create(ErrorCode.USER_ALREADY_EXISTS_WITH_PHONE);

        const hashPassword = await generateHashPassword(createUserReqDTO.password);

        const createdUser = await this.userWriterService.createUser(createUserReqDTO, hashPassword, role);

        if (!createdUser) throw CustomExceptionFactory.create(ErrorCode.INTERNAL_SERVER_ERROR);

        return {
            success: true,
            expired: false,
            data: createdUser,
            message: "User created successfully.",
            statusCode: 201
        };
    }
}
