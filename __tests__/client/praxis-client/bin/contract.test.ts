#!/usr/bin/env node

import Client from "@arkecosystem/client";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { ContractStartBuilder, SaveTemplateBuilder } from "@incentum/praxis-client";
import {
    ActionJson,
    ContractStartPayload,
    createActionJson,
    hashJson,
    hashString,
    random,
    SaveTemplatePayload,
    TemplateJson,
} from "@incentum/praxis-interfaces";

import { testnetSecrets } from "./secrets";

beforeAll(async () => {
    return;
});

afterAll(async () => {
    return;
});

const getTemplate = (ledger: string): TemplateJson => {
    return {
        ledger,
        name: "test",
        versionMajor: 1,
        versionMinor: 0,
        versionPatch: 0,
        description: "description",
        reducers: [],
        other: {},
        tags: [],
    };
};

describe("Praxis Client Transactions", () => {
    it("saveTemplate Transaction", async () => {
        Managers.configManager.setFromPreset("testnet");
        const testnetClient = new Client("http://0.0.0.0:4003", 2); // (API URL, API version)
        const secret = testnetSecrets[0];
        const ledger: string = Identities.Address.fromPassphrase(secret);

        const template = getTemplate(ledger);
        const payload = {
            template,
        } as SaveTemplatePayload;

        const fee = new Utils.BigNumber(500000000);
        const builder = new SaveTemplateBuilder(fee);
        const transaction = builder
            .saveTemplate(payload)
            .sign(secret)
            .getStruct();

        console.log("transaction", transaction);

        try {
            const response = await testnetClient.resource("transactions").create({ transactions: [transaction] });
            console.log(response.data.errors);
        } catch (error) {
            console.error("error", error);
        }
    });

    it("startContract Transaction", async () => {
        Managers.configManager.setFromPreset("testnet");
        const testnetClient = new Client("http://0.0.0.0:4003", 2); // (API URL, API version)
        const secret = testnetSecrets[0];
        const ledger: string = Identities.Address.fromPassphrase(secret);
        const template = getTemplate(ledger);
        const contractHash = hashJson(template);

        const action: ActionJson = createActionJson(ledger, contractHash);

        const payload: ContractStartPayload = {
            action,
            initialState: {},
        };

        const fee = new Utils.BigNumber(500000000);
        const builder = new ContractStartBuilder(fee);
        const transaction = builder
            .contractStart(payload)
            .sign(secret)
            .getStruct();

        console.log("transaction", transaction);

        try {
            const response = await testnetClient.resource("transactions").create({ transactions: [transaction] });
            console.log(response.data.errors);
        } catch (error) {
            console.error("error", error);
        }
    });
});
