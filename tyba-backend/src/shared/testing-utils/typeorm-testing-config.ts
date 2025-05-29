import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../user/user.entity/user.entity';
import { TransactionEntity } from '../../transaction/transaction.entity/transaction.entity';

export const TypeOrmTestingConfig = () => [
 TypeOrmModule.forRoot({
   type: 'sqlite',
   database: ':memory:',
   dropSchema: true,
   entities: [UserEntity, TransactionEntity],
   synchronize: true,
 }),
 TypeOrmModule.forFeature([UserEntity, TransactionEntity]),
];