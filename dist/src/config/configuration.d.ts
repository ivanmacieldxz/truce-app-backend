export declare const configuration: () => {
    port: number;
    database: {
        url: string | undefined;
    };
    supabase: {
        jwtSecret: string | undefined;
    };
    fcm: {
        serverKey: string | undefined;
    };
};
