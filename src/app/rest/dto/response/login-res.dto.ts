import { APIResponse } from "src/app/common/helper";

export class LoginResDTO extends APIResponse {
    data: {
        accessToken: string;
        accessTokenExpiresIn: number;
        refreshToken: string;
        refreshTokenExpiresIn: number;
    }
}