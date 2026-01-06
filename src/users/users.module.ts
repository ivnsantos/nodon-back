import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserBase } from './entities/user-base.entity';
import { UserComum } from './entities/user-comum.entity';
import { UserBaseService } from './services/user-base.service';
import { UserComumService } from './services/user-comum.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserBase, UserComum])],
  controllers: [UsersController],
  providers: [UsersService, UserBaseService, UserComumService],
  exports: [UsersService, UserBaseService, UserComumService],
})
export class UsersModule {}

