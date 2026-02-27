import { User } from "../../../user/entities/user.entity";
import { APIResponse } from "../../../common/helper/response";
import { ApiProperty } from "@nestjs/swagger";

export class UserResDTO extends APIResponse {
    @ApiProperty({ type: () => User })
    data: User
}