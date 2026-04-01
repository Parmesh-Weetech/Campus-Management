import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserReqDTO } from "../../rest/dto/request/create-user-req.dto";
import { UserStatus } from "../types/user-status";
import { UserRole } from "../types/user-role";
import { ProfileImageType } from "../enum/profile-image-type.enum";
import { RedisService } from "../../redis/redis.service";

@Injectable()
export class UserWriterService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly redisService: RedisService
    ) { }

    async createUser(createUserReqDTO: CreateUserReqDTO, hashPassword: string, role: UserRole.PROFESSOR | UserRole.STUDENT): Promise<User | null> {
        const createUser = await this.userRepository.save({
            name: createUserReqDTO.name,
            email: createUserReqDTO.email,
            password: hashPassword,
            phoneNumber: createUserReqDTO.phoneNumber,
            status: UserStatus.ACTIVE,
            userRole: role
        });

        return createUser ?? null;
    }

    async updateProfilePhotoOrThumbnail(userId: string, profilePictureOrThumbnail: string, profileImageType: ProfileImageType): Promise<User | null> {
        const targetUser = await this.userRepository.findOne({ where: { id: userId } });

        if (!targetUser) return null;

        if (profileImageType === ProfileImageType.PROFILE_PHOTO) {
            targetUser.profilePicture = profilePictureOrThumbnail;
        } else {
            targetUser.profilePictureThumbnail = profilePictureOrThumbnail;
        }

        return await this.userRepository.save(targetUser);
    }
}
