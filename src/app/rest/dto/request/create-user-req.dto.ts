import { OmitType } from "@nestjs/swagger";
import { User } from "../../../user/entities/user.entity";

export class CreateUserReqDTO extends OmitType(User, [
    'id',
    'createdAt',
    'deletedAt',
    'updatedAt',
    'profilePicture',
    'profilePictureThumbnail',
    'status',
    'attendances',
    'tokens',
    'userRole'
]) { }