#!/usr/bin/env node

import Client from "@arkecosystem/client";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { ContractStartBuilder, SaveTemplateBuilder } from "@incentum/praxis-client";
import {
    ActionJson,
    ContractStartPayload,
    createStartActionJson,
    hashJson,
    ReducerJson,
    SaveTemplatePayload,
    TemplateJson,
    toTemplateJson,
} from "@incentum/praxis-interfaces";

import { testnetSecrets } from "./secrets";

beforeAll(async () => {
    return;
});

afterAll(async () => {
    return;
});

const code = `
(
    $x.result($state, [])
)
`;

const startReducer: ReducerJson = {
    code,
    type: "start",
    language: "jsonata",
};

const getTemplate = (ledger: string): TemplateJson => {
    return {
        ledger,
        name: "test",
        versionMajor: 1,
        versionMinor: 0,
        versionPatch: 2,
        description: "description",
        other: {},
        tags: [],
        reducers: [startReducer],
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

        const to = toTemplateJson(template);
        console.log("to", to);
        const hash = hashJson(to);
        console.log("hash", hash);

        const fee = new Utils.BigNumber(500000000);
        const builder = new SaveTemplateBuilder(fee);
        const transaction = builder
            .saveTemplate(payload)
            .sign(secret)
            .getStruct();

        console.log("transaction", transaction);

        try {
            const response = await testnetClient.resource("transactions").create({ transactions: [transaction] });
            console.log(response.data);
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

        const action: ActionJson = createStartActionJson(ledger, template);

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
