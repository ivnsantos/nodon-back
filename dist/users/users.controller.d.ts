import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(req: any): Promise<import("./entities/user.entity").User[]>;
    findOne(id: string, req: any): Promise<import("./entities/user.entity").User>;
    update(id: string, data: any): Promise<import("./entities/user.entity").User>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
