import { Column, Entity } from "typeorm";
import { BaseEntity } from "../../../app/common/entity/base.entity";
import { UserStatus } from "../types/user-status";
import { UserRole } from "../types/user-role";

@Entity("user")
export class User extends BaseEntity {
    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false, unique: true })
    email: string;

    @Column({ nullable: false, name: "phone_number" })
    phoneNumber: string;

    @Column({ nullable: false })
    password: string;

    @Column({ type: 'enum', nullable: false, enum: UserStatus })
    status: UserStatus

    @Column({ type: 'enum', nullable: false, enum: UserRole, default: UserRole.ADMIN, name: "user_role" })
    userRole: UserRole;

    @Column({ nullable: true, name: "profile_picture" })
    profilePicture: string;

    @Column({ nullable: true, name: "profile_picture_thumbnail" })
    profilePictureThumbnail: string;
}