import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const runId = Date.now();

const professorFixture = {
    email: `test-professor-user-${runId}@example.com`,
    password: "P27m_09@b0",
};

const studentFixture = {
    email: `test-student-user-${runId}@example.com`,
    password: "P27m_09@b0",
};

export function mockProfessor(): {
    email: string,
    password: string
} {
    return professorFixture;
}

export function mockStudent(): {
    email: string,
    password: string
} {
    return studentFixture;
}
