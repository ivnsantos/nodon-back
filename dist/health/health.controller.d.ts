export declare class HealthController {
    health(): {
        status: string;
        message: string;
        timestamp: string;
    };
    healthCheck(): {
        status: string;
        message: string;
        timestamp: string;
    };
    healthHead(): void;
}
