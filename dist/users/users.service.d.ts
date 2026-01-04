import { Repository } from 'typeorm';
import { User, UserType } from './entities/user.entity';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    create(data: {
        nome: string;
        email: string;
        password: string;
        clienteMasterId: string;
        tipo?: UserType;
    }): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAllByClienteMaster(clienteMasterId: string): Promise<User[]>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
}
