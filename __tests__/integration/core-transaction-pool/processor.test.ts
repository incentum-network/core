import "jest-extended";

import { Blockchain, Container, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Blocks, Identities, Interfaces, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { delegates, genesisBlock, wallets, wallets2ndSig } from "../../utils/fixtures/unitnet";
import { generateWallets } from "../../utils/generators/wallets";
import { setUpFull, tearDownFull } from "./__support__/setup";
// import { Crypto, Enums, Managers } from "@arkecosystem/crypto";
// import { Connection } from "../../../packages/core-transaction-pool/src/connection";
// import { delegates, wallets } from "../../utils/fixtures/unitnet";

let container: Container.IContainer;
let processor: TransactionPool.IProcessor;
let transactionPool: TransactionPool.IConnection;
let blockchain: Blockchain.IBlockchain;

beforeAll(async () => {
    container = await setUpFull();

    transactionPool = container.resolvePlugin("transaction-pool");
    blockchain = container.resolvePlugin("blockchain");
});

afterAll(async () => {
    await tearDownFull();
});

beforeEach(() => {
    transactionPool.flush();
    processor = transactionPool.makeProcessor();
});

describe("Transaction Guard", () => {
    describe("validate", () => {
        it.each([false, true])(
            "should not apply transactions for chained transfers involving cold wallets",
            async inverseOrder => {
                /* The logic here is we can't have a chained transfer A => B => C if B is a cold wallet.
                  A => B needs to be first confirmed (forged), then B can transfer to C
                */

                const satoshi = 10 ** 8;
                // don't re-use the same delegate (need clean balance)
                const delegate = inverseOrder ? delegates[8] : delegates[9];
                const delegateWallet = transactionPool.walletManager.findByAddress(delegate.address);

                const newWallets = generateWallets("unitnet", 2);
                const poolWallets = newWallets.map(w => transactionPool.walletManager.findByAddress(w.address));

                expect(+delegateWallet.balance).toBe(+delegate.balance);
                poolWallets.forEach(w => {
                    expect(+w.balance).toBe(0);
                });

                const transfer0 = {
                    // transfer from delegate to wallet 0
                    from: delegate,
                    to: newWallets[0],
                    amount: 100 * satoshi,
                };
                const transfer1 = {
                    // transfer from wallet 0 to wallet 1
                    from: newWallets[0],
                    to: newWallets[1],
                    amount: 55 * satoshi,
                };
                const transfers = [transfer0, transfer1];
                if (inverseOrder) {
                    transfers.reverse();
                }

                for (const t of transfers) {
                    const transferTx = TransactionFactory.transfer(t.to.address, t.amount)
                        .withNetwork("unitnet")
                        .withPassphrase(t.from.passphrase)
                        .build()[0];

                    await processor.validate([transferTx.data]);
                }

                // apply again transfer from 0 to 1
                const transfer = TransactionFactory.transfer(transfer1.to.address, transfer1.amount)
                    .withNetwork("unitnet")
                    .withPassphrase(transfer1.from.passphrase)
                    .build()[0];

                await processor.validate([transfer.data]);

                const expectedError = {
                    message: '["Cold wallet is not allowed to send until receiving transaction is confirmed."]',
                    type: "ERR_APPLY",
                };
                expect(processor.getErrors()[transfer.id]).toContainEqual(expectedError);

                // check final balances
                expect(+delegateWallet.balance).toBe(delegate.balance - (100 + 0.1) * satoshi);
                expect(+poolWallets[0].balance).toBe(0);
                expect(+poolWallets[1].balance).toBe(0);
            },
        );

        it("should not apply the tx to the balance of the sender & recipient with dyn fee < min fee", async () => {
            const delegate0 = delegates[14];
            const { publicKey } = Identities.Keys.fromPassphrase(generateMnemonic());
            const newAddress = Identities.Address.fromPublicKey(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate0.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = 123 * 10 ** 8;
            const fee = 10;
            const transfers = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("unitnet")
                .withFee(fee)
                .withPassphrase(delegate0.secret)
                .build();

            await processor.validate(transfers.map(tx => tx.data));

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);
        });

        it("should update the balance of the sender & recipient with dyn fee > min fee", async () => {
            const delegate1 = delegates[1];
            const { publicKey } = Identities.Keys.fromPassphrase(generateMnemonic());
            const newAddress = Identities.Address.fromPublicKey(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate1.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            expect(+delegateWallet.balance).toBe(+delegate1.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = +delegateWallet.balance / 2;
            const fee = 0.1 * 10 ** 8;
            const transfers = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("unitnet")
                .withFee(fee)
                .withPassphrase(delegate1.secret)
                .build();
            await processor.validate(transfers.map(tx => tx.data));
            expect(processor.getErrors()).toEqual({});

            // simulate forged transaction
            const transactionHandler = Handlers.Registry.get(transfers[0].type);
            transactionHandler.applyToRecipient(transfers[0], newWallet);

            expect(+delegateWallet.balance).toBe(+delegate1.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1);
        });

        it("should update the balance of the sender & recipient with multiple transactions type", async () => {
            const delegate2 = delegates[2];
            const newWalletPassphrase = generateMnemonic();
            const { publicKey } = Identities.Keys.fromPassphrase(newWalletPassphrase);
            const newAddress = Identities.Address.fromPublicKey(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate2.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            expect(+delegateWallet.balance).toBe(+delegate2.balance);
            expect(+newWallet.balance).toBe(0);
            expect(processor.getErrors()).toEqual({});

            const amount1 = +delegateWallet.balance / 2;
            const fee = 0.1 * 10 ** 8;
            const voteFee = 10 ** 8;
            const delegateRegFee = 25 * 10 ** 8;
            const signatureFee = 5 * 10 ** 8;
            const transfers = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("unitnet")
                .withFee(fee)
                .withPassphrase(delegate2.secret)
                .build();
            const votes = TransactionFactory.vote(delegate2.publicKey)
                .withNetwork("unitnet")
                .withPassphrase(newWalletPassphrase)
                .build();
            const delegateRegs = TransactionFactory.delegateRegistration()
                .withNetwork("unitnet")
                .withPassphrase(newWalletPassphrase)
                .build();
            const signatures = TransactionFactory.secondSignature()
                .withNetwork("unitnet")
                .withPassphrase(newWalletPassphrase)
                .build();

            // Index wallets to not encounter cold wallet error
            const allTransactions = [...transfers, ...votes, ...delegateRegs, ...signatures];

            allTransactions.forEach(transaction => {
                container.resolvePlugin("database").walletManager.findByPublicKey(transaction.data.senderPublicKey);
            });

            // first validate the 1st transfer so that new wallet is updated with the amount
            await processor.validate(transfers.map(tx => tx.data));

            // simulate forged transaction
            const transactionHandler = Handlers.Registry.get(transfers[0].type);
            transactionHandler.applyToRecipient(transfers[0], newWallet);

            expect(processor.getErrors()).toEqual({});
            expect(+newWallet.balance).toBe(amount1);

            // reset processor, if not the 1st transaction will still be in this.accept and mess up
            processor = transactionPool.makeProcessor();

            await processor.validate([votes[0].data, delegateRegs[0].data, signatures[0].data]);

            expect(processor.getErrors()).toEqual({});
            expect(+delegateWallet.balance).toBe(+delegate2.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1 - voteFee - delegateRegFee - signatureFee);
        });

        it("should not accept transaction in excess", async () => {
            const delegate3 = delegates[3];
            const newWalletPassphrase = generateMnemonic();
            const { publicKey } = Identities.Keys.fromPassphrase(newWalletPassphrase);
            const newAddress = Identities.Address.fromPublicKey(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate3.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            // Make sure it is not considered a cold wallet
            container.resolvePlugin("database").walletManager.reindex(newWallet);

            expect(+delegateWallet.balance).toBe(+delegate3.balance);
            expect(+newWallet.balance).toBe(0);

            // first, transfer coins to new wallet so that we can test from it then
            const amount1 = 1000 * 10 ** 8;
            const fee = 0.1 * 10 ** 8;
            const transfers1 = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("unitnet")
                .withPassphrase(delegate3.secret)
                .build();
            await processor.validate(transfers1.map(tx => tx.data));

            // simulate forged transaction
            const transactionHandler = Handlers.Registry.get(transfers1[0].type);
            transactionHandler.applyToRecipient(transfers1[0], newWallet);

            expect(+delegateWallet.balance).toBe(+delegate3.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1);

            // transfer almost everything from new wallet so that we don't have enough for any other transaction
            const amount2 = 999 * 10 ** 8;
            const transfers2 = TransactionFactory.transfer(delegate3.address, amount2)
                .withNetwork("unitnet")
                .withPassphrase(newWalletPassphrase)
                .build();
            await processor.validate(transfers2.map(tx => tx.data));

            // simulate forged transaction
            transactionHandler.applyToRecipient(transfers2[0], delegateWallet);

            expect(+newWallet.balance).toBe(amount1 - amount2 - fee);

            // now try to validate any other transaction - should not be accepted because in excess
            const transferAmount = 0.5 * 10 ** 8;
            const transferDynFee = 0.5 * 10 ** 8;
            const allTransactions = [
                TransactionFactory.transfer(delegate3.address, transferAmount)
                    .withNetwork("unitnet")
                    .withFee(transferDynFee)
                    .withPassphrase(newWalletPassphrase)
                    .build(),
                TransactionFactory.secondSignature()
                    .withNetwork("unitnet")
                    .withPassphrase(newWalletPassphrase)
                    .build(),
                TransactionFactory.vote(delegate3.publicKey)
                    .withNetwork("unitnet")
                    .withPassphrase(newWalletPassphrase)
                    .build(),
                TransactionFactory.delegateRegistration()
                    .withNetwork("unitnet")
                    .withPassphrase(newWalletPassphrase)
                    .build(),
            ];

            for (const transaction of allTransactions) {
                await processor.validate(transaction.map(tx => tx.data));

                const errorExpected = [
                    {
                        message: `["Insufficient balance in the wallet."]`,
                        type: "ERR_APPLY",
                    },
                ];
                expect(processor.getErrors()[transaction[0].id]).toEqual(errorExpected);

                expect(+delegateWallet.balance).toBe(+delegate3.balance - amount1 - fee + amount2);
                expect(+newWallet.balance).toBe(amount1 - amount2 - fee);
            }
        });

        it("should not validate 2 double spending transactions", async () => {
            const amount = 245098000000000 - 5098000000000; // a bit less than the delegates' balance
            const transactions = TransactionFactory.transfer(delegates[1].address, amount)
                .withNetwork("unitnet")
                .withPassphrase(delegates[0].secret)
                .create(2);

            const result = await processor.validate(transactions);

            expect(result.errors[transactions[1].id]).toEqual([
                {
                    message: `["Insufficient balance in the wallet."]`,
                    type: "ERR_APPLY",
                },
            ]);
        });

        it.each([3, 5, 8])("should validate emptying wallet with %i transactions", async txNumber => {
            // use txNumber so that we use a different delegate for each test case
            const sender = delegates[txNumber];
            const senderWallet = transactionPool.walletManager.findByPublicKey(sender.publicKey);
            const receivers = generateWallets("unitnet", 2);
            const amountPlusFee = Math.floor(senderWallet.balance / txNumber);
            const lastAmountPlusFee = senderWallet.balance - (txNumber - 1) * amountPlusFee;
            const transferFee = 10000000;

            const transactions = TransactionFactory.transfer(receivers[0].address, amountPlusFee - transferFee)
                .withNetwork("unitnet")
                .withPassphrase(sender.secret)
                .create(txNumber - 1);
            const lastTransaction = TransactionFactory.transfer(receivers[1].address, lastAmountPlusFee - transferFee)
                .withNetwork("unitnet")
                .withPassphrase(sender.secret)
                .create();
            // we change the receiver in lastTransaction to prevent having 2 exact
            // same transactions with same id (if not, could be same as transactions[0])

            const result = await processor.validate(transactions.concat(lastTransaction));

            expect(result.errors).toEqual(undefined);
        });

        it.each([3, 5, 8])(
            "should not validate emptying wallet with %i transactions when the last one is 1 satoshi too much",
            async txNumber => {
                // use txNumber + 1 so that we don't use the same delegates as the above test
                const sender = delegates[txNumber + 1];
                const receivers = generateWallets("unitnet", 2);
                const amountPlusFee = Math.floor(sender.balance / txNumber);
                const lastAmountPlusFee = sender.balance - (txNumber - 1) * amountPlusFee + 1;
                const transferFee = 10000000;

                const transactions = TransactionFactory.transfer(receivers[0].address, amountPlusFee - transferFee)
                    .withNetwork("unitnet")
                    .withPassphrase(sender.secret)
                    .create(txNumber - 1);
                const lastTransaction = TransactionFactory.transfer(
                    receivers[1].address,
                    lastAmountPlusFee - transferFee,
                )
                    .withNetwork("unitnet")
                    .withPassphrase(sender.secret)
                    .create();
                // we change the receiver in lastTransaction to prevent having 2
                // exact same transactions with same id (if not, could be same as transactions[0])

                const allTransactions = transactions.concat(lastTransaction);

                const result = await processor.validate(allTransactions);

                expect(Object.keys(result.errors).length).toBe(1);
                expect(result.errors[lastTransaction[0].id]).toEqual([
                    {
                        message: `["Insufficient balance in the wallet."]`,
                        type: "ERR_APPLY",
                    },
                ]);
            },
        );

        it("should compute transaction id and therefore validate transactions with wrong id", async () => {
            const sender = delegates[21];
            const receivers = generateWallets("unitnet", 1);

            const transactions: Interfaces.ITransactionData[] = TransactionFactory.transfer(receivers[0].address, 50)
                .withNetwork("unitnet")
                .withPassphrase(sender.secret)
                .create();
            const transactionId = transactions[0].id;
            transactions[0].id = "a".repeat(64);

            const result = await processor.validate(transactions);
            expect(result.accept).toEqual([transactionId]);
            expect(result.broadcast).toEqual([transactionId]);
            expect(result.errors).toBeUndefined();
        });

        it("should not validate when multiple wallets register the same username in the same transaction payload", async () => {
            const delegateRegistrations = [
                TransactionFactory.delegateRegistration("test_delegate")
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[14].passphrase)
                    .build()[0],
                TransactionFactory.delegateRegistration("test_delegate")
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[15].passphrase)
                    .build()[0],
            ];

            const result = await processor.validate(delegateRegistrations.map(transaction => transaction.data));
            expect(result.invalid).toEqual(delegateRegistrations.map(transaction => transaction.id));

            delegateRegistrations.forEach(tx => {
                expect(processor.getErrors()[tx.id]).toEqual([
                    {
                        type: "ERR_CONFLICT",
                        message: `Multiple delegate registrations for "${
                            tx.data.asset.delegate.username
                        }" in transaction payload`,
                    },
                ]);
            });

            const wallet1 = transactionPool.walletManager.findByPublicKey(wallets[14].keys.publicKey);
            const wallet2 = transactionPool.walletManager.findByPublicKey(wallets[15].keys.publicKey);

            expect(wallet1.username).toBe(undefined);
            expect(wallet2.username).toBe(undefined);
        });

        describe("Sign a transaction then change some fields shouldn't pass validation", () => {
            it("should not validate when changing fields after signing - transfer", async () => {
                const sender = delegates[21];
                const notSender = delegates[22];

                // the fields we are going to modify after signing
                const modifiedFields = [
                    { timestamp: 111111 },
                    { amount: 111 },
                    { fee: 1111111 },
                    { recipientId: "ANqvJEMZcmUpcKBC8xiP1TntVkJeuZ3Lw3" },
                    // we are also going to modify senderPublicKey but separately
                ];

                // generate transfers, "simple" and 2nd signed
                const transfers = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5", 50)
                    .withNetwork("unitnet")
                    .withPassphrase(sender.secret)
                    .create(modifiedFields.length + 1); // + 1 because we will use it to modify senderPublicKey separately
                const transfers2ndSigned = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5", 50)
                    .withNetwork("unitnet")
                    .withPassphrasePair(wallets2ndSig[0])
                    .create(modifiedFields.length + 1); // + 1 because we will use it to modify senderPublicKey separately

                // modify transaction fields and try to validate
                const modifiedTransactions = [
                    ...modifiedFields.map((objField, index) => Object.assign({}, transfers[index], objField)),
                    Object.assign({}, transfers[transfers.length - 1], { senderPublicKey: notSender.publicKey }),
                    ...modifiedFields.map((objField, index) => Object.assign({}, transfers2ndSigned[index], objField)),
                    Object.assign({}, transfers2ndSigned[transfers2ndSigned.length - 1], {
                        senderPublicKey: wallets2ndSig[1].keys.publicKey,
                    }),
                ];
                const result = await processor.validate(modifiedTransactions);

                const expectedErrors = [
                    ...[...transfers, ...transfers2ndSigned].map(transfer => [
                        transfer.id,
                        "ERR_BAD_DATA",
                        "Transaction didn't pass the verification process.",
                    ]),
                ];

                expect(
                    Object.keys(result.errors).map(id => [id, result.errors[id][0].type, result.errors[id][0].message]),
                ).toEqual(expectedErrors);
                expect(result.invalid).toEqual(modifiedTransactions.map(transaction => transaction.id));
                expect(result.accept).toEqual([]);
                expect(result.broadcast).toEqual([]);
            });

            it("should not validate when changing fields after signing - delegate registration", async () => {
                // the fields we are going to modify after signing
                const modifiedFieldsDelReg = [
                    {
                        timestamp: 111111,
                    },
                    {
                        fee: 1111111,
                    },
                    // we are also going to modify senderPublicKey but separately
                ];

                // generate delegate registrations, "simple" and 2nd signed
                const delegateRegs = [];
                for (const wallet of wallets.slice(0, modifiedFieldsDelReg.length + 1)) {
                    delegateRegs.push(
                        TransactionFactory.delegateRegistration()
                            .withNetwork("unitnet")
                            .withPassphrase(wallet.passphrase)
                            .create()[0],
                    );
                }

                const delegateRegs2ndSigned = [];
                for (const wallet of wallets2ndSig.slice(0, modifiedFieldsDelReg.length + 1)) {
                    delegateRegs2ndSigned.push(
                        TransactionFactory.delegateRegistration()
                            .withNetwork("unitnet")
                            .withPassphrasePair(wallet)
                            .create()[0],
                    );
                }

                // modify transaction fields and try to validate
                const modifiedTransactions = [
                    ...modifiedFieldsDelReg.map((objField, index) => Object.assign({}, delegateRegs[index], objField)),
                    Object.assign({}, delegateRegs[delegateRegs.length - 1], {
                        senderPublicKey: wallets[50].keys.publicKey,
                    }),
                    ...modifiedFieldsDelReg.map((objField, index) =>
                        Object.assign({}, delegateRegs2ndSigned[index], objField),
                    ),
                    Object.assign({}, delegateRegs2ndSigned[delegateRegs2ndSigned.length - 1], {
                        senderPublicKey: wallets2ndSig[50].keys.publicKey,
                    }),
                ];
                const result = await processor.validate(modifiedTransactions);

                const expectedErrors = [
                    ...[...delegateRegs, ...delegateRegs2ndSigned].map(transfer => [
                        transfer.id,
                        "ERR_BAD_DATA",
                        "Transaction didn't pass the verification process.",
                    ]),
                ];

                expect(
                    Object.keys(result.errors).map(id => [id, result.errors[id][0].type, result.errors[id][0].message]),
                ).toEqual(expectedErrors);
                expect(result.invalid).toEqual(modifiedTransactions.map(transaction => transaction.id));
                expect(result.accept).toEqual([]);
                expect(result.broadcast).toEqual([]);
            });

            it("should not validate when changing fields after signing - vote", async () => {
                // the fields we are going to modify after signing
                const modifiedFieldsVote = [
                    { timestamp: 111111 },
                    { fee: 1111111 },
                    // we are also going to modify senderPublicKey but separately
                ];

                // generate votes, "simple" and 2nd signed
                const votes = [];
                for (const wallet of wallets.slice(0, modifiedFieldsVote.length + 1)) {
                    votes.push(
                        TransactionFactory.vote(delegates[21].publicKey)
                            .withNetwork("unitnet")
                            .withPassphrase(wallet.passphrase)
                            .create()[0],
                    );
                }

                const votes2ndSigned = [];
                for (const wallet of wallets2ndSig.slice(0, modifiedFieldsVote.length + 1)) {
                    votes2ndSigned.push(
                        TransactionFactory.vote(delegates[21].publicKey)
                            .withNetwork("unitnet")
                            .withPassphrasePair(wallet)
                            .create()[0],
                    );
                }

                // modify transaction fields and try to validate
                const modifiedTransactions = [
                    ...modifiedFieldsVote.map((objField, index) => Object.assign({}, votes[index], objField)),
                    Object.assign({}, votes[votes.length - 1], { senderPublicKey: wallets[50].keys.publicKey }),
                    ...modifiedFieldsVote.map((objField, index) => Object.assign({}, votes2ndSigned[index], objField)),
                    Object.assign({}, votes2ndSigned[votes2ndSigned.length - 1], {
                        senderPublicKey: wallets2ndSig[50].keys.publicKey,
                    }),
                ];
                const result = await processor.validate(modifiedTransactions);

                const expectedErrors = [
                    ...votes.map(tx => [tx.id, "ERR_BAD_DATA", "Transaction didn't pass the verification process."]),
                    ...votes2ndSigned.map(tx => [
                        tx.id,
                        "ERR_BAD_DATA",
                        "Transaction didn't pass the verification process.",
                    ]),
                ];

                expect(
                    Object.keys(result.errors).map(id => [id, result.errors[id][0].type, result.errors[id][0].message]),
                ).toEqual(expectedErrors);
                expect(result.invalid).toEqual(modifiedTransactions.map(transaction => transaction.id));
                expect(result.accept).toEqual([]);
                expect(result.broadcast).toEqual([]);
            });

            it("should not validate when changing fields after signing - 2nd signature registration", async () => {
                // the fields we are going to modify after signing
                const modifiedFields2ndSig = [
                    { timestamp: 111111 },
                    { fee: 1111111 },
                    { senderPublicKey: wallets[50].keys.publicKey },
                ];

                const secondSigs = [];

                for (const wallet of wallets.slice(0, modifiedFields2ndSig.length)) {
                    secondSigs.push(
                        TransactionFactory.secondSignature(wallet.passphrase)
                            .withNetwork("unitnet")
                            .withPassphrase(wallet.passphrase)
                            .create()[0],
                    );
                }

                const modifiedTransactions = modifiedFields2ndSig.map((objField, index) =>
                    Object.assign({}, secondSigs[index], objField),
                );
                const result = await processor.validate(modifiedTransactions);

                expect(
                    Object.keys(result.errors).map(id => [id, result.errors[id][0].type, result.errors[id][0].message]),
                ).toEqual(
                    secondSigs.map(tx => [tx.id, "ERR_BAD_DATA", "Transaction didn't pass the verification process."]),
                );
                expect(result.invalid).toEqual(modifiedTransactions.map(transaction => transaction.id));
                expect(result.accept).toEqual([]);
                expect(result.broadcast).toEqual([]);
            });
        });

        describe("Transaction replay shouldn't pass validation", () => {
            afterEach(async () => blockchain.removeBlocks(blockchain.getLastHeight() - 1)); // resets to height 1

            const addBlock = async transactions => {
                let totalAmount = Utils.BigNumber.ZERO;
                let totalFee = Utils.BigNumber.ZERO;

                for (const transaction of transactions) {
                    totalAmount = totalAmount.plus(transaction.amount);
                    totalFee = totalFee.plus(transaction.fee);
                }

                // makes blockchain accept a new block with the transactions specified
                const block = {
                    id: "17882607875259085966",
                    version: 0,
                    timestamp: 46583330,
                    height: 2,
                    reward: Utils.BigNumber.make(0),
                    previousBlock: genesisBlock.id,
                    numberOfTransactions: 1,
                    transactions,
                    totalAmount,
                    totalFee,
                    payloadLength: 0,
                    payloadHash: genesisBlock.payloadHash,
                    generatorPublicKey: delegates[0].publicKey,
                    blockSignature:
                        "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
                    createdAt: "2019-07-11T16:48:50.550Z",
                };
                const blockVerified = Blocks.BlockFactory.fromData(block);
                blockVerified.verification.verified = true;

                await blockchain.processBlocks([blockVerified], () => undefined);
            };

            const forgedErrorMessage = id => ({
                [id]: [
                    {
                        message: "Already forged.",
                        type: "ERR_FORGED",
                    },
                ],
            });

            it("should not validate an already forged transaction", async () => {
                const transfers = TransactionFactory.transfer(wallets[1].address, 11)
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[0].passphrase)
                    .create();
                await addBlock(transfers);

                const result = await processor.validate(transfers);

                expect(result.errors).toEqual(forgedErrorMessage(transfers[0].id));
            });

            it("should not validate an already forged transaction - trying to tweak tx id", async () => {
                const transfers = TransactionFactory.transfer(wallets[1].address, 11)
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[0].passphrase)
                    .create();
                await addBlock(transfers);

                const realTransferId = transfers[0].id;
                transfers[0].id = "c".repeat(64);

                const result = await processor.validate(transfers);

                expect(result.errors).toEqual(forgedErrorMessage(realTransferId));
            });
        });
    });

    describe("__cacheTransactions", () => {
        it("should add transactions to cache", async () => {
            const transactions = TransactionFactory.transfer(wallets[11].address, 35)
                .withNetwork("unitnet")
                .withPassphrase(wallets[10].passphrase)
                .build();

            await processor.validate(transactions.map(tx => tx.data));

            expect(processor.getTransactions()).toEqual(transactions.map(tx => tx.data));
        });

        it("should not add a transaction already in cache and add it as an error", async () => {
            const transactions = TransactionFactory.transfer(wallets[12].address, 35)
                .withNetwork("unitnet")
                .withPassphrase(wallets[11].passphrase)
                .build();

            await processor.validate(transactions.map(tx => tx.data));
            expect(processor.getTransactions()).toEqual(transactions.map(tx => tx.data));

            await processor.validate([transactions[0].data]);
            expect(processor.getTransactions()).toEqual([]);

            expect(processor.getErrors()).toEqual({
                [transactions[0].id]: [
                    {
                        message: "Already in cache.",
                        type: "ERR_DUPLICATE",
                    },
                ],
            });
        });
    });

    // @TODO: review and remove tests that are no longer needed.
    // Those used to be unit tests but their behaviour is already covered by integration tests.

    // describe("__cacheTransactions", () => {
    //     it("should add transactions to cache", () => {
    //         const transactions = TransactionFactory.transfer(wallets[11].address, 35)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .create(3);
    //         jest.spyOn(state, "cacheTransactions").mockReturnValueOnce({ added: transactions, notAdded: [] });

    //         expect(processor.__cacheTransactions(transactions)).toEqual(transactions);
    //     });

    //     it("should not add a transaction already in cache and add it as an error", () => {
    //         const transactions = TransactionFactory.transfer(wallets[12].address, 35)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[11].passphrase)
    //             .create(3);

    //         jest.spyOn(state, "cacheTransactions")
    //             .mockReturnValueOnce({ added: transactions, notAdded: [] })
    //             .mockReturnValueOnce({ added: [], notAdded: [transactions[0]] });

    //         expect(processor.__cacheTransactions(transactions)).toEqual(transactions);
    //         expect(processor.__cacheTransactions([transactions[0]])).toEqual([]);
    //         expect(processor.errors).toEqual({
    //             [transactions[0].id]: [
    //                 {
    //                     message: "Already in cache.",
    //                     type: "ERR_DUPLICATE",
    //                 },
    //             ],
    //         });
    //     });
    // });

    // describe("getBroadcastTransactions", () => {
    //     it("should return broadcast transaction", async () => {
    //         const transactions = TransactionFactory.transfer(wallets[11].address, 25)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .build(3);

    //         jest.spyOn(state, "cacheTransactions").mockReturnValueOnce({ added: transactions, notAdded: [] });

    //         for (const tx of transactions) {
    //             processor.broadcast.set(tx.id, tx);
    //         }

    //         expect(processor.getBroadcastTransactions()).toEqual(transactions);
    //     });
    // });

    // describe("__filterAndTransformTransactions", () => {
    //     it("should reject duplicate transactions", () => {
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => true);

    //         const tx = { id: "1" };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).toEqual([
    //             {
    //                 message: `Duplicate transaction ${tx.id}`,
    //                 type: "ERR_DUPLICATE",
    //             },
    //         ]);

    //         processor.pool.transactionExists = transactionExists;
    //     });

    //     it("should reject blocked senders", () => {
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => false);
    //         const isSenderBlocked = processor.pool.isSenderBlocked;
    //         processor.pool.isSenderBlocked = jest.fn(() => true);

    //         const tx = { id: "1", senderPublicKey: "affe" };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).toEqual([
    //             {
    //                 message: `Transaction ${tx.id} rejected. Sender ${tx.senderPublicKey} is blocked.`,
    //                 type: "ERR_SENDER_BLOCKED",
    //             },
    //         ]);

    //         processor.pool.isSenderBlocked = isSenderBlocked;
    //         processor.pool.transactionExists = transactionExists;
    //     });

    //     it("should reject transactions that are too large", () => {
    //         const tx = TransactionFactory.transfer(wallets[12].address)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[11].passphrase)
    //             .build(3)[0];

    //         // @FIXME: Uhm excuse me, what the?
    //         tx.data.signatures = [""];
    //         for (let i = 0; i < transactionPool.options.maxTransactionBytes; i++) {
    //             // @ts-ignore
    //             tx.data.signatures += "1";
    //         }
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).toEqual([
    //             {
    //                 message: `Transaction ${tx.id} is larger than ${
    //                     transactionPool.options.maxTransactionBytes
    //                 } bytes.`,
    //                 type: "ERR_TOO_LARGE",
    //             },
    //         ]);
    //     });

    //     it("should reject transactions from the future", () => {
    //         const now = 47157042; // seconds since genesis block
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => false);
    //         const getTime = Crypto.Slots.getTime;
    //         Crypto.Slots.getTime = jest.fn(() => now);

    //         const secondsInFuture = 3601;
    //         const tx = {
    //             id: "1",
    //             senderPublicKey: "affe",
    //             timestamp: Crypto.Slots.getTime() + secondsInFuture,
    //         };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).toEqual([
    //             {
    //                 message: `Transaction ${tx.id} is ${secondsInFuture} seconds in the future`,
    //                 type: "ERR_FROM_FUTURE",
    //             },
    //         ]);

    //         Crypto.Slots.getTime = getTime;
    //         processor.pool.transactionExists = transactionExists;
    //     });

    //     it("should accept transaction with correct network byte", () => {
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => false);

    //         const canApply = processor.pool.walletManager.canApply;
    //         processor.pool.walletManager.canApply = jest.fn(() => true);

    //         const tx = {
    //             id: "1",
    //             network: 23,
    //             type: Enums.TransactionTypes.Transfer,
    //             senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
    //             recipientId: "DEJHR83JFmGpXYkJiaqn7wPGztwjheLAmY",
    //         };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).not.toEqual([
    //             {
    //                 message: `Transaction network '${tx.network}' does not match '${Managers.configManager.get(
    //                     "pubKeyHash",
    //                 )}'`,
    //                 type: "ERR_WRONG_NETWORK",
    //             },
    //         ]);

    //         processor.pool.transactionExists = transactionExists;
    //         processor.pool.walletManager.canApply = canApply;
    //     });

    //     it("should accept transaction with missing network byte", () => {
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => false);

    //         const canApply = processor.pool.walletManager.canApply;
    //         processor.pool.walletManager.canApply = jest.fn(() => true);

    //         const tx = {
    //             id: "1",
    //             type: Enums.TransactionTypes.Transfer,
    //             senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
    //             recipientId: "DEJHR83JFmGpXYkJiaqn7wPGztwjheLAmY",
    //         };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id].type).not.toEqual("ERR_WRONG_NETWORK");

    //         processor.pool.transactionExists = transactionExists;
    //         processor.pool.walletManager.canApply = canApply;
    //     });

    //     it("should not accept transaction with wrong network byte", () => {
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => false);

    //         const canApply = processor.pool.walletManager.canApply;
    //         processor.pool.walletManager.canApply = jest.fn(() => true);

    //         const tx = {
    //             id: "1",
    //             network: 2,
    //             senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
    //         };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).toEqual([
    //             {
    //                 message: `Transaction network '${tx.network}' does not match '${Managers.configManager.get(
    //                     "pubKeyHash",
    //                 )}'`,
    //                 type: "ERR_WRONG_NETWORK",
    //             },
    //         ]);

    //         processor.pool.transactionExists = transactionExists;
    //         processor.pool.walletManager.canApply = canApply;
    //     });

    //     it("should not accept transaction if pool hasExceededMaxTransactions and add it to excess", () => {
    //         const transactions = TransactionFactory.transfer(wallets[11].address, 35)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .create(3);

    //         jest.spyOn(processor.pool, "hasExceededMaxTransactions").mockImplementationOnce(tx => true);

    //         processor.__filterAndTransformTransactions(transactions);

    //         expect(processor.excess).toEqual([transactions[0].id]);
    //         expect(processor.accept).toEqual(new Map());
    //         expect(processor.broadcast).toEqual(new Map());
    //     });

    //     it("should push a ERR_UNKNOWN error if something threw in validated transaction block", () => {
    //         const transactions = TransactionFactory.transfer(wallets[11].address, 35)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .build(3);

    //         // use processor.accept.set() call to introduce a throw
    //         jest.spyOn(processor.pool.walletManager, "canApply").mockImplementationOnce(() => {
    //             throw new Error("hey");
    //         });

    //         processor.__filterAndTransformTransactions(transactions.map(tx => tx.data));

    //         expect(processor.accept).toEqual(new Map());
    //         expect(processor.broadcast).toEqual(new Map());
    //         expect(processor.errors[transactions[0].id]).toEqual([
    //             {
    //                 message: `hey`,
    //                 type: "ERR_UNKNOWN",
    //             },
    //         ]);
    //     });
    // });

    // describe("__validateTransaction", () => {
    //     it("should not validate when recipient is not on the same network", async () => {
    //         const transactions = TransactionFactory.transfer("DEJHR83JFmGpXYkJiaqn7wPGztwjheLAmY", 35)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .create(3);

    //         expect(processor.__validateTransaction(transactions[0])).toBeFalse();
    //         expect(processor.errors).toEqual({
    //             [transactions[0].id]: [
    //                 {
    //                     type: "ERR_INVALID_RECIPIENT",
    //                     message: `Recipient ${
    //                         transactions[0].recipientId
    //                     } is not on the same network: ${Managers.configManager.get("network.pubKeyHash")}`,
    //                 },
    //             ],
    //         });
    //     });

    //     it("should not validate a delegate registration if an existing registration for the same username from a different wallet exists in the pool", async () => {
    //         const delegateRegistrations = [
    //             TransactionFactory.delegateRegistration("test_delegate")
    //                 .withNetwork("unitnet")
    //                 .withPassphrase(wallets[16].passphrase)
    //                 .build()[0],
    //             TransactionFactory.delegateRegistration("test_delegate")
    //                 .withNetwork("unitnet")
    //                 .withPassphrase(wallets[17].passphrase)
    //                 .build()[0],
    //         ];
    //         const memPoolTx = new MemPoolTransaction(delegateRegistrations[0]);
    //         jest.spyOn(processor.pool, "getTransactionsByType").mockReturnValueOnce(new Set([memPoolTx]));

    //         expect(processor.__validateTransaction(delegateRegistrations[1].data)).toBeFalse();
    //         expect(processor.errors[delegateRegistrations[1].id]).toEqual([
    //             {
    //                 type: "ERR_PENDING",
    //                 message: `Delegate registration for "${
    //                     delegateRegistrations[1].data.asset.delegate.username
    //                 }" already in the pool`,
    //             },
    //         ]);
    //     });

    //     it("should not validate when sender has same type transactions in the pool (only for 2nd sig, delegate registration, vote)", async () => {
    //         jest.spyOn(processor.pool.walletManager, "canApply").mockImplementation(() => true);
    //         jest.spyOn(processor.pool, "senderHasTransactionsOfType").mockReturnValue(true);
    //         const vote = TransactionFactory.vote(delegates[0].publicKey)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .build()[0];

    //         const delegateReg = TransactionFactory.delegateRegistration()
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[11].passphrase)
    //             .build()[0];

    //         const signature = TransactionFactory.secondSignature(wallets[12].passphrase)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[12].passphrase)
    //             .build()[0];

    //         for (const tx of [vote, delegateReg, signature]) {
    //             expect(processor.__validateTransaction(tx.data)).toBeFalse();
    //             expect(processor.errors[tx.id]).toEqual([
    //                 {
    //                     type: "ERR_PENDING",
    //                     message:
    //                         `Sender ${tx.data.senderPublicKey} already has a transaction of type ` +
    //                         `'${Enums.TransactionTypes[tx.type]}' in the pool`,
    //                 },
    //             ]);
    //         }

    //         jest.restoreAllMocks();
    //     });

    //     it("should not validate unsupported transaction types", async () => {
    //         jest.spyOn(processor.pool.walletManager, "canApply").mockImplementation(() => true);

    //         // use a random transaction as a base - then play with type
    //         const baseTransaction = TransactionFactory.delegateRegistration()
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[11].passphrase)
    //             .build()[0];

    //         for (const transactionType of [
    //             Enums.TransactionTypes.MultiSignature,
    //             Enums.TransactionTypes.Ipfs,
    //             Enums.TransactionTypes.TimelockTransfer,
    //             Enums.TransactionTypes.MultiPayment,
    //             Enums.TransactionTypes.DelegateResignation,
    //             99,
    //         ]) {
    //             baseTransaction.data.type = transactionType;
    //             // @FIXME: Uhm excuse me, what the?
    //             // @ts-ignore
    //             baseTransaction.data.id = transactionType;

    //             expect(processor.__validateTransaction(baseTransaction)).toBeFalse();
    //             expect(processor.errors[baseTransaction.id]).toEqual([
    //                 {
    //                     type: "ERR_UNSUPPORTED",
    //                     message: `Invalidating transaction of unsupported type '${
    //                         Enums.TransactionTypes[transactionType]
    //                     }'`,
    //                 },
    //             ]);
    //         }

    //         jest.restoreAllMocks();
    //     });
    // it("should not validate a transaction if a second signature registration for the same wallet exists in the pool", async () => {
    //     const secondSignatureTransaction = TransactionFactory.secondSignature()
    //         .withNetwork("unitnet")
    //         .withPassphrase(wallets[16].passphrase)
    //         .build()[0];

    //     const transferTransaction = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
    //         .withNetwork("unitnet")
    //         .withPassphrase(wallets[16].passphrase)
    //         .withSecondPassphrase(wallets[17].passphrase)
    //         .build()[0];

    //     const memPoolTx = new MemPoolTransaction(secondSignatureTransaction);
    //     jest.spyOn(guard.pool, "senderHasTransactionsOfType").mockReturnValueOnce(true);

    //     expect(guard.__validateTransaction(transferTransaction.data)).toBeFalse();
    //     expect(guard.errors[transferTransaction.id]).toEqual([
    //         {
    //             type: "ERR_PENDING",
    //             message: `Cannot accept transaction from sender ${
    //                 transferTransaction.data.senderPublicKey
    //                 } while its second signature registration is in the pool`,
    //         },
    //     ]);
    // });
    // });

    // describe("__removeForgedTransactions", () => {
    //     it("should remove forged transactions", async () => {
    //         const transfers = TransactionFactory.transfer(delegates[0].senderPublicKey)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .build(4);

    //         transfers.forEach(tx => {
    //             processor.accept.set(tx.id, tx);
    //             processor.broadcast.set(tx.id, tx);
    //         });

    //         const forgedTx = transfers[2];
    //         jest.spyOn(database, "getForgedTransactionsIds").mockReturnValueOnce([forgedTx.id]);

    //         await processor.__removeForgedTransactions();

    //         expect(processor.accept.size).toBe(3);
    //         expect(processor.broadcast.size).toBe(3);

    //         expect(processor.errors[forgedTx.id]).toHaveLength(1);
    //         expect(processor.errors[forgedTx.id][0].type).toEqual("ERR_FORGED");
    //     });
    // });

    // describe("__addTransactionsToPool", () => {
    //     it("should add transactions to the pool", () => {
    //         const transfers = TransactionFactory.transfer(delegates[0].senderPublicKey)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .create(4);

    //         transfers.forEach(tx => {
    //             processor.accept.set(tx.id, tx);
    //             processor.broadcast.set(tx.id, tx);
    //         });

    //         expect(processor.errors).toEqual({});
    //         jest.spyOn(processor.pool, "addTransactions").mockReturnValueOnce({ added: transfers, notAdded: [] });

    //         processor.__addTransactionsToPool();

    //         expect(processor.errors).toEqual({});
    //         expect(processor.accept.size).toBe(4);
    //         expect(processor.broadcast.size).toBe(4);
    //     });

    //     it("should delete from accept and broadcast transactions that were not added to the pool", () => {
    //         const added = TransactionFactory.transfer(delegates[0].address)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .build(2);
    //         const notAddedError = { type: "ERR_TEST", message: "" };
    //         const notAdded = TransactionFactory.transfer(delegates[1].address)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .build(2)
    //             .map(tx => ({
    //                 transaction: tx,
    //                 ...notAddedError,
    //             }));

    //         added.forEach(tx => {
    //             processor.accept.set(tx.id, tx);
    //             processor.broadcast.set(tx.id, tx);
    //         });
    //         notAdded.forEach(tx => {
    //             processor.accept.set(tx.transaction.id, tx);
    //             processor.broadcast.set(tx.transaction.id, tx);
    //         });

    //         jest.spyOn(processor.pool, "addTransactions").mockReturnValueOnce({ added, notAdded });
    //         processor.__addTransactionsToPool();

    //         expect(processor.accept.size).toBe(2);
    //         expect(processor.broadcast.size).toBe(2);

    //         expect(processor.errors[notAdded[0].transaction.id]).toEqual([notAddedError]);
    //         expect(processor.errors[notAdded[1].transaction.id]).toEqual([notAddedError]);
    //     });

    //     it("should delete from accept but keep in broadcast transactions that were not added to the pool because of ERR_POOL_FULL", () => {
    //         const added = TransactionFactory.transfer(delegates[0].address)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .build(2);

    //         const notAddedError = { type: "ERR_POOL_FULL", message: "" };
    //         const notAdded = TransactionFactory.transfer(delegates[1].address)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .build(2)
    //             .map(tx => ({
    //                 transaction: tx,
    //                 ...notAddedError,
    //             }));

    //         added.forEach(tx => {
    //             processor.accept.set(tx.id, tx);
    //             processor.broadcast.set(tx.id, tx);
    //         });
    //         notAdded.forEach(tx => {
    //             processor.accept.set(tx.transaction.id, tx);
    //             processor.broadcast.set(tx.transaction.id, tx);
    //         });

    //         jest.spyOn(processor.pool, "addTransactions").mockReturnValueOnce({ added, notAdded });
    //         processor.__addTransactionsToPool();

    //         expect(processor.accept.size).toBe(2);
    //         expect(processor.broadcast.size).toBe(4);

    //         expect(processor.errors[notAdded[0].transaction.id]).toEqual([notAddedError]);
    //         expect(processor.errors[notAdded[1].transaction.id]).toEqual([notAddedError]);
    //     });
    // });

    // describe("pushError", () => {
    //     it("should have error for transaction", () => {
    //         expect(processor.errors).toBeEmpty();

    //         processor.pushError({ id: 1 }, "ERR_INVALID", "Invalid.");

    //         expect(processor.errors).toBeObject();
    //         expect(processor.errors["1"]).toBeArray();
    //         expect(processor.errors["1"]).toHaveLength(1);
    //         expect(processor.errors["1"]).toEqual([{ message: "Invalid.", type: "ERR_INVALID" }]);

    //         expect(processor.invalid.size).toEqual(1);
    //         expect(processor.invalid.entries().next().value[1]).toEqual({ id: 1 });
    //     });

    //     it("should have multiple errors for transaction", () => {
    //         expect(processor.errors).toBeEmpty();

    //         processor.pushError({ id: 1 }, "ERR_INVALID", "Invalid 1.");
    //         processor.pushError({ id: 1 }, "ERR_INVALID", "Invalid 2.");

    //         expect(processor.errors).toBeObject();
    //         expect(processor.errors["1"]).toBeArray();
    //         expect(processor.errors["1"]).toHaveLength(2);
    //         expect(processor.errors["1"]).toEqual([
    //             { message: "Invalid 1.", type: "ERR_INVALID" },
    //             { message: "Invalid 2.", type: "ERR_INVALID" },
    //         ]);

    //         expect(processor.invalid.size).toEqual(1);
    //         expect(processor.invalid.entries().next().value[1]).toEqual({ id: 1 });
    //     });
    // });
});
