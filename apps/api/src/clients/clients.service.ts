import { Injectable, NotFoundException } from '@nestjs/common';
import { Client } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { matchesSearch } from 'src/common/search.util';
import { CreateClientInput } from './dto/create-client.input';
import { UpdateClientInput } from './dto/update-client.input';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClientInput: CreateClientInput, tenantUuid: string): Promise<Client> {
    return this.prisma.client.create({
      data: {
        companyName: createClientInput.companyName,
        taxId: createClientInput.taxId,
        contactName: createClientInput.contactName,
        tenantUuid,
      },
    });
  }

  async findAll(tenantUuid: string, search?: string): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: { tenantUuid },
      orderBy: { companyName: 'asc' },
    });

    return clients.filter((client) =>
      matchesSearch([client.companyName, client.taxId, client.contactName], search),
    );
  }

  async findOne(id: string, tenantUuid: string): Promise<Client | null> {
    return this.prisma.client.findFirst({
      where: { id, tenantUuid },
    });
  }

  async update(id: string, updateClientInput: UpdateClientInput, tenantUuid: string): Promise<Client> {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.client.update({
      where: { id },
      data: updateClientInput,
    });
  }

  async remove(id: string, tenantUuid: string): Promise<Client> {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.client.delete({
      where: { id },
    });
  }
}
