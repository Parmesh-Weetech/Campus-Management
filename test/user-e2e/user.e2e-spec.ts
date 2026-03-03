import { INestApplication } from "@nestjs/common"
import { defaultBeforeAll, setupAdminUser } from "../utils/commonHooks";
import { v4 as uuidv4 } from 'uuid';
import { generatePassword, generatePhoneNumber } from "../../src/app/user/helper/utils";
import request from 'supertest';
import { UserStatus } from "../../src/app/user/types/user-status";
import { UserRole } from "../../src/app/user/types/user-role";

describe("UserController (e2e)", () => {
    let app: INestApplication;
    let adminResponse: { token: string, id: string }
    let adminToken: string;
    let professorToken: string;
    let studentToken: string;
    let adminId: string;
    let professorId: string;
    let studentId: string;
    let newUserEmail: string;
    let newUserPassword: string;
    let newUserName: string;
    let newUserPhoneNumber: string;
    let randomId = uuidv4();

    beforeAll(async () => {
        app = await defaultBeforeAll();

        // Login Admin and Getting Admin Token
        adminResponse = await setupAdminUser(app);
        adminToken = adminResponse.token;
        adminId = adminResponse.id;

        newUserName = `testProfessorUser-${randomId}`;
        newUserEmail = `testProfessorUser-${randomId}@example.com`;
        newUserPassword = generatePassword();
        newUserPhoneNumber = generatePhoneNumber();

        // Create Professor
        const responseProfessor = await request(app.getHttpServer())
            .post('/api/user/create/professor')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(201)

        expect(responseProfessor.body.data).toBeDefined();
        expect(responseProfessor.body.data.id).toBeDefined();
        expect(responseProfessor.body.data.email).toBe(newUserEmail);
        expect(responseProfessor.body.data.status).toBe(UserStatus.ACTIVE);
        professorId = responseProfessor.body.data.id;

        // Login Professor
        const professorLogin = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({
                email: newUserEmail,
                password: newUserPassword
            })
            .expect(201);

        professorToken = professorLogin.body.data.accessToken;

        newUserName = `testStudentUser-${randomId}`;
        newUserEmail = `testStudentUser-${randomId}@example.com`;
        newUserPassword = generatePassword();
        newUserPhoneNumber = generatePhoneNumber();

        // Create Student
        const responseStudent = await request(app.getHttpServer())
            .post('/api/user/create/student')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(201);

        expect(responseStudent.body.data).toBeDefined();
        expect(responseStudent.body.data.id).toBeDefined();
        expect(responseStudent.body.data.email).toBe(newUserEmail);
        expect(responseStudent.body.data.status).toBe(UserStatus.ACTIVE);
        studentId = responseStudent.body.data.id;

        // 5️⃣ Login student
        const studentLogin = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({
                email: newUserEmail,
                password: newUserPassword
            })
            .expect(201);

        studentToken = studentLogin.body.data.accessToken;
    });

    describe("User Profile Lifecycle GET /api/user/profile", () => {
        it('Admin can access profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.role).toBe(UserRole.ADMIN);
            expect(response.body.data.email).toBeDefined();
        });

        it('Professor can access profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.role).toBe(UserRole.PROFESSOR);
            expect(response.body.data.email).toBeDefined();
        });

        it('Student can access profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.role).toBe(UserRole.STUDENT);
            expect(response.body.data.email).toBeDefined();
        });

        it('Should return 401 if no token provided', async () => {
            await request(app.getHttpServer())
                .get('/api/user/profile')
                .expect(401);
        });

        it('Should return 401 for invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', 'Bearer invalidtoken')
                .expect(401);
        });
    });

    describe("Admin can access Professor and Student both profile", () => {
        it('Admin can access professor profile', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/user/profile/${professorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)

            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(professorId);
        });

        it('Admin can access student profile', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/user/profile/${studentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)

            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(studentId);
        });
    });

    describe("Professor can access student profile", () => {
        it('Admin can access student profile', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/user/profile/${studentId}`)
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(200)

            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(studentId);
        });
    });

    describe("Professor cannot access admin profile", () => {
        it('Professor cannot access admin profile', async () => {
            await request(app.getHttpServer())
                .get(`/api/user/profile/${adminId}`)
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(403)
        });
    });
})