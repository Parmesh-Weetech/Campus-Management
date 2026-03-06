import { INestApplication } from "@nestjs/common"
import request from 'supertest';
import { defaultBeforeAll, setupAdminUser, setupProfessorUser, setupStudentUser } from "../utils/commonHooks";
import { mockProfessor, mockStudent } from "../utils/mock-data";
import { formatDateAsYYYYMMDD } from "../utils/formatted-date";

describe('AttendanceController (e2e)', () => {
    let server;
    let app: INestApplication;
    let adminResponse: { token: string, id: string };
    let adminToken: string;
    let professorToken: string;
    let professorId: string;
    let studentToken: string;
    let studentId: string;
    let professorMockData: { email: string, password: string }
    let studentMockData: { email: string, password: string }

    let date: string;
    let adminEntryAttendanceId: string;
    let professorEntryAttendanceId: string;

    beforeAll(async () => {
        app = await defaultBeforeAll();
        server = app.getHttpServer();

        // Login Admin
        adminResponse = await setupAdminUser(app);
        adminToken = adminResponse.token;

        // Get professor mock data
        professorMockData = mockProfessor();

        // Login Professor
        professorToken = await setupProfessorUser(app, professorMockData.email, professorMockData.password);
        const professorProfileResponse = await request(server)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${professorToken}`)
            .expect(200);
        professorId = professorProfileResponse.body.data.id;

        // Get student mock data
        studentMockData = mockStudent();

        // Login Student
        studentToken = await setupStudentUser(app, studentMockData.email, studentMockData.password);
        const studentProfileResponse = await request(server)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(200);
        studentId = studentProfileResponse.body.data.id;

        date = formatDateAsYYYYMMDD(new Date());
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Attendance Lifecycle', () => {
        describe('Create Attendance', () => {
            it('Admin should able to create attendance', async () => {
                const response = await request(server)
                    .post(`/api/attendance/create/${studentId}`)
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Drawing"
                    })
                    .expect(201);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data.id).toBeDefined();

                adminEntryAttendanceId = response.body.data.id;
            });

            it('Professor should able to create attendance', async () => {
                const response = await request(server)
                    .post(`/api/attendance/create/${studentId}`)
                    .set("Authorization", `Bearer ${professorToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    })
                    .expect(201);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data.id).toBeDefined();

                professorEntryAttendanceId = response.body.data.id;
            });

            it('Should give error on student create attendance', async () => {
                await request(server)
                    .post(`/api/attendance/create/${studentId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    })
                    .expect(403);
            });

            it('Should give error if studentId is not of student', async () => {
                await request(server)
                    .post(`/api/attendance/create/${professorId}`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    })
                    .expect(400);
            });

            it('Should give error on invalid token', async () => {
                await request(server)
                    .post(`/api/attendance/create/${studentId}`)
                    .set('Authorization', `Bearer nottoken.for.thisrequest`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    })
                    .expect(401);
            });

            it('Should give error on no token provided', async () => {
                await request(server)
                    .post(`/api/attendance/create/${studentId}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    })
                    .expect(401);
            });

            it('Should give error on invalid studentId', async () => {
                await request(server)
                    .post(`/api/attendance/create/not-a-uuid`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Math"
                    })
                    .expect(400);
            });
        });

        describe('Update Attendance', () => {
            it('Admin should be able to update attendance', async () => {
                const response = await request(server)
                    .patch(`/api/attendance/update/${adminEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: "ABSENT"
                    })
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data.id).toEqual(adminEntryAttendanceId);
            });

            it('Professor should be able to update attendance', async () => {
                const response = await request(server)
                    .patch(`/api/attendance/update/${professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .send({
                        status: "ABSENT"
                    })
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data.id).toEqual(professorEntryAttendanceId);
            });

            it('Should give error on student update attendance', async () => {
                await request(server)
                    .patch(`/api/attendance/update/${professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Social Science"
                    })
                    .expect(403);
            });

            it('Should give error on missing attendanceId', async () => {
                await request(server)
                    .patch(`/api/attendance/update/`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .send({
                        className: "ABC"
                    })
                    .expect(404);
            });

            it('Should give error on invalid studentId', async () => {
                await request(server)
                    .patch(`/api/attendance/update/not-a-uuid`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Math"
                    })
                    .expect(400);
            });

            it('Should give error on empty payload', async () => {
                await request(server)
                    .patch(`/api/attendance/update/${professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .send({})
                    .expect(400);
            });
        });

        describe('List Attendance', () => {
            it('Admin should be able to list attendance based on filters', async () => {
                const response = await request(server)
                    .get('/api/attendance/list')
                    .query({
                        studentId
                    })
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.data).toEqual(
                    expect.objectContaining({
                        items: expect.any(Array),
                        total: expect.any(Number)
                    })
                );
                expect(response.body.data.items.length).toBeLessThanOrEqual(10);
                expect(Array.isArray(response.body.data.items)).toBe(true);
            });

            it('Professor should be able to list attendance based on filters', async () => {
                const response = await request(server)
                    .get('/api/attendance/list')
                    .query({
                        studentId,
                        className: "Social Science"
                    })
                    .set('Authorization', `Bearer ${professorToken}`)
                    .expect(200);

                expect(response.body.data).toEqual(
                    expect.objectContaining({
                        items: expect.any(Array),
                        total: expect.any(Number)
                    })
                );
                expect(response.body.data.items.length).toBeLessThanOrEqual(10);
                expect(Array.isArray(response.body.data.items)).toBe(true);
            });

            it('Should filter attendance by month', async () => {
                const response = await request(server)
                    .get('/api/attendance/list')
                    .query({
                        studentId,
                        month: date.slice(0, 7)
                    })
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.data).toEqual(
                    expect.objectContaining({
                        items: expect.any(Array),
                        total: expect.any(Number)
                    })
                );
                expect(response.body.data.items.length).toBeLessThanOrEqual(10);
                expect(Array.isArray(response.body.data.items)).toBe(true);
            });

            it('Should give error if student try to access it', async () => {
                await request(server)
                    .get('/api/attendance/list')
                    .query({
                        studentId
                    })
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });

            it('Should give error on missing studentId', async () => {
                await request(server)
                    .get('/api/attendance/list')
                    .set('Authorization', `Bearer ${professorToken}`)
                    .expect(400);
            });
        });

        describe('Get Attendance By Date and Class', () => {
            it('Admin should able to list attendance based on date and class', async () => {
                const response = await request(server)
                    .get(`/api/attendance/${studentId}`)
                    .query({
                        date,
                        className: "Social Science"
                    })
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
            });

            it('Professor should able to list attendance based on date and class', async () => {
                const response = await request(server)
                    .get(`/api/attendance/${studentId}`)
                    .query({
                        date,
                        className: "Social Science"
                    })
                    .set('Authorization', `Bearer ${professorToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
            });

            it('Should give error on student access it', async () => {
                await request(server)
                    .get(`/api/attendance/${studentId}`)
                    .query({
                        date,
                        className: "Social Science"
                    })
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });

            it('Should give error on missing className', async () => {
                await request(server)
                    .get(`/api/attendance/${studentId}`)
                    .query({
                        date
                    })
                    .set('Authorization', `Bearer ${professorToken}`)
                    .expect(400);
            });
        });

        describe('Delete Attendance', () => {
            it('Admin should able to delete attendance', async () => {
                const response = await request(server)
                    .delete(`/api/attendance/${adminEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.success).toEqual(true);
            });

            it('Professor should able to delete attendance', async () => {
                const response = await request(server)
                    .delete(`/api/attendance/${professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .expect(200);

                expect(response.body.success).toEqual(true);
            });

            it('Should give error on student try to delete it', async () => {
                await request(server)
                    .delete(`/api/attendance/${professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });

            it('Should give error on missing attendanceId', async () => {
                await request(server)
                    .delete(`/api/attendance/`)
                    .set('Authorization', `Bearer ${professorToken}`)
                    .expect(404);
            });
        })
    });
})
