import { IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMovieDto {
  @ApiProperty({
    description: 'Movie title',
    example: 'The Matrix',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Movie director',
    example: 'The Wachowskis',
    required: false,
  })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiProperty({
    description: 'Release year',
    example: 1999,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  releaseYear?: number;

  @ApiProperty({
    description: 'Movie genre',
    example: 'Science Fiction',
    required: false,
  })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiProperty({
    description: 'Personal rating (1-10)',
    example: 8.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rating?: number;

  @ApiProperty({
    description: 'Personal notes about the movie',
    example: 'Great movie, loved the special effects',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Date when the movie was watched',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  watchedAt?: string;
}