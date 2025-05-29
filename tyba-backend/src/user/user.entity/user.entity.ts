import { TransactionEntity } from '../../transaction/transaction.entity/transaction.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column()
    hashedPassword: string;

    @OneToMany(() => TransactionEntity, transaction => transaction.user)
    transactions: TransactionEntity[];
}
