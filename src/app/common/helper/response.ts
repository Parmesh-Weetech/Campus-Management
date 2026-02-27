import { ApiProperty } from "@nestjs/swagger";

export class APIResponse {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    expired: boolean;

    @ApiProperty()
    statusCode: number;

    @ApiProperty()
    message: string;
}