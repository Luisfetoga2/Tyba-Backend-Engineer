import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { TransactionEntity } from './transaction.entity/transaction.entity';
import { TransactionService } from './transaction.service';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../user/user.entity/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import axios from 'axios';

jest.mock('axios');

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionRepository: Repository<TransactionEntity>;
  let configService: ConfigService;
  let user: UserEntity;
  let transactionsList: TransactionEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [
        TransactionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'restaurantsApi.key') return 'test-rest-key';
              if (key === 'restaurantsApi.url') return 'https://rest.api/';
              if (key === 'cityApi.key') return 'test-city-key';
              if (key === 'cityApi.url') return 'https://city.api/';
              return '';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    transactionRepository = module.get<Repository<TransactionEntity>>(getRepositoryToken(TransactionEntity));
    configService = module.get<ConfigService>(ConfigService);
    await seedDatabase();
  });

  const seedDatabase = async () => {
    const transactions = await transactionRepository.find();
    for (const transaction of transactions) {
      await transactionRepository.remove(transaction);
    }
    transactionsList = [];
    // Save user in the database to satisfy FK constraint
    user = await transactionRepository.manager.save(UserEntity, {
      email: 'test@example.com',
      hashedPassword: 'hashed',
    });
    for (let i = 0; i < 3; i++) {
      const transaction = await transactionRepository.save({
        city: `City${i}`,
        coordinates: `${i},${i}`,
        date: new Date(),
        user,
      });
      transactionsList.push(transaction);
    }
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('should return all transactions for a user without the user property', async () => {
      const result = await service.findAllByUser(user.id);
      expect(result.length).toBe(3);
      result.forEach((t, idx) => {
        expect(t.city).toBe(`City${idx}`);
        expect(t).not.toHaveProperty('user');
      });
    });
  });

  describe('create', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a transaction and search restaurants by city', async () => {
      const createTransactionDto: CreateTransactionDto = {
        city: 'Bogota',
        coordinates: '',
      };
      // Mock city API response
      (axios.get as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            features: [
              { geometry: { coordinates: [1.23, 4.56] } },
            ],
          },
        })
      );
      // Mock restaurants API response
      (axios.get as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          data: { places: [{ name: 'Resto1' }] },
        })
      );
      const result = await service.create(createTransactionDto, user);
      expect(result.transaction).toBeDefined();
      expect(result.transaction.city).toBe('Bogota');
      expect(result.apiResult).toBeDefined();
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it('should create a transaction and search restaurants by coordinates', async () => {
      const createTransactionDto: CreateTransactionDto = {
        city: '',
        coordinates: '10,20',
      };
      // Mock restaurants API response
      (axios.get as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          data: { places: [{ name: 'Resto2' }] },
        })
      );
      const result = await service.create(createTransactionDto, user);
      expect(result.transaction).toBeDefined();
      expect(result.transaction.coordinates).toBe('10,20');
      expect(result.apiResult).toBeDefined();
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should use default coordinates if city not found', async () => {
      const createTransactionDto: CreateTransactionDto = {
        city: 'UnknownCity',
        coordinates: '',
      };
      // Mock city API response (no features)
      (axios.get as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({ data: { features: [] } })
      );
      // Mock restaurants API response
      (axios.get as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({ data: { places: [{ name: 'DefaultResto' }] } })
      );
      const result = await service.create(createTransactionDto, user);
      expect(result.transaction.city).toBe('UnknownCity');
      expect(result.transaction.coordinates).toBe('0,0');
      expect(result.apiResult).toBeDefined();
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
});