import * as dotenv from "dotenv";
import * as path from "path";
import { randomUUID } from "crypto";
import { DataSource } from "typeorm";
import { generateHashPassword } from "../src/app/auth/helper/utils";
import { Attendance } from "../src/app/attendance/entities/attendance.entity";
import { AttendanceStatus } from "../src/app/attendance/types/attendance-status.types";
import { entities } from "../src/app/config/pg.config";
import { RefreshToken } from "../src/app/refresh-token/entities/refresh-token.entity";
import { User } from "../src/app/user/entities/user.entity";
import { UserRole } from "../src/app/user/types/user-role";
import { UserStatus } from "../src/app/user/types/user-status";
import { SeedUser } from "./type";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const TOTAL = 100000;
const BATCH_SIZE = 5000;
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "admin@demo";
const CLASS_NAMES = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "English",
    "History",
    "Economics",
];

const userStatusValues = Object.values(UserStatus);
const userRoleValues = Object.values(UserRole);
const attendanceStatusValues = Object.values(AttendanceStatus);

type UserRow = {
    id: string;
    userRole: UserRole;
};

const createDataSource = () =>
    new DataSource({
        type: "postgres",
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: Object.values(entities),
        synchronize: false,
        logging: false,
    });

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const pickByIndex = <T>(items: T[], index: number): T => items[index % items.length];

const createPhoneNumber = (seed: number) => {
    const value = (seed % 9000000000) + 1000000000;
    return String(value);
};

async function seedUsers(dataSource: DataSource) {
    const userCount = await dataSource.getRepository(entities.User).count();

    if (userCount >= TOTAL) {
        console.log(`Users already at ${userCount}, skipping.`);
        return;
    }

    const remaining = TOTAL - userCount;
    const hashedPassword = await generateHashPassword(DEFAULT_PASSWORD);
    const runSeedBase = Date.now() % 9000000000;

    console.log(`Seeding ${remaining} users...`);

    for (let offset = 0; offset < remaining; offset += BATCH_SIZE) {
        const batchSize = Math.min(BATCH_SIZE, remaining - offset);
        const users: SeedUser[] = [];

        for (let index = 0; index < batchSize; index++) {
            const sequence = userCount + offset + index;
            const uniqueSeed = runSeedBase + sequence;

            users.push({
                name: `Seed User ${sequence + 1}`,
                email: `seed.user.${uniqueSeed}@campus-access.local`,
                phoneNumber: createPhoneNumber(uniqueSeed),
                password: hashedPassword,
                status: pickByIndex(userStatusValues, sequence),
                userRole: pickByIndex(userRoleValues, sequence),
            });
        }

        await dataSource
            .createQueryBuilder()
            .insert()
            .into(User)
            .values(users)
            .execute();

        console.log(`Users inserted: ${userCount + offset + batchSize}/${TOTAL}`);
    }
}

async function getUsers(dataSource: DataSource): Promise<UserRow[]> {
    return dataSource
        .createQueryBuilder()
        .select('u.id', 'id')
        .addSelect('u.userRole', 'userRole')
        .from('user', 'u')
        .where('u.deletedAt IS NULL')
        .orderBy('u.createdAt', 'ASC')
        .getRawMany<UserRow>();
}

async function seedAttendance(dataSource: DataSource) {
    const attendanceCount = await dataSource.getRepository(entities.Attendance).count();

    if (attendanceCount >= TOTAL) {
        console.log(`Attendance already at ${attendanceCount}, skipping.`);
        return;
    }

    const users = await getUsers(dataSource);

    if (users.length === 0) {
        console.log("No users found; skipping attendance seeding.");
        return;
    }

    const students = users.filter((user) => user.userRole === UserRole.STUDENT);
    const recorders = users.filter(
        (user) => user.userRole === UserRole.ADMIN || user.userRole === UserRole.PROFESSOR,
    );

    const studentPool = students.length > 0 ? students : users;
    const recorderPool = recorders.length > 0 ? recorders : users;
    const remaining = TOTAL - attendanceCount;
    const baseDate = new Date("2025-01-01T00:00:00.000Z");

    console.log(`Seeding ${remaining} attendance records...`);

    for (let offset = 0; offset < remaining; offset += BATCH_SIZE) {
        const batchSize = Math.min(BATCH_SIZE, remaining - offset);
        const attendanceRows: Array<{
            date: string;
            status: AttendanceStatus;
            className: string;
            student: { id: string };
            recordedBy: { id: string };
        }> = [];

        for (let index = 0; index < batchSize; index++) {
            const sequence = attendanceCount + offset + index;
            const studentIndex = sequence % studentPool.length;
            const perStudentSequence = Math.floor(sequence / studentPool.length);
            const classIndex = perStudentSequence % CLASS_NAMES.length;
            const dayOffset = Math.floor(perStudentSequence / CLASS_NAMES.length);
            const recordedBy = recorderPool[(studentIndex + perStudentSequence) % recorderPool.length];

            attendanceRows.push({
                date: formatDate(new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000)),
                status: pickByIndex(attendanceStatusValues, sequence),
                className: CLASS_NAMES[classIndex],
                student: { id: studentPool[studentIndex].id },
                recordedBy: { id: recordedBy.id },
            });
        }

        await dataSource
            .createQueryBuilder()
            .insert()
            .into(Attendance)
            .values(attendanceRows)
            .execute();

        console.log(`Attendance inserted: ${attendanceCount + offset + batchSize}/${TOTAL}`);
    }
}

async function seedRefreshTokens(dataSource: DataSource) {
    const refreshTokenCount = await dataSource.getRepository(entities.RefreshToken).count();

    if (refreshTokenCount >= TOTAL) {
        console.log(`Refresh tokens already at ${refreshTokenCount}, skipping.`);
        return;
    }

    const users = await getUsers(dataSource);

    if (users.length === 0) {
        console.log("No users found; skipping refresh token seeding.");
        return;
    }

    const remaining = TOTAL - refreshTokenCount;

    console.log(`Seeding ${remaining} refresh tokens...`);

    for (let offset = 0; offset < remaining; offset += BATCH_SIZE) {
        const batchSize = Math.min(BATCH_SIZE, remaining - offset);
        const tokens: Array<{
            refreshToken: string;
            user: { id: string };
        }> = [];

        for (let index = 0; index < batchSize; index++) {
            const sequence = refreshTokenCount + offset + index;

            tokens.push({
                refreshToken: `seed-refresh-token-${randomUUID()}`,
                user: { id: users[sequence % users.length].id },
            });
        }

        await dataSource
            .createQueryBuilder()
            .insert()
            .into(RefreshToken)
            .values(tokens)
            .execute();

        console.log(`Refresh tokens inserted: ${refreshTokenCount + offset + batchSize}/${TOTAL}`);
    }
}

async function run() {
    const dataSource = createDataSource();

    await dataSource.initialize();
    console.log("PostgreSQL connected");

    try {
        await seedUsers(dataSource);
        await seedAttendance(dataSource);
        await seedRefreshTokens(dataSource);

        console.log("Bulk seeding completed");
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

run().catch((error) => {
    console.error("Bulk seeding failed", error);
    process.exit(1);
});
