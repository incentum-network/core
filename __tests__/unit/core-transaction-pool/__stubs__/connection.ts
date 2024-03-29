import { TransactionPool } from "@arkecosystem/core-interfaces";
import { Blocks, Enums, Interfaces } from "@arkecosystem/crypto";
import { Dayjs } from "dayjs";
import { ITransactionsProcessed } from "../../../../packages/core-transaction-pool/src/interfaces";
import { Memory } from "../../../../packages/core-transaction-pool/src/memory";
import { Storage } from "../../../../packages/core-transaction-pool/src/storage";
import { WalletManager } from "../../../../packages/core-transaction-pool/src/wallet-manager";

export class Connection implements TransactionPool.IConnection {
    public options: any;
    public loggedAllowedSenders: string[];
    public walletManager: any;
    public memory: any;
    public storage: any;

    constructor({
        options,
        walletManager,
        memory,
        storage,
    }: {
        options: Record<string, any>;
        walletManager: WalletManager;
        memory: Memory;
        storage: Storage;
    }) {
        this.options = options;
        this.walletManager = walletManager;
        this.memory = memory;
        this.storage = storage;
    }

    public async make(): Promise<this> {
        return this;
    }

    public driver(): any {
        return;
    }

    public disconnect(): void {
        return;
    }

    public getPoolSize(): number {
        return 0;
    }

    public getSenderSize(senderPublicKey: string): number {
        return 0;
    }

    public addTransactions(transactions: Interfaces.ITransaction[]): ITransactionsProcessed {
        return { added: [], notAdded: [] };
    }

    public addTransaction(transaction: Interfaces.ITransaction): TransactionPool.IAddTransactionResponse {
        return undefined;
    }

    public removeTransaction(transaction: Interfaces.ITransaction): void {
        return;
    }

    public removeTransactionById(id: string, senderPublicKey?: string): void {
        return;
    }

    public removeTransactionsById(ids: string[]): void {
        return;
    }

    public async getTransactionsForForging(blockSize: number): Promise<string[]> {
        return [];
    }

    public getTransaction(id: string): Interfaces.ITransaction {
        return undefined;
    }

    public async getTransactions(start: number, size: number, maxBytes?: number): Promise<Buffer[]> {
        return [];
    }

    public async getTransactionIdsForForging(start: number, size: number): Promise<string[]> {
        return undefined;
    }

    public getTransactionsByType(type: any): any {
        return;
    }

    public removeTransactionsForSender(senderPublicKey: string): void {
        return;
    }

    public hasExceededMaxTransactions(senderPublicKey: string): boolean {
        return true;
    }

    public flush(): void {
        return;
    }

    public makeProcessor(): TransactionPool.IProcessor {
        return undefined;
    }

    public has(transactionId: string): any {
        return;
    }

    public isSenderBlocked(senderPublicKey: string): boolean {
        return true;
    }

    public blockSender(senderPublicKey: string): Dayjs {
        return undefined;
    }

    public acceptChainedBlock(block: Blocks.Block): void {
        return;
    }

    public async buildWallets(): Promise<void> {
        return;
    }

    public purgeByPublicKey(senderPublicKey: string): void {
        return;
    }

    public purgeSendersWithInvalidTransactions(block: Blocks.Block): void {
        return;
    }

    public purgeByBlock(block: Blocks.Block): void {
        return;
    }

    public senderHasTransactionsOfType(senderPublicKey: string, transactionType: Enums.TransactionTypes): boolean {
        return true;
    }
}
