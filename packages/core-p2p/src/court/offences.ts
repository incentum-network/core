export const offences = {
    BLACKLISTED: {
        number: 12,
        period: "hour",
        reason: "Blacklisted",
        weight: 10,
    },
    NO_COMMON_BLOCKS: {
        number: 5,
        period: "minute",
        reason: "No Common Blocks",
        weight: 1,
        critical: true,
    },
    NO_COMMON_ID: {
        number: 5,
        period: "minute",
        reason: "No Common Id",
        weight: 1,
        critical: true,
    },
    INVALID_VERSION: {
        number: 6,
        period: "hour",
        reason: "Invalid Version",
        weight: 7,
    },
    INVALID_HEIGHT: {
        number: 10,
        period: "minute",
        reason: "Node is not at height",
        weight: 5,
    },
    INVALID_NETWORK: {
        number: 5,
        period: "minute",
        reason: "Invalid Network",
        weight: 5,
    },
    INVALID_STATUS: {
        number: 5,
        period: "minute",
        reason: "Invalid Response Status",
        weight: 3,
    },
    TIMEOUT: {
        number: 2,
        period: "minute",
        reason: "Timeout",
        weight: 2,
    },
    HIGH_LATENCY: {
        number: 1,
        period: "minute",
        reason: "High Latency",
        weight: 1,
    },
    BLOCKCHAIN_NOT_READY: {
        number: 30,
        period: "second",
        reason: "Blockchain not ready",
        weight: 0,
    },
    TOO_MANY_REQUESTS: {
        number: 60,
        period: "second",
        reason: "Rate limit exceeded",
        weight: 0,
    },
    UNKNOWN: {
        number: 30,
        period: "minute",
        reason: "Unknown",
        weight: 5,
    },
    REPEAT_OFFENDER: {
        number: 1,
        period: "day",
        reason: "Repeat Offender",
        weight: 100,
    },
    FORK: {
        number: 1,
        period: "day",
        reason: "Fork",
        weight: 150,
        critical: true,
    },
};
