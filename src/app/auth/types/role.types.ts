import { AccessActionEnum } from "src/app/common/enums/access-action.enum";
import { AccessEntityEnum } from "src/app/common/enums/access-entitiy.enum";

export type RoleMeta = {
    entity: AccessEntityEnum;
    action: AccessActionEnum;
}