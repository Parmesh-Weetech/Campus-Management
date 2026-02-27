import { ProfileAccessUser } from "../types/profile-access.types";
import { UserRole } from "../types/user-role";

export const canViewTargetProfile = (
    currentUser: ProfileAccessUser,
    targetUser: ProfileAccessUser
): boolean => {
    if (currentUser.userRole === UserRole.ADMIN) {
        return true;
    }

    if (currentUser.userRole === UserRole.PROFESSOR) {
        return targetUser.userRole === UserRole.STUDENT;
    }

    if (currentUser.userRole === UserRole.STUDENT) {
        return currentUser.id === targetUser.id;
    }

    return false;
};
