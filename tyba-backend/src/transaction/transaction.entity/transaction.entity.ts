import { UserEntity } from '../../user/user.entity/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TransactionEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    city: string;

    @Column()
    coordinates: string;

    @Column()
    date: Date;

    @ManyToOne(() => UserEntity, user => user.transactions)
    user: UserEntity;
}
