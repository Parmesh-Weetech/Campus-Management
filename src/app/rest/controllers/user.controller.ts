import { Body, Controller, Post } from "@nestjs/common";
import { LogAround } from "src/app/common/logger/log-around";
import { CreateUserReqDTO } from "../dto/request/create-user-req.dto";
import { UserResDTO } from "../dto/response/user-res.dto";
import { UserService } from "../../user/user.service";
import { UserRole } from "src/app/user/types/user-role";

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }
    
    @Post('create/professor')
    @LogAround()
    async createProfessor(@Body() createUserReqDTO: CreateUserReqDTO): Promise<UserResDTO> {
        return await this.userService.createUser(createUserReqDTO, UserRole.PROFESSOR);
    }

    @Post('create/student')
    @LogAround()
    async createStudent(@Body() createUserReqDTO: CreateUserReqDTO): Promise<UserResDTO> {
        return await this.userService.createUser(createUserReqDTO, UserRole.STUDENT);
    }
}