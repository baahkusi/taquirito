const CryptoJS = require("crypto-js");
const tq = require('@taquito/taquito');
const { MichelsonMap } = require('@taquito/michelson-encoder');
const conseiljs = require('conseiljs');
const { rpc, manager, contract } = require('./config.js');

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

function prepareCertifiersData(certifiers){
    
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

    return certifiers;

}

async function registerLookup(item){
    /**
     * Use this function to keep track of how many times an item has been scanned.
     * 
     * 
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

module.exports = {
    registerLookup: registerLookup,
    updateCertifiers: updateCertifiers
};

