import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from 'src/services/prisma.service';
import { User } from '@prisma/client';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService){}

  async create(createUserInput: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: createUserInput,
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateUserInput: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: updateUserInput,
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
