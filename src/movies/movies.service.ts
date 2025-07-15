import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie, User, Role } from '@prisma/client';

@Injectable()
export class MoviesService {
  constructor(private prisma: PrismaService) {}

  async create(createMovieDto: CreateMovieDto, userId: number): Promise<Movie> {
    const data: any = {
      ...createMovieDto,
      userId,
    };

    if (createMovieDto.watchedAt) {
      data.watchedAt = new Date(createMovieDto.watchedAt);
    }

    return this.prisma.movie.create({ data });
  }

  async findAll(user: User): Promise<Movie[]> {
    // Les utilisateurs normaux ne voient que leurs films
    if (user.role === Role.USER) {
      return this.prisma.movie.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Les admins voient tous les films
    return this.prisma.movie.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, user: User): Promise<Movie> {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    // Vérifier les permissions
    if (user.role === Role.USER && movie.userId !== user.id) {
      throw new ForbiddenException('You can only access your own movies');
    }

    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto, user: User): Promise<Movie> {
    const movie = await this.findOne(id, user);

    // Seul le propriétaire peut modifier son film
    if (movie.userId !== user.id) {
      throw new ForbiddenException('You can only update your own movies');
    }

    const data: any = { ...updateMovieDto };
    if (updateMovieDto.watchedAt) {
      data.watchedAt = new Date(updateMovieDto.watchedAt);
    }

    return this.prisma.movie.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, user: User): Promise<Movie> {
    const movie = await this.findOne(id, user);

    // Seul le propriétaire peut supprimer son film
    if (movie.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own movies');
    }

    return this.prisma.movie.delete({
      where: { id },
    });
  }

  async findUserMovies(userId: number, requestingUser: User): Promise<Movie[]> {
    // Seuls les admins peuvent voir les films d'un autre utilisateur
    if (requestingUser.role !== Role.ADMIN && requestingUser.id !== userId) {
      throw new ForbiddenException('You can only access your own movies');
    }

    return this.prisma.movie.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}