/* tslint:disable:no-empty */
import { State } from "@arkecosystem/core-interfaces";
import { Blocks, Interfaces } from "@arkecosystem/crypto";

export class StateStorageStub implements State.IStateStorage {
    public blockchain: any;
    public lastDownloadedBlock: Interfaces.IBlock | null;
    public blockPing: any;
    public started: boolean;
    public forkedBlock: Interfaces.IBlock | null;
    public wakeUpTimeout: any;
    public noBlockCounter: number;
    public p2pUpdateCounter: number;
    public numberOfBlocksToRollback: number | null;
    public networkStart: boolean;

    public cacheTransactions(
        transactions: Interfaces.ITransactionData[],
    ): { added: Interfaces.ITransactionData[]; notAdded: Interfaces.ITransactionData[] } {
        return undefined;
    }

    public clear(): void {}

    public clearWakeUpTimeout(): void {}

    public getCachedTransactionIds(): string[] {
        return [];
    }

    public getCommonBlocks(ids: string[]): Interfaces.IBlockData[] {
        return [];
    }

    public getLastHeight(): number {
        return 1;
    }

    public getLastBlock(): Interfaces.IBlock | null {
        return undefined;
    }

    public getLastBlockIds(): string[] {
        return [];
    }

    public getLastBlocks(): Interfaces.IBlock[] {
        return [];
    }

    public getLastBlocksByHeight(start: number, end?: number): Interfaces.IBlockData[] {
        return [];
    }

    public pingBlock(incomingBlock: Interfaces.IBlockData): boolean {
        return false;
    }

    public pushPingBlock(block: Interfaces.IBlockData): void {}

    public removeCachedTransactionIds(transactionIds: string[]): void {}

    public reset(): void {}

    public setLastBlock(block: Blocks.Block): void {}
}

export const stateStorageStub = new StateStorageStub();
