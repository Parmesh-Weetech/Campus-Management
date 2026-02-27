import { Column, Entity, ManyToOne } from "typeorm";
import { BaseEntity } from "../../common/entity/base.entity";
import { User } from "../../user/entities/user.entity";

@Entity("refresh_token")
export class RefreshToken extends BaseEntity {
    @ManyToOne(() => User, user => user.tokens, {
        cascade: true, onDelete: "CASCADE", onUpdate: "CASCADE"
    })
    user: User

    @Column({ name: "refreshToken" })
    refreshToken: string
}