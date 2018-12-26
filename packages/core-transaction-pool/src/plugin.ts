import { Container } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { config } from "./config";
import { TransactionPool } from "./connection";
import { defaults } from "./defaults";
import { transactionPoolManager } from "./manager";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "transactionPool",
    async register(container: Container, options) {
        config.init(options);

        container.resolvePlugin<AbstractLogger>("logger").info("Connecting to transaction pool");

        await transactionPoolManager.makeConnection(new TransactionPool(options));

        return transactionPoolManager.connection();
    },
    async deregister(container: Container, options) {
        container.resolvePlugin<AbstractLogger>("logger").info("Disconnecting from transaction pool");

        return transactionPoolManager.connection().disconnect();
    },
};
