import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Treatment } from './entities/treatment.entity';
import { CostCategory } from './entities/cost-category.entity';
import { Product } from './entities/product.entity';
import { TreatmentProduct } from './entities/treatment-product.entity';
import { TreatmentsService } from './services/treatments.service';
import { CostCategoriesService } from './services/cost-categories.service';
import { ProductsService } from './services/products.service';
import { AnalyticsService } from './services/analytics.service';
import { TreatmentValidationService } from './services/treatment-validation.service';
import { TreatmentsController } from './controllers/treatments.controller';
import { CostCategoriesController } from './controllers/cost-categories.controller';
import { ProductsController } from './controllers/products.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Treatment,
      CostCategory,
      Product,
      TreatmentProduct,
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => ClientesMasterModule),
  ],
  controllers: [
    TreatmentsController,
    CostCategoriesController,
    ProductsController,
    AnalyticsController,
  ],
  providers: [
    TreatmentsService,
    CostCategoriesService,
    ProductsService,
    AnalyticsService,
    TreatmentValidationService,
  ],
  exports: [
    TreatmentsService,
    CostCategoriesService,
    ProductsService,
    AnalyticsService,
  ],
})
export class TreatmentsModule {}

