import { INestApplication } from "@nestjs/common"
import { defaultBeforeAll, setupAdminUser, setupProfessorUser, setupStudentUser } from "../utils/commonHooks";
import { mockProfessor, mockStudent } from "test/utils/mock-data";

describe('AttendanceController (e2e)', () => {
    let app: INestApplication;
    let adminResponse: { token: string, id: string };
    let adminToken: string;
    let professorToken: string;
    let studentToken: string;
    let professorMockData: { email: string, password: string }
    let studentMockData: { email: string, password: string }

    beforeAll(async () => {
        app = await defaultBeforeAll();

        // Login Admin
        adminResponse = await setupAdminUser(app);
        adminToken = adminResponse.token;

        // Get professor mock data
        professorMockData = mockProfessor();

        // Login Professor
        professorToken = await setupProfessorUser(app, professorMockData.email, professorMockData.password);

        // Get student mock data
        studentMockData = mockStudent();

        // Login Student
        studentToken = await setupStudentUser(app, studentMockData.email, studentMockData.password);
    });

    afterAll(async () => {
        await app.close();
    });

    
})