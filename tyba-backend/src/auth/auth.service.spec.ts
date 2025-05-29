import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AppModule } from '../app.module';
import { UserEntity } from '../user/user.entity/user.entity';
import { TransactionEntity } from '../transaction/transaction.entity/transaction.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('AuthService', () => {
    let service: AuthService;
    let userRepository: Repository<UserEntity>;
    let transactionRepository: Repository<TransactionEntity>;
    let userList: UserEntity[];
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
        transactionRepository = module.get<Repository<TransactionEntity>>(getRepositoryToken(TransactionEntity));

        await seedDatabase();
    });

    afterEach(async () => {
        await module.close();
    });

    const seedDatabase = async () => {
        // Remove all transactions first to avoid FK constraint errors
        const transactions = await transactionRepository.find();
        if (transactions.length > 0) {
            await transactionRepository.remove(transactions);
        }

        const users = await userRepository.find();
        if (users.length > 0) {
            await userRepository.remove(users);
        }

        userList = [];
        for (let i = 0; i < 5; i++) {
            const user: UserEntity = await userRepository.save({
                email: 'user' + i + '@example.com',
                hashedPassword: await bcrypt.hash('password' + i, 10),
            });
            userList.push(user);
        }
    }

    // Validate user tests
    it('should return user data without password if credentials are valid', async () => {
        const email = 'user0@example.com';
        const password = 'password0';
        
        const result = await service.validateUser(email, password);
        expect(result).toBeDefined();
        expect(result.email).toEqual(email);
        expect(result.hashedPassword).toBeUndefined(); // Password should not be returned

    });

    it('should return null if password is invalid', async () => {
        const email = 'user0@example.com';
        const password = 'wrongpassword';
        const result = await service.validateUser(email, password);
        expect(result).toBeNull();
    });

    it('should return null if email is not found', async () => {
        const email = 'user@example.com';
        const password = 'password';
        const result = await service.validateUser(email, password);
        expect(result).toBeNull();
    });

    // Login tests
    it('should return access_token and user info', async () => {
        const email = 'user0@example.com';
        const password = 'password0';
        const result = await service.login(email, password);
        expect(result).toHaveProperty('access_token');
        expect(result).toHaveProperty('user');
        expect(result.user.email).toEqual(email);
        expect(result.user.id).toBeDefined();
    });

    // Register tests
    it('should create user and return access_token and user info', async () => {
        const mockCreateUserDto: CreateUserDto = {
            email: 'newUser@example.com',
            password: 'newPassword',
        };
        const result = await service.register(mockCreateUserDto);
        expect(result).toHaveProperty('access_token');
        expect(result).toHaveProperty('user');
        expect(result.user.email).toEqual(mockCreateUserDto.email);
        expect(result.user.id).toBeDefined();
    });

    it('should throw error if email already exists', async () => {
        const mockCreateUserDto: CreateUserDto = {
            email: 'user0@example.com',
            password: 'newPassword',
        };
        await expect(service.register(mockCreateUserDto)).rejects.toThrow('Email already exists');
    });

    // Logout tests
    it('should revoke token and return message', async () => {
        const loginResult = await service.login('user0@example.com', 'password0');
        const token = loginResult.access_token;
        const result = await service.logout(token);
        expect(result).toEqual({ message: 'Logged out successfully' });
        expect(await service.isTokenBlacklisted(token)).toBeTruthy();
    });

    it('should throw error if no token provided', async () => {
      await expect(service.logout(undefined)).rejects.toThrow('No token provided');
    });

    // Blacklist tests
    it('should return true if token is blacklisted', async () => {
        const loginResult = await service.login('user0@example.com', 'password0');
        const token = loginResult.access_token;
        await service.logout(token);
        const result = await service.isTokenBlacklisted(token);
        expect(result).toBe(true);
    });

    it('should return false if token is not blacklisted', async () => {
        const loginResult = await service.login('user0@example.com', 'password0');
        const token = loginResult.access_token;
        const result = await service.isTokenBlacklisted(token);
        expect(result).toBe(false);
    });
});
