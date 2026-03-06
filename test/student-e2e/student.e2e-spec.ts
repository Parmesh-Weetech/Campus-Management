import { INestApplication } from "@nestjs/common"
import { defaultBeforeAll, setupAdminUser, setupProfessorUser, setupStudentUser } from "../utils/commonHooks";
import { mockProfessor, mockStudent } from "../utils/mock-data";
import request from 'supertest';
import { formatDateAsYYYYMMDD } from "../utils/formatted-date";
import { DataSource } from "typeorm";
import { RefreshToken } from "../../src/app/refresh-token/entities/refresh-token.entity";

describe('StudentController (e2e)', () => {
    let server;
    let app: INestApplication;
    let adminResponse: { token: string, id: string };
    let adminToken: string;
    let professorToken: string;
    let studentToken: string;
    let studentId: string;
    let professorMockData: { email: string, password: string };
    let studentMockData: { email: string, password: string };
    let date: string;
    let adminClassName: string;
    let professorClassName: string;

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

        // Get student mock data
        studentMockData = mockStudent();

        // Login Student
        studentToken = await setupStudentUser(app, studentMockData.email, studentMockData.password);
        const studentProfileResponse = await request(server)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(200);

        expect(studentProfileResponse.body).toEqual(
            expect.objectContaining({
                success: true,
                data: expect.any(Object)
            })
        );
        expect(studentProfileResponse.body.data).toHaveProperty('id');
        expect(studentProfileResponse.body.data).toHaveProperty('email');
        studentId = studentProfileResponse.body.data.id;

        date = formatDateAsYYYYMMDD(new Date());

        // Create attendance fixtures for this suite
        adminClassName = `Maths-${Date.now()}`;
        const adminCreateResponse = await request(server)
            .post(`/api/attendance/create/${studentId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                date,
                status: "PRESENT",
                className: adminClassName
            })
            .expect(201);

        expect(adminCreateResponse.body).toEqual(
            expect.objectContaining({
                success: true,
                data: expect.any(Object)
            })
        );
        expect(adminCreateResponse.body.data).toHaveProperty('id');
        adminEntryAttendanceId = adminCreateResponse.body.data.id;

        professorClassName = `Science-${Date.now()}`;
        const professorCreateResponse = await request(server)
            .post(`/api/attendance/create/${studentId}`)
            .set("Authorization", `Bearer ${professorToken}`)
            .send({
                date,
                status: "PRESENT",
                className: professorClassName
            })
            .expect(201);

        expect(professorCreateResponse.body).toEqual(
            expect.objectContaining({
                success: true,
                data: expect.any(Object)
            })
        );
        expect(professorCreateResponse.body.data).toHaveProperty('id');
        professorEntryAttendanceId = professorCreateResponse.body.data.id;
    });

    afterAll(async () => {
        const cleanupRequests: Array<Promise<unknown>> = [];

        if (adminEntryAttendanceId) {
            cleanupRequests.push(
                request(server)
                    .delete(`/api/attendance/${adminEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
            );
        }

        if (professorEntryAttendanceId) {
            cleanupRequests.push(
                request(server)
                    .delete(`/api/attendance/${professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
            );
        }

        if (cleanupRequests.length > 0) {
            await Promise.allSettled(cleanupRequests);
        }

        const dataSource = app.get(DataSource);
        await dataSource
            .createQueryBuilder()
            .delete()
            .from(RefreshToken)
            .execute();

        await app.close();
    });

    describe('Student Lifecycle', () => {
        describe('Attendance list according to filters', () => {
            it('Student should able to list all attendance of themselves', async () => {
                const response = await request(server)
                    .get('/api/student/attendance/list')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toEqual(
                    expect.objectContaining({
                        items: expect.any(Array),
                        total: expect.any(Number)
                    })
                );
                expect(response.body.data).toHaveProperty('total');
                expect(response.body.data).toHaveProperty('items');
                expect(response.body.data.items.length).toBeLessThanOrEqual(10);
                expect(Array.isArray(response.body.data.items)).toBe(true);
            });

            it('Student should able to list all attendance based on month and className', async () => {
                const response = await request(server)
                    .get('/api/student/attendance/list')
                    .query({
                        className: professorClassName,
                        month: date.slice(0, 7)
                    })
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toEqual(
                    expect.objectContaining({
                        items: expect.any(Array),
                        total: expect.any(Number)
                    })
                );
                expect(response.body.data).toHaveProperty('total');
                expect(response.body.data).toHaveProperty('items');
                expect(response.body.data.items.length).toBeLessThanOrEqual(10);
                expect(Array.isArray(response.body.data.items)).toBe(true);
            });

            it('Should give error if professor try to access it', async () => {
                await request(server)
                    .get('/api/student/attendance/list')
                    .set('Authorization', `Bearer ${professorToken}`)
                    .expect(403);
            });

            it('Should give error if admin try to access it', async () => {
                await request(server)
                    .get('/api/student/attendance/list')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(403)
            });

            it('Should give error if student try to access other student attendance', async () => {
                await request(server)
                    .get('/api/student/attendance/list')
                    .query({
                        studentId: 'd909c95c-87cd-4629-afbb-8d6f27b7e5a1'
                    })
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });
        });

        describe('Student attendance based on date and class', () => {
            it('Should give attendance based on date and admin className', async () => {
                const response = await request(server)
                    .get('/api/student/attendance')
                    .query({
                        date,
                        className: adminClassName
                    })
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data).toHaveProperty('id');
            });

            it('Should give attendance based on date and professor className', async () => {
                const response = await request(server)
                    .get('/api/student/attendance')
                    .query({
                        date,
                        className: professorClassName
                    })
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data).toHaveProperty('id');
            });

            it('Should give error if className is missing', async () => {
                await request(server)
                    .get('/api/student/attendance')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .query({
                        date
                    })
                    .expect(400);
            });

            it('Should give error if record not found', async () => {
                await request(server)
                    .get('/api/student/attendance')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .query({
                        date: "2026-05-05",
                        className: "Maths"
                    })
                    .expect(404)
            })
        })
    });
});
