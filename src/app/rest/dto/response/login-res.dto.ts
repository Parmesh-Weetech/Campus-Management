import { ApiProperty } from "@nestjs/swagger";
import { APIResponse } from "../../../common/helper/response";

class LoginDataDTO {
    @ApiProperty() accessToken: string;
    @ApiProperty() refreshToken: string;
}

export class LoginResDTO extends APIResponse {
    @ApiProperty({ type: LoginDataDTO })
    data: LoginDataDTO;

}