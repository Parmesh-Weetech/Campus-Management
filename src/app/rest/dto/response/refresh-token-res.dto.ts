import { APIResponse } from "../../../common/helper/response";
import { RefreshToken } from "../../../refresh-token/entities/refresh-token.entity";

export class RefreshTokenResDTO extends APIResponse {
    data: RefreshToken
}