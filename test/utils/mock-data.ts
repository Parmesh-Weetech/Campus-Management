import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

export function mockProfessor(): {
    email: string,
    password: string
} {
    return {
        email: "test-professor-user-76aec633-bf5c-44de-b332-078436e66e66@example.com",
        password: "P27m_09@b0"
    }
}

export function mockStudent(): {
    email: string,
    password: string
} {
    return {
        email: "test-student-user-1bb91ad2-5983-4c6a-841c-8ca218c47f3a@example.com",
        password: "P27m_09@b0"
    }
}