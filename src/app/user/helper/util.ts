import { ProfileAccessUser } from "../types/profile-access.types";
import { UserRole } from "../types/user-role";

declare global {
    interface EnvVar {
        PROFILE_PHOTO_FILE_PATH: string;
        PROFILE_THUMBNAIL_FILE_PATH: string;
    }
}

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
