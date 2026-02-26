import { Injectable, NotFoundException } from '@nestjs/common';
import { UserResDTO } from '../rest/dto/response/user-res.dto';
import { UserReaderService } from './user-reader.service';

@Injectable()
export class UserService {
    constructor(
        private readonly userReaderService: UserReaderService
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
}
