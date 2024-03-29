import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

export interface ITransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;

    bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void>;

    verify(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): boolean;

    canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): boolean;
    apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;

    canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean;

    emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void;
}
