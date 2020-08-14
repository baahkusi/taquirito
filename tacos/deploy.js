



async function deployContract() {

    const tq = require('@taquito/taquito');

    tq.Tezos.setProvider({ rpc: 'https://mainnet.smartpy.io' });

    const contract = require('./contracts/safechain.js');

    await tq.Tezos.importKey(contract.key);

    const originationOp = await tq.Tezos.contract.originate({
        code: contract.code,
        storage: contract.storage
    });

    const results = await originationOp.contract();

    console.log(results.address);
}

deployContract();
