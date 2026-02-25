import { User } from "../../../user/entities/user.entity";
import { APIResponse } from "../../../common/helper/response";

export class UserResDTO extends APIResponse {
    data: User
}