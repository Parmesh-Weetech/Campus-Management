import { BaseEntity } from "../../common/entity/base.entity";
import { User } from "../../user/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { AttendanceStatus } from "../types/attendance-status.types";

@Entity('attendance')
@Unique(['student', 'date', 'className'])
export class Attendance extends BaseEntity {
    @ManyToOne(() => User, user => user.attendances, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studentId' })
    student: User;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'recordedById' })
    recordedBy: User;

    @Column({ type: 'date', nullable: false })
    date: string;

    @Column({ type: 'enum', enum: AttendanceStatus, nullable: false })
    status: AttendanceStatus;

    @Column({ nullable: false })
    className: string;
}