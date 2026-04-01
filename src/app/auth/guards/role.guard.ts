import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleMeta } from "../types/role.types";
import { ROLE_KEY } from "../constants";
import { CustomExceptionFactory } from "../../common/exception/custom-exception.factory";
import { ErrorCode } from "../../common/exception/error-code";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<RoleMeta>(ROLE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        
        if (!user || !user.id || !user.userRole) {
            throw CustomExceptionFactory.create(ErrorCode.USER_NOT_IN_REQUEST);
        }

        if (!requiredRoles.includes(user.userRole)) {
            throw CustomExceptionFactory.create(ErrorCode.ROLE_PERMISSION_DENIED);
        }

        return true;
    }
}
