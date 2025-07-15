import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, Role } from '@prisma/client';

@ApiTags('movies')
@Controller('movies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a movie to watchlist' })
  @ApiResponse({ status: 201, description: 'Movie added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body(ValidationPipe) createMovieDto: CreateMovieDto, @CurrentUser() user: User) {
    return this.moviesService.create(createMovieDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get user movies (or all movies for admin)' })
  @ApiResponse({ status: 200, description: 'Movies retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: User) {
    return this.moviesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific movie' })
  @ApiResponse({ status: 200, description: 'Movie retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your movie' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.moviesService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a movie' })
  @ApiResponse({ status: 200, description: 'Movie updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your movie' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateMovieDto: UpdateMovieDto,
    @CurrentUser() user: User,
  ) {
    return this.moviesService.update(id, updateMovieDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a movie' })
  @ApiResponse({ status: 200, description: 'Movie deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your movie' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.moviesService.remove(id, user);
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get movies of a specific user (admin only)' })
  @ApiResponse({ status: 200, description: 'User movies retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async findUserMovies(@Param('userId', ParseIntPipe) userId: number, @CurrentUser() user: User) {
    return this.moviesService.findUserMovies(userId, user);
  }
}