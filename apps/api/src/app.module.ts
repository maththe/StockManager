
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './services/prisma.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
