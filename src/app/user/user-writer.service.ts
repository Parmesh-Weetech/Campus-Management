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

    async createUser(createUserReqDTO: CreateUserReqDTO, hashPassword: string, role: UserRole.PROFESSOR | UserRole.STUDENT): Promise<UserResDTO> {
        const createUser = await this.userRepository.save({
            name: createUserReqDTO.name,
            email: createUserReqDTO.email,
            password: hashPassword,
            phoneNumber: createUserReqDTO.phoneNumber,
            status: UserStatus.INVITED,
            userRole: role
        });

        if (!createUser) throw new InternalServerErrorException({ message: "Internal Server Error while creating professor" });

        return {
            success: true,
            data: createUser,
            expired: false,
            message: "Professor created successfully.",
            statusCode: 201
        }
    }
}