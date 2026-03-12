import { Module } from '@nestjs/common';
import { PrismaModule } from './services/prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
