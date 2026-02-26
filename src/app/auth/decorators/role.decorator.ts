import { SetMetadata } from "@nestjs/common";
import { ROLE_KEY } from "../constants";
import { RoleMeta } from "../types/role.types";

export const Role = (entity: string, action: string) => {
    return SetMetadata(ROLE_KEY, { entity, action } as RoleMeta);
};