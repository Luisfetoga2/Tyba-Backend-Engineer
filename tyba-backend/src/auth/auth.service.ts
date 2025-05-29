import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../user/user.entity/user.entity';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {

  // In-memory blacklist for invalidated tokens
  private readonly blacklist = new Set<string>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Validates user credentials against the database
  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user: UserEntity = await this.userService.findByEmail(email);
      const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
      
      if (isPasswordValid) {
        const { hashedPassword, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Logs in the user and returns a JWT token along with user info
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id };
    const jwtSecret = this.configService.get<string>('jwt.secret');
    const jwtExpiresIn = this.configService.get<string>('jwt.expiresIn');
    return {
      access_token: this.jwtService.sign(payload, { secret: jwtSecret, expiresIn: jwtExpiresIn }),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  // Registers a new user and returns a JWT token along with user info
  async register(createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    // Call login to return token and user info
    return this.login(user.email, createUserDto.password);
  }

  // Logs out the user by adding the token to the blacklist
  async logout(token: string) {
    if (!token) {
      throw new Error('No token provided');
    }
    this.blacklist.add(token);
    return { message: 'Logged out successfully' };
  }

  // Checks if a token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.blacklist.has(token)
  }
}
