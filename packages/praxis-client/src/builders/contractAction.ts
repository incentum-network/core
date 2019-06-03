import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { ContractActionPayload } from "@incentum/praxis-interfaces";
import { TransactionTypes } from "../enums";

export class ContractActionBuilder extends Transactions.TransactionBuilder<ContractActionBuilder> {
    constructor(fee: Utils.BigNumber) {
        super();
        this.data.type = TransactionTypes.ContractAction as number;
        this.data.fee = fee;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = {};
    }

    public contractAction(payload: ContractActionPayload): ContractActionBuilder {
        this.data.asset = {
            payload,
        };
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): ContractActionBuilder {
        return this;
    }
}
