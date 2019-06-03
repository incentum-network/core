import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { SaveTemplatePayload } from "@incentum/praxis-interfaces";
import { TransactionTypes } from "../enums";

export class SaveTemplateBuilder extends Transactions.TransactionBuilder<SaveTemplateBuilder> {
    constructor(fee: Utils.BigNumber) {
        super();
        this.data.type = TransactionTypes.SaveTemplate as number;
        this.data.fee = fee;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = {};
    }

    public saveTemplate(payload: SaveTemplatePayload): SaveTemplateBuilder {
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

    protected instance(): SaveTemplateBuilder {
        return this;
    }
}
