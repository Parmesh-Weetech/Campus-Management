import { INestApplication } from "@nestjs/common"
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { defaultBeforeAll, setupAdminUser, setupProfessorUser, setupStudentUser } from "../utils/commonHooks";
import { generatePhoneNumber } from "../../src/app/user/helper/utils";
import { PROFILE_PHOTO_FILE_PATH, PROFILE_THUMBNAIL_FILE_PATH } from "../../src/app/user/helper/paths";
import request from 'supertest';
import { UserStatus } from "../../src/app/user/types/user-status";
import { UserRole } from "../../src/app/user/types/user-role";
import { DataSource } from "typeorm";
import { User } from "../../src/app/user/entities/user.entity";
import { RefreshToken } from "../../src/app/refresh-token/entities/refresh-token.entity";

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const ABS_PROFILE_PHOTO_DIR = path.resolve(PROJECT_ROOT, PROFILE_PHOTO_FILE_PATH);
const ABS_PROFILE_THUMBNAIL_DIR = path.resolve(PROJECT_ROOT, PROFILE_THUMBNAIL_FILE_PATH);

const normalizeStoredFilename = (value: string): string => {
    return path.basename(value.trim().replace(/^["']|["']$/g, ''));
};

const extractFilename = (response: { body: any; text: string }): string | undefined => {
    if (typeof response.body === 'string') {
        return normalizeStoredFilename(response.body);
    }

    if (response.body && typeof response.body === 'object') {
        const candidates = [
            response.body.fileKey,
            response.body.data,
            response.body.name,
            response.body.filename,
            response.text
        ];

        const firstString = candidates.find((val) => typeof val === 'string');
        if (typeof firstString === 'string' && firstString.length > 0) {
            return normalizeStoredFilename(firstString);
        }
        return undefined;
    }

    if (typeof response.text === 'string' && response.text.length > 0) {
        return normalizeStoredFilename(response.text);
    }

    return undefined;
};

const createTempImage = (tmpDir: string, filenamePrefix: string, content: string): string => {
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    const filePath = path.join(tmpDir, `${filenamePrefix}-${uuidv4()}.jpeg`);
    fs.writeFileSync(filePath, content);
    return filePath;
};

describe("UserController (e2e)", () => {
    let app: INestApplication;
    let adminResponse: { token: string, id: string };
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
    const tempFiles: string[] = [];
    const uploadedProfilePhotos: string[] = [];
    const uploadedProfileThumbnails: string[] = [];

    beforeAll(async () => {
        app = await defaultBeforeAll();

        // Login Admin and Getting Admin Token
        adminResponse = await setupAdminUser(app);
        adminToken = adminResponse.token;
        adminId = adminResponse.id;

        newUserName = `testProfessorUser-${randomId}`;
        newUserEmail = `test-professor-user-${randomId}@example.com`;
        newUserPassword = "P27m_09@b0";
        newUserPhoneNumber = generatePhoneNumber();

        // Create Professor
        const successResponseProfessor = await request(app.getHttpServer())
            .post('/api/user/create/professor')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(201)

        expect(successResponseProfessor.body.data).toBeDefined();
        expect(successResponseProfessor.body.data.id).toBeDefined();
        expect(successResponseProfessor.body.data.email).toBe(newUserEmail);
        expect(successResponseProfessor.body.data.status).toBe(UserStatus.ACTIVE);
        professorId = successResponseProfessor.body.data.id;

        // Should get error as invalid token
        await request(app.getHttpServer())
            .post('/api/user/create/professor')
            .set('Authorization', `Bearer randomestringwithnovalue`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(401);

        // Login Professor
        const professorLoginResponse = await setupProfessorUser(app, newUserEmail, newUserPassword);
        professorToken = professorLoginResponse

        newUserName = `testStudentUser-${randomId}`;
        newUserEmail = `test-student-user-${randomId}@example.com`;
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

        // Should get error as professor user cannot create user
        await request(app.getHttpServer())
            .post('/api/user/create/student')
            .set('Authorization', `Bearer ${professorToken}`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(403);

        // Should get error as token in invalid
        await request(app.getHttpServer())
            .post('/api/user/create/student')
            .set('Authorization', `Bearer invalidtokenwithnovalue`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(401);

        // 5️⃣ Login student
        const studentLogin = await setupStudentUser(app, newUserEmail, newUserPassword);

        studentToken = studentLogin;
    });

    afterAll(async () => {
        for (const filePath of tempFiles) {
            if (fs.existsSync(filePath)) {
                fs.rmSync(filePath, { force: true });
            }
        }

        for (const fileName of uploadedProfilePhotos) {
            const fullPath = path.join(ABS_PROFILE_PHOTO_DIR, fileName);
            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath, { force: true });
            }
        }

        for (const fileName of uploadedProfileThumbnails) {
            const fullPath = path.join(ABS_PROFILE_THUMBNAIL_DIR, fileName);
            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath, { force: true });
            }
        }

        // No API as don't want the soft-delete.
        const dataSource = app.get(DataSource);
        const userRepository = dataSource.getRepository(User);
        const userIdsToDelete: string[] = [studentId, professorId].filter((id): id is string => Boolean(id));

        if (userIdsToDelete.length > 0) {
            await userRepository.delete(userIdsToDelete);
        }

        await dataSource
            .createQueryBuilder()
            .delete()
            .from(RefreshToken)
            .execute();

        await app.close();
    });

    describe("User Profile Lifecycle", () => {
        it('Admin can access their own profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.userRole).toBe(UserRole.ADMIN);
            expect(response.body.data.email).toBeDefined();
        });

        it('Professor can access their own profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.userRole).toBe(UserRole.PROFESSOR);
            expect(response.body.data.email).toBeDefined();
        });

        it('Student can access their own profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.userRole).toBe(UserRole.STUDENT);
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
                .expect(200);

            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(professorId);
        });

        it('Admin can access student profile', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/user/profile/${studentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(studentId);
        });
    });

    describe("Professor can access student profile", () => {
        it('Professor can access student profile', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/user/profile/${studentId}`)
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(200);

            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(studentId);
        });
    });

    describe("Professor cannot access admin profile", () => {
        it('Professor cannot access admin profile', async () => {
            await request(app.getHttpServer())
                .get(`/api/user/profile/${adminId}`)
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(403);
        });
    });

    describe('Student cannot access admin or professor profile', () => {
        it('Student cannot access admin profile', async () => {
            await request(app.getHttpServer())
                .get(`/api/user/profile/${adminId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);
        });

        it('Student cannot access professor profile', async () => {
            await request(app.getHttpServer())
                .get(`/api/user/profile/${professorId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);
        });
    });

    describe('User can upload their profile-photo', () => {
        it('Should upload profile-photo for admin', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-admin', 'dummy-image-content-admin');
            tempFiles.push(filePath);

            const response = await request(app.getHttpServer())
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', filePath)
                .expect(200)

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfilePhotos.push(filename as string);
        });

        it('Should upload profile-photo for professor', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-professor', 'dummy-image-content-professor');
            tempFiles.push(filePath);

            const response = await request(app.getHttpServer())
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${professorToken}`)
                .attach('file', filePath)
                .expect(200)

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfilePhotos.push(filename as string);
        });

        it('Should upload profile-photo for student', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            const response = await request(app.getHttpServer())
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('file', filePath)
                .expect(200)

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfilePhotos.push(filename as string);
        });
    });

    describe('User can upload their thumbnail-photo', () => {
        it('Should upload thumbnail-photo for admin', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'thumbnail-photo');
            const filePath = createTempImage(tmpDir, 'test-admin', 'dummy-image-content-admin');
            tempFiles.push(filePath);

            const response = await request(app.getHttpServer())
                .post(`/api/user/upload/profile-thumbnail`)
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', filePath)
                .expect(200)

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfileThumbnails.push(filename as string);
        });

        it('Should upload thumbnail-photo for professor', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'thumbnail-photo');
            const filePath = createTempImage(tmpDir, 'test-professor', 'dummy-image-content-professor');
            tempFiles.push(filePath);

            const response = await request(app.getHttpServer())
                .post(`/api/user/upload/profile-thumbnail`)
                .set('Authorization', `Bearer ${professorToken}`)
                .attach('file', filePath)
                .expect(200)

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfileThumbnails.push(filename as string);
        });

        it('Should upload thumbnail-photo for student', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'thumbnail-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            const response = await request(app.getHttpServer())
                .post(`/api/user/upload/profile-thumbnail`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('file', filePath)
                .expect(200)

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfileThumbnails.push(filename as string);
        });
    })
})
