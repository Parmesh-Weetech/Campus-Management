import { INestApplication } from "@nestjs/common"
import request from 'supertest';
import { defaultBeforeAll, setupAdminUser, setupProfessorUser, setupStudentUser } from "../utils/commonHooks";
import { mockProfessor, mockStudent } from "../utils/mock-data";
import { formatDateAsYYYYMMDD } from "../utils/formatted-date";

describe('AttendanceController (e2e)', () => {
    let app: INestApplication;
    let adminResponse: { token: string, id: string };
    let adminToken: string;
    let professorToken: string;
    let professorId: string;
    let studentToken: string;
    let studentId: string;
    let professorMockData: { email: string, password: string, id: string }
    let studentMockData: { email: string, password: string, id: string }

    let date: string;
    let adminEntryAttendanceId: string;
    let professorEntryAttendanceId: string;

    beforeAll(async () => {
        app = await defaultBeforeAll();

        // Login Admin
        adminResponse = await setupAdminUser(app);
        adminToken = adminResponse.token;

        // Get professor mock data
        professorMockData = mockProfessor();
        professorId = professorMockData.id;

        // Login Professor
        professorToken = await setupProfessorUser(app, professorMockData.email, professorMockData.password);

        // Get student mock data
        studentMockData = mockStudent();
        studentId = studentMockData.id;

        // Login Student
        studentToken = await setupStudentUser(app, studentMockData.email, studentMockData.password);

        date = formatDateAsYYYYMMDD(new Date());
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Attendance Lifecycle', () => {
        describe('Create Attendance', () => {
            it('Admin should able to create attendance', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/api/attendance/create/${studentId}`)
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Drawing"
                    });
                expect(201);

                expect(response.body.data).toBeDefined();
                expect(response.body.success).toEqual(true);
                expect(response.body.data.id).toBeDefined();

                adminEntryAttendanceId = response.body.data.id;
            });

            it('Professor should able to create attendance', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/api/attendance/create/${studentId}`)
                    .set("Authorization", `Bearer ${professorToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    });

                expect(201);

                expect(response.body.data).toBeDefined();
                expect(response.body.success).toEqual(true);
                expect(response.body.data.id).toBeDefined();

                professorEntryAttendanceId = response.body.data.id;
            });

            it('Should give error on student create attendance', async () => {
                await request(app.getHttpServer())
                    .post(`/api/attendance/create/${studentId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    });

                expect(403);
            });

            it('Should give error if studentId is not of student', async () => {
                await request(app.getHttpServer())
                    .post(`/api/attendance/create/${professorId}`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    });

                expect(400);
            });

            it('Should give error on invalid token', async () => {
                await request(app.getHttpServer())
                    .post(`/api/attendance/create/${studentId}`)
                    .set('Authorization', `Bearer nottoken.for.thisrequest`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    });

                expect(401);
            });

            it('Should give error on no token provided', async () => {
                await request(app.getHttpServer())
                    .post(`/api/attendance/create/${studentId}`)
                    .set('Authorization', 'Bearer ')
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    });

                expect(401);
            });
        });

        describe('Update Attendance', () => {
            it('Admin should be able to update attendance', async () => {
                const response = await request(app.getHttpServer())
                    .patch(`/api/attendance/update/${adminEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: "ABSENT"
                    });

                expect(200);

                expect(response.body.data).toBeDefined();
                expect(response.body.success).toEqual(true);
                expect(response.body.data.id).toEqual(adminEntryAttendanceId);
            });

            it('Professor should be able to update attendance', async () => {
                const response = await request(app.getHttpServer())
                    .patch(`/api/attendance/update/${professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .send({
                        status: "ABSENT"
                    });

                expect(200);

                expect(response.body.data).toBeDefined();
                expect(response.body.success).toEqual(true);
                expect(response.body.data.id).toEqual(professorEntryAttendanceId);
            });

            it('Should give error on student update attendance', async () => {
                await request(app.getHttpServer())
                    .post(`/api/attendance/update/${professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    });

                expect(403);
            });

            it('Should give error on missing attendanceId', async () => {
                await request(app.getHttpServer())
                    .patch(`/api/attendance/update/`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .send({
                        className: "ABC"
                    });

                expect(400);
            });

            it('Should give error on empty payload', async () => {
                await request(app.getHttpServer())
                    .patch(`/api/attendance/update/${professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .send({})

                expect(400);
            });

            it('Should give error on duplicate entry', async () => {
                await request(app.getHttpServer())
                    .patch(`/api/attendance/update/${professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .send({
                        status: "PRESENT",
                        className: "Social Science",
                        date: "2026-03-05"
                    });

                expect(409);
            });
        });

        describe('List Attendance', () => {
            it('Admin should be able to list attendance based on filters', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/attendance/list')
                    .query({
                        page: 1,
                        size: 10,
                        studentId
                    })
                    .set('Authorization', `Bearer ${adminToken}`)

                expect(200)
                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data.items)).toBe(true);
            });

            it('Professor should be able to list attendance based on filters', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/attendance/list')
                    .query({
                        page: 1,
                        size: 10,
                        studentId,
                        className: "Social Science"
                    });

                expect(200)
                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data.items)).toBe(true);
            });

            it('Should give error on missing studentId', async () => {
                await request(app.getHttpServer())
                    .get('/api/attendance/list')
                    .query({
                        page: 1,
                        size: 10
                    });

                expect(400);
            });
        });

        describe('Get Attendance By Date and Class', () => {
            it('Admin should able to list attendance based on date and class', async () => {
                
            })
        });
    });
})