import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { ContractStartPayload } from '@incentum/praxis-interfaces';
import { TransactionTypes } from '../enums';

export class ContractStartBuilder extends Transactions.TransactionBuilder<ContractStartBuilder> {
    constructor(fee: Utils.BigNumber) {
        super();
        this.data.type = TransactionTypes.ContractStart as number;
        this.data.fee = fee;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = {};
    }

    public contractStart(payload: ContractStartPayload): ContractStartBuilder {
        this.data.asset = {
            payload
        }
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): ContractStartBuilder {
        return this;
    }
}
