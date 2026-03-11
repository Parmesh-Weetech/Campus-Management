import { ApiProperty } from "@nestjs/swagger";
import { APIResponse } from "../../../common/helper/response";

class AttendanceSummaryItemDTO {
    @ApiProperty() studentId: string;
    @ApiProperty() className: string;
    @ApiProperty() month: string;
    @ApiProperty() presentCount: number;
    @ApiProperty() absentCount: number;
    @ApiProperty() lateCount: number;
    @ApiProperty() totalCount: number;
}

class AttendanceSummaryDataDTO {
    @ApiProperty({ type: () => [AttendanceSummaryItemDTO] }) items: AttendanceSummaryItemDTO[];
    @ApiProperty() total: number;
    @ApiProperty() page: number;
    @ApiProperty() size: number;
    @ApiProperty() totalPages: number;
}

export class AttendanceSummaryResDTO extends APIResponse {
    @ApiProperty({ type: AttendanceSummaryDataDTO })
    data: AttendanceSummaryDataDTO;
}
