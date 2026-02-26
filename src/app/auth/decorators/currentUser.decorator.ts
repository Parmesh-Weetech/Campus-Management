import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetCurrentUser = createParamDecorator(
    (_data: never, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();

        return request.user ?? request.currentUser;
    }
)
