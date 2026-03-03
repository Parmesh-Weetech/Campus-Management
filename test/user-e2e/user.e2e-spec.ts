import { INestApplication } from "@nestjs/common"
import { defaultBeforeAll, setupAdminUser } from "../utils/commonHooks";
import { v4 as uuidv4 } from 'uuid';
import { generatePassword, generatePhoneNumber } from "../../src/app/user/helper/utils";
import request from 'supertest';
import { generateHashPassword } from "../../src/app/auth/helper/utils";
import { UserStatus } from "../../src/app/user/types/user-status";

describe("UserController (e2e)", () => {
    let app: INestApplication;
    let adminToken: string;
    let newUserEmail: string;
    let newUserEncryptedassword: string;
    let newUserName: string;
    let newUserPhoneNumber: string;
    let randomId = uuidv4();

    beforeAll(async () => {
        app = await defaultBeforeAll();

        adminToken = await setupAdminUser(app);

        newUserName = `testUser-${randomId}`;
        newUserEncryptedassword = await generateHashPassword(generatePassword());
    });

    describe("User Creation Lifecycle", () => {
        it('Admin user create new student user', async () => {
            newUserEmail = `testStudentUser-${randomId}@example.com`;
            newUserPhoneNumber = generatePhoneNumber();

            const response = await request(app.getHttpServer())
                .post('/api/user/create/student')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: newUserName,
                    email: newUserEmail,
                    password: newUserEncryptedassword,
                    phoneNumber: newUserPhoneNumber
                })
                .expect(201);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.email).toBe(newUserEmail);
            expect(response.body.data.status).toBe(UserStatus.ACTIVE);
        });

        it('Admin user create new student user', async () => {
            newUserEmail = `testProfessorUser-${randomId}@example.com`;
            newUserPhoneNumber = generatePhoneNumber();

            const response = await request(app.getHttpServer())
                .post('/api/user/create/professor')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: newUserName,
                    email: newUserEmail,
                    password: newUserEncryptedassword,
                    phoneNumber: newUserPhoneNumber
                })
                .expect(201)

            console.log(response.body.data);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.email).toBe(newUserEmail);
            expect(response.body.data.status).toBe(UserStatus.ACTIVE);
        });
    });
})