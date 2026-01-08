import { Repository } from 'typeorm';
import { UserComum } from './entities/user-comum.entity';
export declare class UsersService {
    private userComumRepository;
    constructor(userComumRepository: Repository<UserComum>);
    findAllByClienteMaster(clienteMasterId: string): Promise<UserComum[]>;
}
