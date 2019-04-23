import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(60000);

export async function setUp() {
    return setUpContainer({ exit: "@arkecosystem/core-blockchain" });
}

export async function tearDown(): Promise<void> {
    await app.tearDown();
}
