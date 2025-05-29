import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // Find all transactions for the authenticated user
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    return this.transactionService.findAllByUser(req.user.id);
  }

  // Search for restaurants based on city or coordinates
  @UseGuards(JwtAuthGuard)
  @Post('search')
  async searchRestaurants(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    return this.transactionService.create(createTransactionDto, req.user);
  }
}
