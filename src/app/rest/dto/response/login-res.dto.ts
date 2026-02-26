import { APIResponse } from "../../../common/helper/response";

export class LoginResDTO extends APIResponse {
    data: {
        accessToken: string;
        accessTokenExpiresIn: number;
        refreshToken: string;
        refreshTokenExpiresIn: number;
    }
}