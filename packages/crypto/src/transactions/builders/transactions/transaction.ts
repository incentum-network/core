import { Transaction } from "../..";
import { crypto, slots } from "../../../crypto";
import { MissingTransactionSignatureError } from "../../../errors";
import { IKeyPair, ITransactionData } from "../../../interfaces";
import { configManager } from "../../../managers";
import { NetworkType } from "../../../types";
import { BigNumber, maxVendorFieldLength } from "../../../utils";

export abstract class TransactionBuilder<TBuilder extends TransactionBuilder<TBuilder>> {
    public data: ITransactionData;

    protected signWithSenderAsRecipient: boolean = false;

    constructor() {
        this.data = {
            id: null,
            timestamp: slots.getTime(),
            version: 0x01,
        } as ITransactionData;
    }

    public build(data: Partial<ITransactionData> = {}): Transaction {
        return Transaction.fromData({ ...this.data, ...data }, false);
    }

    public version(version: number): TBuilder {
        this.data.version = version;

        return this.instance();
    }

    public network(network: number): TBuilder {
        this.data.network = network;

        return this.instance();
    }

    public fee(fee: string): TBuilder {
        if (fee !== null) {
            this.data.fee = BigNumber.make(fee);
        }

        return this.instance();
    }

    public amount(amount: string): TBuilder {
        this.data.amount = BigNumber.make(amount);

        return this.instance();
    }

    public recipientId(recipientId: string): TBuilder {
        this.data.recipientId = recipientId;

        return this.instance();
    }

    public senderPublicKey(publicKey: string): TBuilder {
        this.data.senderPublicKey = publicKey;

        return this.instance();
    }

    public vendorField(vendorField: string): TBuilder {
        if (vendorField && Buffer.from(vendorField).length <= maxVendorFieldLength()) {
            this.data.vendorField = vendorField;
        }

        return this.instance();
    }

    public sign(passphrase: string): TBuilder {
        const keys: IKeyPair = crypto.getKeys(passphrase);
        this.data.senderPublicKey = keys.publicKey;

        if (this.signWithSenderAsRecipient) {
            const pubKeyHash = this.data.network || configManager.get("pubKeyHash");
            this.data.recipientId = crypto.getAddress(crypto.getKeys(passphrase).publicKey, pubKeyHash);
        }

        this.data.signature = crypto.sign(this.getSigningObject(), keys);

        return this.instance();
    }

    public signWithWif(wif: string, networkWif?: number): TBuilder {
        const keys: IKeyPair = crypto.getKeysFromWIF(wif, {
            wif: networkWif || configManager.get("wif"),
        } as NetworkType);

        this.data.senderPublicKey = keys.publicKey;

        if (this.signWithSenderAsRecipient) {
            const pubKeyHash = this.data.network || configManager.get("pubKeyHash");

            this.data.recipientId = crypto.getAddress(keys.publicKey, pubKeyHash);
        }

        this.data.signature = crypto.sign(this.getSigningObject(), keys);

        return this.instance();
    }

    public secondSign(secondPassphrase: string): TBuilder {
        this.data.secondSignature = crypto.secondSign(this.getSigningObject(), crypto.getKeys(secondPassphrase));

        return this.instance();
    }

    public secondSignWithWif(wif: string, networkWif?: number): TBuilder {
        const keys = crypto.getKeysFromWIF(wif, {
            wif: networkWif || configManager.get("wif"),
        } as NetworkType);

        this.data.secondSignature = crypto.secondSign(this.getSigningObject(), keys);

        return this.instance();
    }

    public multiSignatureSign(passphrase: string): TBuilder {
        const keys: IKeyPair = crypto.getKeys(passphrase);

        if (!this.data.signatures) {
            this.data.signatures = [];
        }

        this.data.signatures.push(crypto.sign(this.getSigningObject(), keys));

        return this.instance();
    }

    public verify(): boolean {
        return crypto.verify(this.data);
    }

    public getStruct(): ITransactionData {
        if (!this.data.senderPublicKey || !this.data.signature) {
            throw new MissingTransactionSignatureError();
        }

        const struct: ITransactionData = {
            id: crypto.getId(this.data).toString(),
            signature: this.data.signature,
            secondSignature: this.data.secondSignature,
            timestamp: this.data.timestamp,
            version: this.data.version,
            type: this.data.type,
            fee: this.data.fee,
            senderPublicKey: this.data.senderPublicKey,
            network: this.data.network,
        } as ITransactionData;

        if (Array.isArray(this.data.signatures)) {
            struct.signatures = this.data.signatures;
        }

        return struct;
    }

    protected abstract instance(): TBuilder;

    private getSigningObject(): ITransactionData {
        const data: ITransactionData = { ...this.data };

        Object.keys(data).forEach(key => {
            if (["model", "network", "id"].includes(key)) {
                delete data[key];
            }
        });

        return data;
    }
}
