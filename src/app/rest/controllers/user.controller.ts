import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { LogAround } from "../../common/logger/log-around";
import { CreateUserReqDTO } from "../dto/request/create-user-req.dto";
import { UserResDTO } from "../dto/response/user-res.dto";
import { UserService } from "../../user/user.service";
import { UserRole } from "../../user/types/user-role";
import { Role } from "../../auth/decorators/role.decorator";
import { GetCurrentUser } from "../../auth/decorators/currentUser.decorator";
import { User } from "../../user/entities/user.entity";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from 'path';
import { PROFILE_PHOTO_FILE_PATH, PROFILE_THUMBNAIL_FILE_PATH } from "../../user/helper/paths";
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AllowedMimeType } from "../../user/enum/image-type.enum";
import { CustomExceptionFactory } from "../../common/exception/custom-exception.factory";
import { ErrorCode } from "../../common/exception/error-code";

@Controller({ path: 'user' })
@ApiTags('user')
@ApiBearerAuth()
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Post('create/professor')
    @Role(UserRole.ADMIN)
    @LogAround()
    @ApiResponse({ status: 201, type: UserResDTO })
    async createProfessor(@Body() createUserReqDTO: CreateUserReqDTO): Promise<UserResDTO> {
        return await this.userService.createUser(createUserReqDTO, UserRole.PROFESSOR);
    }

    @Post('create/student')
    @Role(UserRole.ADMIN)
    @LogAround()
    @ApiResponse({ status: 201, type: UserResDTO })
    async createStudent(@Body() createUserReqDTO: CreateUserReqDTO): Promise<UserResDTO> {
        return await this.userService.createUser(createUserReqDTO, UserRole.STUDENT);
    }

    @Get('profile')
    @Role(UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT)
    @LogAround()
    @ApiResponse({ status: 200, type: UserResDTO })
    async findProfileDetails(@GetCurrentUser() user: User): Promise<UserResDTO> {
        return await this.userService.findByIdOrThrow(user.id);
    }

    @Get('profile/:userId')
    @Role(UserRole.ADMIN, UserRole.PROFESSOR)
    @LogAround()
    @ApiResponse({ status: 200, type: UserResDTO })
    @ApiParam({ name: 'userId', type: String })
    async findUserProfileDetails(@Param("userId", ParseUUIDPipe) userId: string, @GetCurrentUser() user: User): Promise<UserResDTO> {
        return await this.userService.findUserProfileDetails(userId, user);
    }

    @Post('upload/profile-photo')
    @HttpCode(HttpStatus.OK)
    @Role(UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: path.resolve(PROFILE_PHOTO_FILE_PATH),
            filename: (req, file, cb) => {
                if (file.mimetype !== AllowedMimeType.JPEG && file.mimetype !== AllowedMimeType.PNG) {
                    throw CustomExceptionFactory.create(ErrorCode.BAD_REQUEST, 'Invalid file type');
                }

                const loggedInUser = (req as { user?: User }).user;
                const normalizedName = (loggedInUser?.name ?? 'user')
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                const fileExtension = path.extname(file.originalname).toLowerCase();
                cb(null, `${normalizedName || 'user'}-${Date.now()}${fileExtension}`);
            }
        }),
    }))
    @LogAround()
    @ApiResponse({
        status: 200, schema: {
            type: 'string'
        }
    })
    async uploadProfilePhoto(
        @UploadedFile() file: Express.Multer.File,
        @GetCurrentUser() user: User
    ): Promise<string> {
        return await this.userService.uploadProfilePhoto(file, user);
    }

    @Post('upload/profile-thumbnail')
    @HttpCode(HttpStatus.OK)
    @Role(UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: path.resolve(PROFILE_THUMBNAIL_FILE_PATH),
            filename: (req, file, cb) => {
                if (file.mimetype !== AllowedMimeType.JPEG && file.mimetype !== AllowedMimeType.PNG) {
                    throw CustomExceptionFactory.create(ErrorCode.BAD_REQUEST, 'Invalid file type');
                }

                const loggedInUser = (req as { user?: User }).user;
                const normalizedName = (loggedInUser?.name ?? 'user')
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                const fileExtension = path.extname(file.originalname).toLowerCase();
                cb(null, `${normalizedName || 'user'}-${Date.now()}${fileExtension}`);
            }
        }),
    }))
    @LogAround()
    @ApiResponse({
        status: 200, schema: {
            type: 'string'
        }
    })
    async uploadProfileThumbnail(
        @UploadedFile() file: Express.Multer.File,
        @GetCurrentUser() user: User
    ): Promise<string> {
        return await this.userService.uploadProfileThumbnail(file, user);
    }
}
