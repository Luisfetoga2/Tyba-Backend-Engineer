import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
    constructor(
       @InjectRepository(UserEntity)
       private readonly userRepository: Repository<UserEntity>
    ){}

    // Find user by email
    async findByEmail(email: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    // Find user by ID
    async findById(id: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    // Register a new user
    async create(createUserDto: CreateUserDto): Promise<UserEntity> {
        const { email, password } = createUserDto;
        
        // Check if email is already registered
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const user = this.userRepository.create({
            email,
            hashedPassword,
        });
        
        return this.userRepository.save(user);
    }
}
