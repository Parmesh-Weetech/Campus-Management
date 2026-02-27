import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { setupApp } from "../../src/setup-app";

export const defaultBeforeAll = async (): Promise<INestApplication> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();
    const app: INestApplication = moduleFixture.createNestApplication();
    await setupApp(app);
    await app.init();
    return app;
};