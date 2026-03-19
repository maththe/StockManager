import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CategoriesService } from './categories.service';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryInput, @Req() req: Request) {
    const user = (req as any).user;
    return this.categoriesService.create(createCategoryDto, user.tenantUuid);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const user = (req as any).user;
    return this.categoriesService.findAll(user.tenantUuid);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.categoriesService.findOne(id, user.tenantUuid);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryInput,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.categoriesService.update(id, updateCategoryDto, user.tenantUuid);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.categoriesService.remove(id, user.tenantUuid);
  }
}
