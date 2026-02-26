import { APIResponse } from "../../../common/helper/response";

export class LoginResDTO extends APIResponse {
    data: {
        accessToken: string;
        refreshToken: string;
    }
}