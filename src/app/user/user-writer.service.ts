import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserReqDTO } from "../rest/dto/request/create-user-req.dto";
import { UserResDTO } from "../rest/dto/response/user-res.dto";
import { UserStatus } from "./types/user-status";
import { UserRole } from "./types/user-role";

@Injectable()
export class UserWriterService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
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

    async updateProfilePhoto(userId: string, profilePicture: string): Promise<User | null> {
        const targetUser = await this.userRepository.findOne({ where: { id: userId } });

        if (!targetUser) return null;

        targetUser.profilePicture = profilePicture;

        return await this.userRepository.save(targetUser);
    }
}
