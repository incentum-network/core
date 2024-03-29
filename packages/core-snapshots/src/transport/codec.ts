import { Blocks, Transactions, Utils } from "@arkecosystem/crypto";
import { createCodec, decode, encode } from "msgpack-lite";
import { camelizeKeys, decamelizeKeys } from "xcase";

const encodeBlock = block => {
    const blockCamelized = camelizeKeys(block);
    blockCamelized.totalAmount = Utils.BigNumber.make(blockCamelized.totalAmount);
    blockCamelized.totalFee = Utils.BigNumber.make(blockCamelized.totalFee);
    blockCamelized.reward = Utils.BigNumber.make(blockCamelized.reward);

    return Blocks.Block.serialize(blockCamelized, true);
};

const decodeBlock = (buffer: Buffer) => {
    const block = Blocks.Block.deserialize(buffer.toString("hex"), true);
    // @ts-ignore - @TODO: remove ts-ignore
    block.totalAmount = block.totalAmount.toFixed();
    // @ts-ignore - @TODO: remove ts-ignore
    block.totalFee = block.totalFee.toFixed();
    // @ts-ignore - @TODO: remove ts-ignore
    block.reward = block.reward.toFixed();

    return decamelizeKeys(block);
};

const encodeTransaction = transaction => {
    transaction.blockId = transaction.block_id || transaction.blockId;

    return encode([
        transaction.id,
        transaction.blockId,
        transaction.sequence,
        transaction.timestamp,
        transaction.serialized,
    ]);
};

const decodeTransaction = (buffer: Buffer) => {
    const [id, blockId, sequence, timestamp, serialized] = decode(buffer);

    const transaction: any = Transactions.TransactionFactory.fromBytesUnsafe(serialized, id).data;
    const { asset } = transaction;
    transaction.asset = undefined;

    transaction.block_id = blockId;
    transaction.sequence = sequence;
    transaction.timestamp = timestamp;
    transaction.amount = transaction.amount.toFixed();
    transaction.fee = transaction.fee.toFixed();
    transaction.vendorFieldHex = transaction.vendorFieldHex ? transaction.vendorFieldHex : undefined;
    transaction.recipientId = transaction.recipientId ? transaction.recipientId : undefined;
    transaction.serialized = serialized;

    const decamelized = decamelizeKeys(transaction);
    decamelized.serialized = serialized; // FIXME: decamelizeKeys mutilates Buffers
    decamelized.asset = asset ? asset : undefined;

    return decamelized;
};

const encodeRound = round => {
    return encode([round.id, round.public_key || round.publicKey, round.balance, round.round]);
};

const decodeRound = (buffer: Buffer) => {
    const [id, publicKey, balance, round] = decode(buffer);

    return decamelizeKeys({
        id,
        publicKey,
        balance,
        round,
    });
};

export class Codec {
    static get blocks() {
        const codec = createCodec();
        codec.addExtPacker(0x3f, Object, encodeBlock);
        codec.addExtUnpacker(0x3f, decodeBlock);

        return codec;
    }

    static get transactions() {
        const codec = createCodec();
        codec.addExtPacker(0x4f, Object, encodeTransaction);
        codec.addExtUnpacker(0x4f, decodeTransaction);

        return codec;
    }

    static get rounds() {
        const codec = createCodec();
        codec.addExtPacker(0x5f, Object, encodeRound);
        codec.addExtUnpacker(0x5f, decodeRound);

        return codec;
    }
}
