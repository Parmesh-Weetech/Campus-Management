import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from "class-validator";

export class ListAttendanceReqDTO {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    size?: number = 10;

    @IsOptional()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "month must be in YYYY-MM format" })
    month?: string;

    @IsOptional()
    @IsUUID()
    studentId?: string;

    @IsOptional()
    @IsString()
    className?: string;
}
