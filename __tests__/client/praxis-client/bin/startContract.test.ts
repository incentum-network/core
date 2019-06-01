#!/usr/bin/env node

import Client from "@arkecosystem/client";
import { Utils } from "@arkecosystem/crypto";
import { ContractStartBuilder } from '@incentum/praxis-client';
import { ContractStartPayload } from "@incentum/praxis-interfaces";

const testnetSecrets = [
      "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
      "venue below waste gather spin cruise title still boost mother flash tuna",
      "craft imitate step mixture patch forest volcano business charge around girl confirm",
      "fatal hat sail asset chase barrel pluck bag approve coral slab bright",
      "flash thank strike stove grain remove match reflect excess present beyond matrix",
      "various present shine domain outdoor neck soup diesel limit express genuine tuna",
      "hurdle pulse sheriff anchor two hope income pattern hazard bacon book night",
      "glow boss party require silk interest pyramid marriage try wisdom snow grab",
      "direct palace screen shuffle world fit produce rubber jelly gather river ordinary",
      "wall ketchup shed word twist flip knock liar merge rural ill pond",
      "measure blue volcano month orphan only cupboard found laugh peasant drama monitor",
      "scissors sort pause medal target diesel reveal stock maze party gauge vacant",
      "hand anchor hip pyramid taxi vote celery clap tribe damage shrimp brave",
      "merge thunder detect stove else bottom favorite doll learn festival basic basic",
      "educate attitude rely combine treat balcony west reopen coil west grab depth",
      "advance silver advance squeeze load stone middle garden perfect invest field lounge",
      "prison tobacco acquire stone dignity palace note decade they current lesson robot",
      "team impact stadium year security steak harsh vacant fire pelican until olympic",
      "walk intact ice prevent fit trial frog glory monkey once grunt gentle",
      "same lens parrot suspect just sunset frown exercise lemon two mistake robust",
      "skill insect issue crazy erase okay govern upgrade bounce dress motor athlete",
      "peasant alert hard deposit naive follow page fiscal normal awful wedding history",
      "resemble abandon same total oppose noise dune order fatal rhythm pink science",
      "wide mesh ketchup acquire bright day mountain final below hamster scout drive",
      "half weasel poet better rocket fan help left blade soda argue system",
      "target sort neutral address language spike measure jaguar glance strong drop zone",
      "race total stage trap wool believe twin pudding claim claim eternal miss",
      "parade isolate wing vague magic husband acid skin skate path fence rib",
      "neither fine dry priority example obtain bread reopen afford coyote milk minor",
      "token atom lemon game charge area goose hotel excess endless spice oblige",
      "pledge buffalo finish pipe mule popular bind clinic draft salon swamp purpose",
      "west hat hold stand unique panther cable extend spell shaft injury reopen",
      "van impulse pole install profit excuse give auction expire remain skate input",
      "wrist maze potato april survey burden bamboo knee foot carry speak prison",
      "three toddler copy owner pencil minimum doctor orange bottom ice detail design",
      "ceiling warrior person thing whisper jeans black cricket drift ahead tornado typical",
      "obvious mutual tone usual valve credit soccer mention also clown main box",
      "valve slot soft green scale menu anxiety live drill legend upgrade chimney",
      "twist comfort mule weather print oven cabin seek punch rival prepare sphere",
      "say tumble glass argue aware service force caution until grocery hammer fetch",
      "idea illegal empty frozen canvas arctic number poet rely track size obscure",
      "chalk try large tower shed warfare blade clerk fame second charge tobacco",
      "category nice verb fox start able brass climb boss luggage voice whale",
      "favorite emotion trumpet visual welcome spend fine lock image review garage opera",
      "waste axis humor auction next salmon much margin useful glimpse insect rotate",
      "remember rose genuine police guard old flavor parent gain cross twelve first",
      "coil tray elder mask circle crush anger electric harbor onion grab will",
      "shove airport bus gather radio derive below horse canvas crime tribe adjust",
      "retire lend burden cricket able sheriff output grocery empty scorpion flat inquiry",
      "agree grain record shift fossil summer hunt mutual net vast behind pilot",
      "decide rhythm oyster lady they merry betray jelly coyote solve episode then"
  ];

beforeAll(async () => { 
  return 
});

afterAll(async () => {
  return
});

describe("Praxis Client Transactions", () => {
  it("startContract Transaction", async () => {
    const testnetClient = new Client("http://0.0.0.0:4003", 2); // (API URL, API version)

    const payload = {
      action: {},
      initialState: {}
    } as ContractStartPayload;
    
    const fee = new Utils.BigNumber(500000000);
    const builder = new ContractStartBuilder(fee)
    const transaction = builder
      .contractStart(payload)
        .vendorField("starting contract")
        .sign(testnetSecrets[0])
        .getStruct()
    
    console.log('transaction', transaction);
    
    try {
      const response = await testnetClient.resource("transactions").create({ transactions: [transaction] });
      console.log(response.data.errors);
    } catch (error) {
      console.error('error', error)
    }
  });
});
