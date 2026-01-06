import { Repository } from 'typeorm';
import { User, UserType } from './entities/user.entity';
import { UserComum } from './entities/user-comum.entity';
export declare class UsersService {
    private userRepository;
    private userComumRepository;
    constructor(userRepository: Repository<User>, userComumRepository: Repository<UserComum>);
    create(data: {
        nome: string;
        email: string;
        password: string;
        clienteMasterId: string;
        tipo?: UserType;
        isVerified?: boolean;
        verificationToken?: string | null;
        tokenExpiresAt?: Date | null;
    }): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAllByClienteMaster(clienteMasterId: string): Promise<UserComum[]>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
    findByVerificationToken(token: string): Promise<User | null>;
    updateVerificationStatus(id: string, isVerified: boolean): Promise<User>;
}
