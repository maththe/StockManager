import { Module } from '@nestjs/common';
import { PrismaModule } from './services/prisma.module';
import { UsersModule } from './services/users/users.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
