import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuponsService } from './cupons.service';
import { CuponsController } from './cupons.controller';
import { Cupom } from './entities/cupom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cupom])],
  controllers: [CuponsController],
  providers: [CuponsService],
  exports: [CuponsService],
})
export class CuponsModule {}

