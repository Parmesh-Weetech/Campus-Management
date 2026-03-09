import { defaultBeforeAll, setupAdminUser, setupProfessorUser, setupStudentUser } from "../utils/commonHooks";
import { mockProfessor, mockStudent } from "../utils/mock-data";
import request from 'supertest';
import { formatDateAsYYYYMMDD } from "../utils/formatted-date";
import { DataSource } from "typeorm";
import { Attendance } from "../../src/app/attendance/entities/attendance.entity";
import { RefreshToken } from "../../src/app/refresh-token/entities/refresh-token.entity";
import { User } from "../../src/app/user/entities/user.entity";
import { TestContext } from "../utils/test-context";

describe('StudentController (e2e)', () => {
    const ctx: TestContext = {};
    let date: string;

    beforeAll(async () => {
        ctx.app = await defaultBeforeAll();
        ctx.server = ctx.app.getHttpServer();

        // Login Admin
        ctx.adminResponse = await setupAdminUser(ctx.app!);
        ctx.adminToken = ctx.adminResponse.token;

        // Get professor mock data
        ctx.professorMockData = mockProfessor();

        // Login Professor
        ctx.professorToken = await setupProfessorUser(ctx.app!, ctx.professorMockData.email, ctx.professorMockData.password);
        const professorProfileResponse = await request(ctx.server)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${ctx.professorToken}`)
            .expect(200);
        expect(professorProfileResponse.body.data).toHaveProperty('id');
        ctx.professorId = professorProfileResponse.body.data.id;

        // Get student mock data
        ctx.studentMockData = mockStudent();

        // Login Student
        ctx.studentToken = await setupStudentUser(ctx.app!, ctx.studentMockData.email, ctx.studentMockData.password);
        const studentProfileResponse = await request(ctx.server)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${ctx.studentToken}`)
            .expect(200);

        expect(studentProfileResponse.body).toEqual(
            expect.objectContaining({
                success: true,
                data: expect.any(Object)
            })
        );
        expect(studentProfileResponse.body.data).toHaveProperty('id');
        expect(studentProfileResponse.body.data).toHaveProperty('email');
        ctx.studentId = studentProfileResponse.body.data.id;

        date = formatDateAsYYYYMMDD(new Date());

        // Create attendance fixtures for this suite
        ctx.adminClassName = `Maths-${Date.now()}`;
        const adminCreateResponse = await request(ctx.server)
            .post(`/api/attendance/create/${ctx.studentId}`)
            .set("Authorization", `Bearer ${ctx.adminToken}`)
            .send({
                date,
                status: "PRESENT",
                className: ctx.adminClassName
            })
            .expect(201);

        expect(adminCreateResponse.body).toEqual(
            expect.objectContaining({
                success: true,
                data: expect.any(Object)
            })
        );
        expect(adminCreateResponse.body.data).toHaveProperty('id');
        ctx.adminEntryAttendanceId = adminCreateResponse.body.data.id;

        ctx.professorClassName = `Science-${Date.now()}`;
        const professorCreateResponse = await request(ctx.server)
            .post(`/api/attendance/create/${ctx.studentId}`)
            .set("Authorization", `Bearer ${ctx.professorToken}`)
            .send({
                date,
                status: "PRESENT",
                className: ctx.professorClassName
            })
            .expect(201);

        expect(professorCreateResponse.body).toEqual(
            expect.objectContaining({
                success: true,
                data: expect.any(Object)
            })
        );
        expect(professorCreateResponse.body.data).toHaveProperty('id');
        ctx.professorEntryAttendanceId = professorCreateResponse.body.data.id;
    });

    afterAll(async () => {
        const dataSource = ctx.app!.get(DataSource);
        const attendanceRepository = dataSource.getRepository(Attendance);
        const userRepository = dataSource.getRepository(User);
        const attendanceIdsToDelete: string[] = [ctx.adminEntryAttendanceId, ctx.professorEntryAttendanceId]
            .filter((id): id is string => Boolean(id));

        if (attendanceIdsToDelete.length > 0) {
            await attendanceRepository.delete(attendanceIdsToDelete);
        }

        await dataSource
            .createQueryBuilder()
            .delete()
            .from(RefreshToken)
            .execute();

        const userIdsToDelete: string[] = [ctx.studentId, ctx.professorId].filter((id): id is string => Boolean(id));
        if (userIdsToDelete.length > 0) {
            await userRepository.delete(userIdsToDelete);
        }

        const testEmails = [ctx.studentMockData?.email, ctx.professorMockData?.email].filter(
            (email): email is string => Boolean(email)
        );
        if (testEmails.length > 0) {
            await userRepository
                .createQueryBuilder()
                .delete()
                .where('email IN (:...emails)', { emails: testEmails })
                .execute();
        }

        await ctx.app!.close();
    });

    describe('Student Lifecycle', () => {
        describe('Attendance list according to filters', () => {
            it('Student should able to list all attendance of themselves', async () => {
                const response = await request(ctx.server)
                    .get('/api/student/attendance/list')
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
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
                const response = await request(ctx.server)
                    .get('/api/student/attendance/list')
                    .query({
                        className: ctx.professorClassName,
                        month: date.slice(0, 7)
                    })
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
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
                await request(ctx.server)
                    .get('/api/student/attendance/list')
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .expect(403);
            });

            it('Should give error if admin try to access it', async () => {
                await request(ctx.server)
                    .get('/api/student/attendance/list')
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .expect(403)
            });

            it('Should give error if student try to access other student attendance', async () => {
                await request(ctx.server)
                    .get('/api/student/attendance/list')
                    .query({
                        studentId: 'd909c95c-87cd-4629-afbb-8d6f27b7e5a1'
                    })
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .expect(403);
            });

            it('Should give error on invalid month format', async () => {
                await request(ctx.server)
                    .get('/api/student/attendance/list')
                    .query({
                        month: '2026/03'
                    })
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .expect(400);
            });

            it('Should give error on invalid token', async () => {
                await request(ctx.server)
                    .get('/api/student/attendance/list')
                    .set('Authorization', 'Bearer invalid.token.value')
                    .expect(401);
            });

            it('Should give error on no token provided', async () => {
                await request(ctx.server)
                    .get('/api/student/attendance/list')
                    .expect(401);
            });
        });

        describe('Student attendance based on date and class', () => {
            it('Should give attendance based on date and admin className', async () => {
                const response = await request(ctx.server)
                    .get('/api/student/attendance')
                    .query({
                        date,
                        className: ctx.adminClassName
                    })
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
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
                const response = await request(ctx.server)
                    .get('/api/student/attendance')
                    .query({
                        date,
                        className: ctx.professorClassName
                    })
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data).toHaveProperty('id');
            });

            it('Should use today date when date is omitted', async () => {
                const response = await request(ctx.server)
                    .get('/api/student/attendance')
                    .query({
                        className: ctx.professorClassName
                    })
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
            });

            it('Should give error if className is missing', async () => {
                await request(ctx.server)
                    .get('/api/student/attendance')
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .query({
                        date
                    })
                    .expect(400);
            });

            it('Should give error if record not found', async () => {
                await request(ctx.server)
                    .get('/api/student/attendance')
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .query({
                        date: "2026-05-05",
                        className: "Maths"
                    })
                    .expect(404)
            });

            it('Should give error if date is invalid', async () => {
                await request(ctx.server)
                    .get('/api/student/attendance')
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .query({
                        date: '2026/05/01',
                        className: ctx.professorClassName
                    })
                    .expect(400);
            });

            it('Should give error on invalid token', async () => {
                await request(ctx.server)
                    .get('/api/student/attendance')
                    .query({
                        date,
                        className: ctx.professorClassName
                    })
                    .set('Authorization', 'Bearer invalid.token.value')
                    .expect(401);
            });

            it('Should give error on no token provided', async () => {
                await request(ctx.server)
                    .get('/api/student/attendance')
                    .query({
                        date,
                        className: ctx.professorClassName
                    })
                    .expect(401);
            });
        })
    });
});
