import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { LogAround } from "../../common/logger/log-around";
import { CreateUserReqDTO } from "../dto/request/create-user-req.dto";
import { UserResDTO } from "../dto/response/user-res.dto";
import { UserService } from "../../user/user.service";
import { UserRole } from "../../user/types/user-role";
import { Role } from "../../auth/decorators/role.decorator";
import { GetCurrentUser } from "../../auth/decorators/currentUser.decorator";
import { User } from "../../user/entities/user.entity";

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }
    
    @Post('create/professor')
    @Role(UserRole.ADMIN)
    @LogAround()
    async createProfessor(@Body() createUserReqDTO: CreateUserReqDTO): Promise<UserResDTO> {
        return await this.userService.createUser(createUserReqDTO, UserRole.PROFESSOR);
    }

    @Post('create/student')
    @Role(UserRole.ADMIN)
    @LogAround()
    async createStudent(@Body() createUserReqDTO: CreateUserReqDTO): Promise<UserResDTO> {
        return await this.userService.createUser(createUserReqDTO, UserRole.STUDENT);
    }

    @Get('profile')
    @Role(UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT)
    @LogAround()
    async findProfileDetails(@GetCurrentUser() user: User): Promise<UserResDTO> {
        return await this.userService.findByIdOrThrow(user.id);
    }

    @Get('profile/:userId')
    @Role(UserRole.ADMIN, UserRole.PROFESSOR)
    @LogAround()
    async findUserProfileDetails(@Param("userId", ParseUUIDPipe) userId: string, @GetCurrentUser() user: User): Promise<UserResDTO> {
        return await this.userService.findUserProfileDetails(userId, user);
    }
}
