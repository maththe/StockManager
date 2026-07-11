import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from 'src/services/prisma.service';
import { User, UserRole } from '@prisma/client';
import { matchesSearch } from 'src/common/search.util';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createUserInput: CreateUserInput,
    tenantUuid?: string,
    role?: UserRole,
  ): Promise<User> {
    const email = createUserInput?.email?.trim();
    const name = createUserInput?.name?.trim();
    const senha = createUserInput?.senha;

    if (!email || !name || !senha) {
      throw new BadRequestException('Informe nome, e-mail e senha.');
    }

    const password = await bcrypt.hash(senha, 10);

    try {
      return await this.prisma.user.create({
        data: {
          email,
          name,
          password,
          ...(tenantUuid ? { tenantUuid } : {}),
          ...(role ? { role } : {}),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      throw error;
    }
  }

  async findAll(tenantUuid?: string, search?: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: tenantUuid ? { tenantUuid } : undefined,
      orderBy: { name: 'asc' },
    });

    return users.filter((user) => matchesSearch([user.name, user.email], search));
  }

  async findOne(id: string, tenantUuid?: string): Promise<User | null> {
    const where: any = { id };
    if (tenantUuid) where.tenantUuid = tenantUuid;

    return this.prisma.user.findFirst({ where });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findMe(id: string, tenantUuid: string): Promise<User | null> {
    return this.findOne(id, tenantUuid);
  }

  async update(
    id: string,
    updateUserInput: UpdateUserInput,
    tenantUuid?: string,
  ): Promise<User> {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Apenas campos permitidos — nunca repassar o body cru (role/tenantUuid não são editáveis aqui)
    const data: { email?: string; name?: string; password?: string } = {
      email: updateUserInput.email,
      name: updateUserInput.name,
    };

    if (updateUserInput.senha) {
      data.password = await bcrypt.hash(updateUserInput.senha, 10);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      throw error;
    }
  }

  async remove(id: string, tenantUuid?: string): Promise<User> {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
