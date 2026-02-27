import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { ROLE_KEY } from "../constants";
import { RoleMeta } from "../types/role.types";
import { RoleGuard } from "../guards/role.guard";
import { UserRole } from "src/app/user/types/user-role";

export const Role = (...roles: UserRole[]) => {
    return applyDecorators(
        SetMetadata(ROLE_KEY, roles as RoleMeta),
        UseGuards(RoleGuard),
    );
};
