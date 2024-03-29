export const defaults = {
    enabled: !process.env.CORE_WALLET_API_DISABLED,
    server: {
        host: process.env.CORE_WALLET_API_HOST || "0.0.0.0",
        port: process.env.CORE_WALLET_API_PORT || 4040,
    },
};
