import { INestApplication } from "@nestjs/common"
import { defaultBeforeAll, setupAdminUser, setupProfessorUser, setupStudentUser } from "../utils/commonHooks";
import { mockProfessor, mockStudent } from "../utils/mock-data";
import request from 'supertest';
import { formatDateAsYYYYMMDD } from "../utils/formatted-date";

describe('StudentController (e2e)', () => {
    let server;
    let app: INestApplication;
    let adminResponse: { token: string, id: string };
    let adminToken: string;
    let professorToken: string;
    let studentToken: string;
    let professorMockData: { email: string, password: string, id: string };
    let studentMockData: { email: string, password: string, id: string };
    let date: string;

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

        date = formatDateAsYYYYMMDD(new Date());
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Student Lifecycle', () => {
        describe('Attendance list according to filters', () => {
            it('Student should able to list all attendance of themselves', async () => {
                const response = await request(server)
                    .get('/api/student/attendance/list')
                    .query({
                        page: 1,
                        size: 10
                    })
                    .set('Authorization', `Bearer ${studentToken}`)
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

            it('Student should able to list all attendance based on month and className', async () => {
                const response = await request(server)
                    .get('/api/student/attendance/list')
                    .query({
                        page: 1,
                        size: 10,
                        className: 'Social Science',
                        month: '2026-03'
                    })
                    .set('Authorization', `Bearer ${studentToken}`)
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

            it('Should give error if professor try to access it', async () => {
                await request(server)
                    .get('api/user/attendance/list')
                    .query({
                        page: 1,
                        size: 10,
                    })
                    .set('Authorization', `Bearer ${professorToken}`)
                    .expect(403)
            });

            it('Should give error if admin try to access it', async () => {
                await request(server)
                    .get('api/user/attendance/list')
                    .query({
                        page: 1,
                        size: 10,
                    })
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(403)
            });

            it('Should give error if student try to access other student attendance', async () => {
                await request(server)
                    .get('/api/user/attendance/list')
                    .query({
                        page: 1,
                        size: 10,
                        studentId: 'd909c95c-87cd-4629-afbb-8d6f27b7e5a1'
                    })
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403)
            });
        });

        describe('Student attendance based on date and class', () => {
            it('Should give attendance based on date and className', async () => {
                const response = await request(server)
                    .get('/api/user/attendance')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .query({
                        date,
                        className: 'Social Science'
                    })
                    .expect(200)

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
            });

            it('Should give error if className or date is missing', async () => {
                await request(server)
                    .get('/api/user/attendance')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .query({
                        date
                    })
                    .expect(400)
            });


        })
    });
});