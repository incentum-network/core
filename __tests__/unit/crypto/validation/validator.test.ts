import "jest-extended";

import ajv from "ajv";
import { configManager } from "../../../../packages/crypto/src/managers";
import { TransactionTypeFactory } from "../../../../packages/crypto/src/transactions";
import { TransactionSchema } from "../../../../packages/crypto/src/transactions/types/schemas";
import { validator } from "../../../../packages/crypto/src/validation";
import { block2, genesisBlock } from "../../../utils/fixtures/unitnet/blocks";

describe("validator", () => {
    describe("validate", () => {
        describe("publicKey", () => {
            it("should be ok", () => {
                expect(
                    validator.validate(
                        "publicKey",
                        "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(
                    validator.validate(
                        "publicKey",
                        "Z34da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeUndefined();
                expect(
                    validator.validate("publicKey", "34da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126")
                        .error,
                ).not.toBeUndefined();
                expect(validator.validate("publicKey", "").error).not.toBeUndefined();
                expect(validator.validate("publicKey", 1234).error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("publicKey", null).error).not.toBeUndefined();
                expect(validator.validate("publicKey", undefined).error).not.toBeUndefined();
            });
        });

        describe("address", () => {
            it("should be ok", () => {
                expect(validator.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).toBeUndefined();
            });

            it("should not validate if address is not on the same network", () => {
                configManager.setFromPreset("unitnet");
                expect(validator.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).not.toBeUndefined();
            });

            it("should not be ok", () => {
                expect(validator.validate("address", "€TRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).not.toBeUndefined();
                expect(validator.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9").error).not.toBeUndefined();
                expect(
                    validator.validate("address", "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126")
                        .error,
                ).not.toBeUndefined();
                expect(validator.validate("address", "").error).not.toBeUndefined();
                expect(validator.validate("address", 1234).error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("address", null).error).not.toBeUndefined();
                expect(validator.validate("address", undefined).error).not.toBeUndefined();
            });
        });

        describe("hex", () => {
            it("should be ok", () => {
                expect(validator.validate("hex", "deadbeef").error).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(validator.validate("hex", "€").error).not.toBeUndefined();
                expect(validator.validate("hex", 1).error).not.toBeUndefined();
                expect(validator.validate("hex", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("hex", null).error).not.toBeUndefined();
                expect(validator.validate("hex", undefined).error).not.toBeUndefined();
            });
        });

        describe("base58", () => {
            it("should be ok", () => {
                expect(validator.validate("base58", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9").error).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(validator.validate("base58", "€").error).not.toBeUndefined();
                expect(validator.validate("base58", 1).error).not.toBeUndefined();
                expect(validator.validate("base58", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("base58", null).error).not.toBeUndefined();
                expect(validator.validate("base58", undefined).error).not.toBeUndefined();
            });
        });

        describe("alphanumeric", () => {
            it("should be ok", () => {
                expect(validator.validate("alphanumeric", "abcDE1234").error).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(validator.validate("alphanumeric", "+12").error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", ".1").error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", "1.0").error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", "€").error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", 1).error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("alphanumeric", null).error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", undefined).error).not.toBeUndefined();
            });
        });

        describe("transactionId", () => {
            it("should be ok", () => {
                expect(
                    validator.validate(
                        "transactionId",
                        "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                    ).error,
                ).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(
                    validator.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                    ).error,
                ).not.toBeUndefined();
                expect(
                    validator.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4111",
                    ).error,
                ).not.toBeUndefined();
                expect(
                    validator.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4@@@",
                    ).error,
                ).not.toBeUndefined();
                expect(validator.validate("transactionId", 1).error).not.toBeUndefined();
                expect(validator.validate("transactionId", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("transactionId", null).error).not.toBeUndefined();
                expect(validator.validate("transactionId", undefined).error).not.toBeUndefined();
            });
        });

        describe("walletVote", () => {
            it("should be ok", () => {
                expect(
                    validator.validate(
                        "walletVote",
                        "+034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeUndefined();
                expect(
                    validator.validate(
                        "walletVote",
                        "-034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(
                    validator.validate(
                        "walletVote",
                        "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeUndefined();
                expect(validator.validate("walletVote", "-^sd").error).not.toBeUndefined();
                expect(validator.validate("walletVote", 1234).error).not.toBeUndefined();
                expect(validator.validate("walletVote", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("walletVote", null).error).not.toBeUndefined();
                expect(validator.validate("walletVote", undefined).error).not.toBeUndefined();
            });
        });

        describe("delegateUsername", () => {
            it("should be ok", () => {
                expect(validator.validate("delegateUsername", "asdf").error).toBeUndefined();
                expect(validator.validate("delegateUsername", "_").error).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(validator.validate("delegateUsername", "AbCdEfG").error).not.toBeUndefined();
                expect(
                    validator.validate("delegateUsername", "longerthantwentycharacterslong").error,
                ).not.toBeUndefined();
                expect(validator.validate("delegateUsername", 1234).error).not.toBeUndefined();
                expect(validator.validate("delegateUsername", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("delegateUsername", null).error).not.toBeUndefined();
                expect(validator.validate("delegateUsername", undefined).error).not.toBeUndefined();
            });
        });

        describe("block", () => {
            beforeAll(() => {
                TransactionTypeFactory.get(0); // Make sure registry is loaded, since it adds the "transactions" schema.
                configManager.setFromPreset("unitnet");
            });

            it("should be ok", () => {
                expect(validator.validate("block", block2).error).toBeUndefined();
                expect(validator.validate("block", genesisBlock).error).toBeUndefined();
            });

            it("should not be ok", () => {
                block2.numberOfTransactions = 1;
                expect(validator.validate("block", block2).error).not.toBeUndefined();
                block2.numberOfTransactions = 11;
                expect(validator.validate("block", block2).error).not.toBeUndefined();
                block2.numberOfTransactions = 10;
                expect(validator.validate("block", block2).error).toBeUndefined();
            });
        });
    });

    describe("extend", () => {
        it("should extend transaction schema", () => {
            const customTransactionSchema = { $id: "custom" } as TransactionSchema;
            validator.extendTransaction(customTransactionSchema);
            expect(validator.getInstance().getSchema("custom")).not.toBeUndefined();
        });
    });

    describe("instance", () => {
        it("should return the instance", () => {
            expect(validator.getInstance()).toBeInstanceOf(ajv);
        });
    });
});
