import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserBase } from './entities/user-base.entity';
import { UserComum } from './entities/user-comum.entity';
import { UserBaseService } from './services/user-base.service';
import { UserComumService } from './services/user-comum.service';
import { ClientesMasterModule } from './clientes-master.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserBase, UserComum]),
    forwardRef(() => ClientesMasterModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserBaseService, UserComumService],
  exports: [UsersService, UserBaseService, UserComumService],
})
export class UsersModule {}

