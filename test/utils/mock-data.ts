import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

export function mockProfessor(): {
    email: string,
    password: string,
    id: string
} {
    return {
        email: "test-professor-user-35795d70-ef95-44c0-a1f7-b78a652b652d@example.com",
        password: "P27m_09@b0",
        id: '2655a7ab-d040-47df-8af6-349d4b070307'
    }
}

export function mockStudent(): {
    email: string,
    password: string,
    id: string
} {
    return {
        email: "test-student-user-35795d70-ef95-44c0-a1f7-b78a652b652d@example.com",
        password: "P27m_09@b0",
        id: "6dfc326b-30f4-467e-bcb3-7f1a39ca07b3"
    }
}