import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateStandupDto {
  @ApiProperty({ example: '2024-01-15', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: 'professional', enum: ['professional', 'casual', 'detailed', 'concise'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['professional', 'casual', 'detailed', 'concise'])
  tone?: string;

  @ApiProperty({ example: 'medium', enum: ['short', 'medium', 'long'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['short', 'medium', 'long'])
  length?: string;

  @ApiProperty({ example: 'Please focus on technical achievements', required: false })
  @IsOptional()
  @IsString()
  customPrompt?: string;
}