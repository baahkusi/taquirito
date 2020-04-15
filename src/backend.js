const CryptoJS = require("crypto-js");
const tq = require('@taquito/taquito');
const { MichelsonMap } = require('@taquito/michelson-encoder');
const conseiljs = require('conseiljs');
const { rpc, manager, contract, network, conseilServer } = require('./config.js');

const GAS_ALLOWANCE = 1;

tq.Tezos.setProvider({ rpc: rpc });
tq.Tezos.importKey(manager);

async function createAccount() {
    const mnemonic = conseiljs.TezosWalletUtil.generateMnemonic();
    try {
        const keystore = await conseiljs.TezosWalletUtil.unlockIdentityWithMnemonic(mnemonic, '');
        return { keystore: keystore, mnemonic: mnemonic }
    } catch (error) {
        console.log(error);
        return;
    }

}

async function transferTezToCertifiers(certfiers) {

    var faileds = [];

    for (const id in certfiers) {

        try {
            const res = await tq.Tezos.contract.transfer({ to: certfiers[id].publicKeyHash, amount: GAS_ALLOWANCE });

            await res.confirmation(1);
        } catch (error) {
            console.log(error);

            // if transfer failed, store id of certifier to be used again
            faileds.push(id);
        }

    }

    return faileds
}

async function generateCertifiers(certifier_ids) {
    var certifiers = {};

    for (cid of certifier_ids) {

        try {
            const account = await createAccount();

            certifiers[cid] = { publicKeyHash: account.keystore.publicKeyHash, privateKey: account.keystore.privateKey };
        } catch (error) {
            console.log(error);
            return;
        }
    }

    return certifiers;
}

function prepareCertifiersData(certifiers) {

    var data = {};
    for (const key in certifiers) {
        data[key.toString()] = certifiers[key].publicKeyHash;
    }

    return MichelsonMap.fromLiteral(data);
}

async function updateCertifiers(certifier_ids) {
    /**
     * 
     * This function takes in an array of certfiers IDs,
     * generates new tezos accounts for them and returns
     * a map of with ID as keys and mnemonic public
     * key hash as value.
     * 
     * Store the public key hash in database and then email the 
     * mnemonic to the certifiers.
     * 
     * The smart contract is also updated
     * 
     * Example
     * =======
     * 
     * input <- [ID1, 1D2, ID3, ...]
     * 
     * output <- {ID1: {publicKeyHash: "xxxxx",  privateKey: "xxxx"}}
     */

    // generate new identities for certifiers

    const certifiers = await generateCertifiers(certifier_ids);

    const data = prepareCertifiersData(certifiers);

    // store on smart contract

    const c = await tq.Tezos.contract.at(contract);

    const invokeOP = await c.methods.update_certifiers(data).send();

    await invokeOP.confirmation(2);

    // now that they've successfully been added, transfer some amount to their account to pay for gas

    await transferTezToCertifiers(certifiers);

    return certifiers;

}

async function registerLookup(item) {
    /**
     * Use this function to keep track of how many times an item has been scanned.
     * 
     * Example
     * =======
     * item = { name: 'item3 name hash', lot_number: 'item3 lot', ean_code: '221D', expiration_date: '2050-01-01', ... }
     * 
     * registerLookup(item)
     */
    try {

        const itemHash = CryptoJS.SHA256(item.name.toLowerCase() + item.ean_code.toLowerCase()).toString();

        const c = await tq.Tezos.contract.at(contract);

        const invokeOP = await c.methods.register_lookup(itemHash).send();

        await invokeOP.confirmation(1);

        return true;

    } catch (error) {
        console.log(error);
        return;
    }
}


async function checkOPCode(opcode) {
    /**
     * This function scans the blockchain to verify if the given opcode was recently created
     * 
     * @param opcode -> opcode returned from creating drugs
     * 
     * Example
     * ========
     * checkOPCode('oniwrhZZ4LJV52FBtE8965vJ3PEcMRM9QU1HiMsK8cE5KeLPJzs')
     */

    const entity = 'operations';
    const platform = 'tezos';
    var accountQuery = conseiljs.ConseilQueryBuilder.blankQuery();
    accountQuery = conseiljs.ConseilQueryBuilder.addPredicate(accountQuery, 'operation_group_hash', conseiljs.ConseilOperator.EQ, [opcode], false);
    accountQuery = conseiljs.ConseilQueryBuilder.setLimit(accountQuery, 1);

    var result;
    try {
        result = await conseiljs.ConseilDataClient.executeEntityQuery(conseilServer, platform, network, entity, accountQuery);

        if (result.length == 0) {
            return false;
        }
    } catch (error) {
        console.log(error);
        return false;
    }

    const now = Date.now();

    const diff = Math.floor((now - result[0].timestamp) / 1000);

    //   Must valid only within first 5 minutes
    console.log(diff <= 300);
    return diff <= 300;
}

checkOPCode('oniwrhZZ4LJV52FBtE8965vJ3PEcMRM9QU1HiMsK8cE5KeLPJzs');

module.exports = {
    registerLookup: registerLookup,
    updateCertifiers: updateCertifiers,
    checkOPCode: checkOPCode
};

