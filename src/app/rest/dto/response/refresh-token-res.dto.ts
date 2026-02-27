import { ApiProperty } from "@nestjs/swagger";
import { APIResponse } from "../../../common/helper/response";
import { RefreshToken } from "../../../refresh-token/entities/refresh-token.entity";

export class RefreshTokenResDTO extends APIResponse {
    @ApiProperty({ type: () => RefreshToken })
    data: RefreshToken
}