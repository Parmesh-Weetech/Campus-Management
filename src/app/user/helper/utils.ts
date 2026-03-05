import { ProfileAccessUser } from "../types/profile-access.types";
import { UserRole } from "../types/user-role";

export const canViewTargetProfile = (
    currentUser: ProfileAccessUser,
    targetUser: ProfileAccessUser
): boolean => {
    console.log("currentUser", currentUser.userRole, " ", "target", targetUser.userRole)

    if (currentUser.userRole === UserRole.ADMIN) {
        return true;
    }

    if (currentUser.userRole === UserRole.PROFESSOR) {
        return targetUser.userRole === UserRole.STUDENT;
    }

    return false;
};

export function generatePassword(): string {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+[]{}|;:,.<>?";

    const getRandomChar = (str: string) =>
        str[Math.floor(Math.random() * str.length)];

    // Ensure required characters
    const passwordChars = [
        getRandomChar(upper),
        getRandomChar(lower),
        getRandomChar(numbers),
        getRandomChar(special)
    ];

    // Fill remaining 4 characters randomly from all sets
    const allChars = upper + lower + numbers + special;
    for (let i = passwordChars.length; i < 8; i++) {
        passwordChars.push(getRandomChar(allChars));
    }

    // Shuffle the result
    return passwordChars
        .sort(() => Math.random() - 0.5)
        .join("");
}

export function generatePhoneNumber(): string {
    const firstDigit = Math.floor(Math.random() * 9) + 1; // 1–9
    let remainingDigits = "";

    for (let i = 0; i < 9; i++) {
        remainingDigits += Math.floor(Math.random() * 10); // 0–9
    }

    return firstDigit + remainingDigits;
}
