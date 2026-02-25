import { UserRole } from "../../user/types/user-role";

export type PayLoadType = {
    userId: string;
    email: string;
    userRole: UserRole.ADMIN | UserRole.STUDENT | UserRole.PROFESSOR
}