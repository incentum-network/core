import { Managers } from "@arkecosystem/crypto";
import { blocks2to100 } from "../../../utils/fixtures";
import { delegates } from "../../../utils/fixtures/testnet/delegates";
import { genesisBlock } from "../../../utils/fixtures/unitnet/block-model";
import { defaults } from "./p2p-options";

Managers.configManager.setFromPreset("unitnet");

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    config: Managers.configManager.all(),
                    get: key => {
                        switch (key) {
                            case "network.nethash":
                                return "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348";
                        }

                        return null;
                    },
                    getMilestone: () => ({
                        activeDelegates: 51,
                    }),
                };
            },
            getVersion: () => "2.3.0",
            has: () => true,
            resolvePlugin: name => {
                if (name === "logger") {
                    return {
                        info: console.log,
                        warn: console.log,
                        error: console.error,
                        debug: console.log,
                    };
                }

                if (name === "database") {
                    return {
                        getBlocksByHeight: heights => {
                            if (heights[0] === 1) {
                                return [genesisBlock.data];
                            }

                            return [];
                        },
                        getActiveDelegates: height => {
                            return delegates;
                        },
                        loadActiveDelegateList: (count, height) => {
                            if (height === 2) {
                                return [blocks2to100[1]];
                            }

                            return delegates;
                        },
                        getForgedTransactionsIds: jest.fn().mockReturnValue([]),
                    };
                }

                if (name === "event-emitter") {
                    return {
                        emit: jest.fn(),
                    };
                }

                if (name === "blockchain") {
                    return {
                        getLastBlock: jest.fn().mockReturnValue({ data: { height: 1 }, getHeader: () => ({}) }),
                        pingBlock: jest.fn().mockReturnValue(true),
                        getLastDownloadedBlock: jest.fn().mockReturnValue(null),
                        pushPingBlock: jest.fn().mockReturnValue(null),
                        handleIncomingBlock: jest.fn().mockReturnValue(null),
                    };
                }

                if (name === "p2p") {
                    return {
                        guard: {},
                    };
                }

                if (name === "transaction-pool") {
                    return {
                        transactionExists: jest.fn().mockReturnValue(false),
                        isSenderBlocked: jest.fn().mockReturnValue(false),
                        hasExceededMaxTransactions: jest.fn().mockReturnValue(false),
                        addTransactions: jest.fn().mockReturnValue({ added: ["111"], notAdded: [] }),
                        walletManager: {
                            canApply: jest.fn().mockReturnValue(true),
                        },
                        makeProcessor: jest.fn().mockReturnValue({
                            validate: jest.fn().mockImplementation(() => {
                                throw new Error("The payload contains invalid transaction.");
                            }),
                        }),
                        options: {
                            maxTransactionBytes: 10e6,
                        },
                    };
                }

                if (name === "state") {
                    return {
                        getLastBlock: () => genesisBlock,
                        cacheTransactions: jest.fn().mockImplementation(txs => ({ notAdded: txs, added: [] })),
                        removeCachedTransactionIds: jest.fn().mockReturnValue(null),
                    };
                }

                return {};
            },
            resolveOptions: name => {
                if (name === "p2p") {
                    return defaults;
                }

                if (name === "transaction-pool") {
                    return {
                        maxTransactionsPerRequest: 30,
                    };
                }

                return {};
            },
            resolve: name => {
                return {};
            },
        },
    };
});
