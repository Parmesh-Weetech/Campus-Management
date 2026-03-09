import { Injectable } from '@nestjs/common';
import { UserResDTO } from '../rest/dto/response/user-res.dto';
import { UserReaderService } from './user-reader.service';
import { CreateUserReqDTO } from '../rest/dto/request/create-user-req.dto';
import { UserWriterService } from './user-writer.service';
import { UserRole } from './types/user-role';
import { CustomExceptionFactory } from '../common/exception/custom-exception.factory';
import { ErrorCode } from '../common/exception/error-code';
import { User } from './entities/user.entity';
import { canViewTargetProfile } from './helper/utils';
import { ProfileImageType } from './enum/profile-image-type.enum';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class UserService {
    constructor(
        private readonly userReaderService: UserReaderService,
        private readonly userWriterService: UserWriterService,
        private readonly cryptoService: CryptoService
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

    async findUserProfileDetails(userId: string, user: User): Promise<UserResDTO> {
        const targetUser = await this.findByIdOrThrow(userId);
    
        const canView = canViewTargetProfile(user, targetUser.data);

        if (!canView) throw CustomExceptionFactory.create(ErrorCode.ROLE_PERMISSION_DENIED);

        return targetUser;
    }

    async createUser(createUserReqDTO: CreateUserReqDTO, role: UserRole.PROFESSOR | UserRole.STUDENT): Promise<UserResDTO> {
        const existingUserWithEmail = await this.userReaderService.findByEmail(createUserReqDTO.email);
        if (existingUserWithEmail) throw CustomExceptionFactory.create(ErrorCode.USER_ALREADY_EXISTS_WITH_EMAIL);

        const existingUserWithPhone = await this.userReaderService.findByPhone(createUserReqDTO.phoneNumber);
        if (existingUserWithPhone) throw CustomExceptionFactory.create(ErrorCode.USER_ALREADY_EXISTS_WITH_PHONE);

        const decryptedPassword = this.cryptoService.asymmetricDecrypt(createUserReqDTO.password);
        const hashedPassword = await this.cryptoService.hash(decryptedPassword);

        const createdUser = await this.userWriterService.createUser(createUserReqDTO, hashedPassword, role);

        if (!createdUser) throw CustomExceptionFactory.create(ErrorCode.INTERNAL_SERVER_ERROR);

        return {
            success: true,
            expired: false,
            data: createdUser,
            message: "User created successfully.",
            statusCode: 201
        };
    }

    async uploadProfilePhoto(file: Express.Multer.File, user: User): Promise<string> {
        if (!file) throw CustomExceptionFactory.create(ErrorCode.BAD_REQUEST, "File is required!");
        if (!user?.id) throw CustomExceptionFactory.create(ErrorCode.USER_NOT_IN_REQUEST);

        const updatedUser = await this.userWriterService.updateProfilePhotoOrThumbnail(user.id, file.filename, ProfileImageType.PROFILE_PHOTO);

        if (!updatedUser) throw CustomExceptionFactory.create(ErrorCode.USER_NOT_FOUND);

        return file.filename;
    }

    async uploadProfileThumbnail(file: Express.Multer.File, user: User): Promise<string> {
        if (!file) throw CustomExceptionFactory.create(ErrorCode.BAD_REQUEST, "File is required!");
        if (!user?.id) throw CustomExceptionFactory.create(ErrorCode.USER_NOT_IN_REQUEST);

        const updatedUser = await this.userWriterService.updateProfilePhotoOrThumbnail(user.id, file.filename, ProfileImageType.THUMBNAIL);

        if (!updatedUser) throw CustomExceptionFactory.create(ErrorCode.USER_NOT_FOUND);

        return file.filename;
    }
}
