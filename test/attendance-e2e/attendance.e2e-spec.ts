import { INestApplication } from "@nestjs/common"
import { defaultBeforeAll } from "../utils/commonHooks";

describe('AttendanceController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await defaultBeforeAll();

        
    })
})