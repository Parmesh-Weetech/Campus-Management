import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { ROLE_KEY } from "../constants";
import { RoleMeta } from "../types/role.types";
import { AccessEntityEnum } from "src/app/common/enums/access-entitiy.enum";
import { AccessActionEnum } from "src/app/common/enums/access-action.enum";
import { RoleGuard } from "../guards/role.guard";

export const Role = (entity: AccessEntityEnum, action: AccessActionEnum) => {
    return applyDecorators(
        SetMetadata(ROLE_KEY, { entity, action } as RoleMeta),
        UseGuards(RoleGuard),
    );
};