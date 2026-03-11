import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from "class-validator";

export class AttendanceSummaryReqDTO {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    @ApiPropertyOptional()
    page?: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    @ApiPropertyOptional()
    size?: number = 10;

    @IsOptional()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "month must be in YYYY-MM format" })
    @ApiPropertyOptional()
    month?: string;

    @IsOptional()
    @IsUUID()
    @ApiPropertyOptional()
    studentId?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional()
    className?: string;
}
