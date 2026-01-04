import { OnModuleInit } from '@nestjs/common';
import { PlanosService } from './planos/planos.service';
export declare class AppModule implements OnModuleInit {
    private planosService;
    constructor(planosService: PlanosService);
    onModuleInit(): Promise<void>;
}
