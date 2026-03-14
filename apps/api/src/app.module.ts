
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './services/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';



@Module({
  imports: [
    UsersModule,
    PrismaModule,
    AuthModule,
  ],
  controllers: [],
  providers: [{
  provide: 'APP_GUARD',
  useClass: AuthGuard,
} ],
})
export class AppModule {}
