import { AttendanceStatus } from "../src/app/attendance/types/attendance-status.types";
import { UserRole } from "../src/app/user/types/user-role";
import { UserStatus } from "../src/app/user/types/user-status";

export type SeedBaseEntity = {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
};

export type SeedUser = SeedBaseEntity & {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    status: UserStatus;
    userRole: UserRole;
    profilePicture?: string;
    profilePictureThumbnail?: string;
};

export type SeedAttendance = SeedBaseEntity & {
    studentId: string;
    recordedById: string;
    date: string;
    status: AttendanceStatus;
    className: string;
};

export type SeedRefreshToken = SeedBaseEntity & {
    userId: string;
    refreshToken: string;
};
