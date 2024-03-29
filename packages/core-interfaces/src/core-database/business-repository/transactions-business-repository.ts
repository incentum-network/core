import { Enums, Interfaces } from "@arkecosystem/crypto";
import { IWallet } from "../../core-state/wallets";
import { IParameters } from "./parameters";

export interface ITransactionsPaginated {
    rows: Interfaces.ITransactionData[];
    count: number;
}

export interface ITransactionsBusinessRepository {
    findAll(params: IParameters, sequenceOrder?: "asc" | "desc"): Promise<ITransactionsPaginated>;

    findAllLegacy(parameters: IParameters): Promise<void>;

    findAllByWallet(wallet: IWallet, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllBySender(senderPublicKey: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllByRecipient(recipientId: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    allVotesBySender(senderPublicKey: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllByBlock(blockId: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllByType(type: number, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findById(id: string): Promise<Interfaces.ITransactionData>;

    findByTypeAndId(type: number, id: string): Promise<Interfaces.ITransactionData>;

    getAssetsByType(type: Enums.TransactionTypes | number): Promise<any>;

    getReceivedTransactions(): Promise<any>;

    getSentTransactions(): Promise<any>;

    getFeeStatistics(
        days: number,
    ): Promise<
        Array<{
            type: number;
            fee: number;
            timestamp: number;
        }>
    >;

    search(params: IParameters): Promise<ITransactionsPaginated>;
}
