const tq = require('@taquito/taquito');
const { createAccount, activateAccount, revealAccount } = require('./utils.js')
const { rpc, manager, contract } = require('./config.js');

console.log(rpc);

tq.Tezos.setProvider({ rpc: rpc });
tq.Tezos.importKey(manager);


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
     * output <- {ID1: {publicKeyHash: "xxxxx",  mnemonic: "xxxx"}}
     */

    // generate new identities for certifiers

    var certifiers = {};

    for (cid of certifier_ids) {

        try {
            const account = await createAccount();
            
            const activate = await activateAccount(account.keystore);
            
            if (!activate) {
                throw new Error(" Failled to activate account ...")
            }

            // const reveal = await revealAccount(account.keystore);

            // if(!reveal){
            //     throw new Error("Failed to reveal account ...")
            // }

            certifiers[cid] = { publicKeyHash: account.keystore.publicKeyHash, privateKey: account.keystore.privateKey };
        } catch (error) {
            console.log(error);
            return;
        }
    }

    // store on smart contract





    console.log(certifiers);

}

updateCertifiers([1, 2, 3]);


module.exports = {
    updateCertifiers: updateCertifiers
};

