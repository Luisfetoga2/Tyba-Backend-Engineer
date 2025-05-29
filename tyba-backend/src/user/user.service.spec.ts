import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { UserEntity } from './user.entity/user.entity';
import { UserService } from './user.service';
import { ConflictException } from '@nestjs/common';

import { faker } from '@faker-js/faker';
import { CreateUserDto } from './dto/create-user.dto';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<UserEntity>;
  let usersList: UserEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    await seedDatabase();
  });

  const seedDatabase = async () => {
    repository.clear();
    usersList = [];
    for(let i = 0; i < 5; i++){
        const user: UserEntity = await repository.save({
          email: faker.internet.email(),
          hashedPassword: faker.internet.password(),
        })
        usersList.push(user);
    }
  }
    
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // FindByEmail tests
  it('findByEmail should return a user by email', async () => {
    const storedUser: UserEntity = usersList[0];
    const user: UserEntity = await service.findByEmail(storedUser.email);
    expect(user).not.toBeNull();
    expect(user.id).toEqual(storedUser.id);
    expect(user.email).toEqual(storedUser.email);
    expect(user.hashedPassword).toEqual(storedUser.hashedPassword);
  });

  it('findByEmail should throw an exception for an invalid email', async () => {
    await expect(() => service.findByEmail("")).rejects.toHaveProperty("message", "User not found")
  });

  // FindById tests
  it('findById should return a user by id', async () => {
    const storedUser: UserEntity = usersList[0];
    const user: UserEntity = await service.findById(storedUser.id);
    expect(user).not.toBeNull();
    expect(user.id).toEqual(storedUser.id);
    expect(user.email).toEqual(storedUser.email);
    expect(user.hashedPassword).toEqual(storedUser.hashedPassword);
  });

  it('findById should throw an exception for an invalid user', async () => {
    await expect(() => service.findById("0")).rejects.toHaveProperty("message", "User not found")
  });

  // Create tests
  it('create should return a new user', async () => {
    const user: CreateUserDto = {
      email: faker.internet.email(),
      password: faker.internet.password(),
    }

    const newUser: UserEntity = await service.create(user);
    expect(newUser).not.toBeNull();

    const storedUser: UserEntity = await repository.findOne({where: {id: newUser.id}})
    expect(storedUser).not.toBeNull();
    expect(storedUser.email).toEqual(newUser.email);
    expect(storedUser.hashedPassword).toEqual(newUser.hashedPassword);
  });

  it('create should throw an exception for an already existing email', async () => {
    const storedUser: UserEntity = usersList[0];

    const user: CreateUserDto = {
      email: storedUser.email,
      password: faker.internet.password(),
    }

    await expect(() => service.create(user)).rejects.toThrow(ConflictException);
  });
});