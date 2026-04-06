import { Column, Entity, ManyToOne, Index } from "typeorm";
import { BaseEntity } from "../../common/entity/base.entity";
import { User } from "../../user/entities/user.entity";

@Entity("refresh_token")
@Index(["user"])
@Index(["refreshToken"])
export class RefreshToken extends BaseEntity {
    @ManyToOne(() => User, user => user.tokens, {
        cascade: true, onDelete: "CASCADE", onUpdate: "CASCADE"
    })
    user: User;

    @Column({ name: "refreshToken" })
    refreshToken: string;
}