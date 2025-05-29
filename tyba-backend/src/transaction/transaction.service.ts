import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from './transaction.entity/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UserEntity } from '../user/user.entity/user.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
    private readonly configService: ConfigService,
  ) {}

  // Create a new transaction and search for restaurants based on city or coordinates
  async create(createTransactionDto: CreateTransactionDto, user: UserEntity): Promise<any> {
    const city = createTransactionDto.city;
    let coordinates = createTransactionDto.coordinates;

    // Prepare API call
    const apiKey = this.configService.get<string>('restaurantsApi.key');
    const apiUrl = this.configService.get<string>('restaurantsApi.url');
    let url = '';
    let apiResult = null;
    if (city) {
      // If a city is provided, it overrides coordinates
      const cityApiKey = this.configService.get<string>('cityApi.key');
      const cityApiUrl = this.configService.get<string>('cityApi.url');
      url = `${cityApiUrl}autocomplete?text=${encodeURIComponent(city)}&apiKey=${cityApiKey}&limit=1`;

      const response = await axios.get(url);
      apiResult = response.data;

      if (!apiResult.features || apiResult.features.length === 0) {
        // Default coordinates if city not found
        coordinates = '0,0';
      } else {
        // Get coordinates of the city to search for restaurants
        coordinates = apiResult.features[0].geometry.coordinates.join(',');
      }
    }

    if (coordinates) {
      // If coordinates are provided, search for restaurants within a 5km radius, but only return 10 results
      url = `${apiUrl}places?categories=catering.restaurant&filter=circle:${encodeURIComponent(coordinates)},5000&bias=proximity:${encodeURIComponent(coordinates)}&limit=10&apiKey=${apiKey}`;
    }
    
    if (url) {
      const response = await axios.get(url);
      apiResult = response.data;
    }
    // Save transaction (with default values if city or coordinates are not provided)
    const transaction = this.transactionRepository.create({
      city: city || '',
      coordinates: coordinates || '',
      date: new Date(),
      user,
    });
    await this.transactionRepository.save(transaction);

    return { transaction, apiResult };
  }

  // Find all transactions for a specific user, excluding the 'user' property from the result
  async findAllByUser(userId: string): Promise<Omit<TransactionEntity, 'user'>[]> {
    const transactions = await this.transactionRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    // Remove the 'user' property from the result
    return transactions.map((transaction) => {
      const { user, ...rest } = transaction;
      return rest;
    });
  }

}
