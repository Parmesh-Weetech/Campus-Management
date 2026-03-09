import { INestApplication } from "@nestjs/common";

export interface TestContext {
    app?: INestApplication,
    server?: any,
    adminToken?: string,
    professorToken?: string;
    studentToken?: string;

    adminId?: string;
    professorId?: string;
    studentId?: string;

    adminEmail?: string;
    adminPassword?: string;

    adminResponse?: { token: string, id: string };

    professorMockData?: { email: string, password: string };
    studentMockData?: { email: string, password: string };

    adminEntryAttendanceId?: string;
    professorEntryAttendanceId?: string;

    adminClassName?: string;
    professorClassName?: string;
}