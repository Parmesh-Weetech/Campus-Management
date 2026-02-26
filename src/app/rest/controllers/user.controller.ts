import { Body, Controller, Post } from "@nestjs/common";
import { LogAround } from "src/app/common/logger/log-around";
import { CreateUserReqDTO } from "../dto/request/create-user-req.dto";
import { UserResDTO } from "../dto/response/user-res.dto";
import { UserService } from "../../user/user.service";
import { UserRole } from "src/app/user/types/user-role";
import { Role } from "src/app/auth/decorators/role.decorator";
import { AccessActionEnum } from "src/app/common/enums/access-action.enum";
import { AccessEntityEnum } from "src/app/common/enums/access-entitiy.enum";

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }
    
    @Post('create/professor')
    @Role(AccessEntityEnum.USER, AccessActionEnum.CREATE)
    @LogAround()
    async createProfessor(@Body() createUserReqDTO: CreateUserReqDTO): Promise<UserResDTO> {
        return await this.userService.createUser(createUserReqDTO, UserRole.PROFESSOR);
    }

    @Post('create/student')
    @Role(AccessEntityEnum.USER, AccessActionEnum.CREATE)
    @LogAround()
    async createStudent(@Body() createUserReqDTO: CreateUserReqDTO): Promise<UserResDTO> {
        return await this.userService.createUser(createUserReqDTO, UserRole.STUDENT);
    }
}