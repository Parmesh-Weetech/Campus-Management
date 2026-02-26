import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleMeta } from "../types/role.types";
import { ROLE_KEY } from "../constants";
import { AccessActionEnum } from "src/app/common/enums/access-action.enum";
import { AccessEntityEnum } from "src/app/common/enums/access-entitiy.enum";
import { UserRole } from "src/app/user/types/user-role";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<RoleMeta>(ROLE_KEY, context.getHandler());

        if (!requiredRoles) return true;

        const request = context.switchToHttp().getRequest();

        const user = request.user;
        if (!user) throw new UnauthorizedException("User not found in request");

        if (user.userRole === UserRole.ADMIN) {
            return true;
        }

        const { entity, action } = requiredRoles;

        if (user.userRole === UserRole.PROFESSOR) {
            if (entity === AccessEntityEnum.ATTENDANCE &&
                [AccessActionEnum.CREATE, AccessActionEnum.UPDATE, AccessActionEnum.DELETE, AccessActionEnum.VIEW].includes(action as AccessActionEnum)
            ) {
                return true;
            }
            if (entity === AccessEntityEnum.USER && action === AccessActionEnum.VIEW) {
                return true;
            }

            throw new UnauthorizedException(
                `You are not authorized to ${action} ${entity}`,
            );
        }

        if (user.userRole === UserRole.STUDENT) {
            if (entity === AccessEntityEnum.ATTENDANCE && action === AccessActionEnum.VIEW) {
                return true;
            }
            if (entity === AccessEntityEnum.USER && action === AccessActionEnum.VIEW_OWN) {
                return true;
            }

            throw new UnauthorizedException(
                `You are not authorized to ${action} ${entity}`,
            );
        }

        throw new UnauthorizedException(
            `You are not authorized to ${action} ${entity}`,
        );
    }
}