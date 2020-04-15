const CryptoJS = require("crypto-js");
const { rpc, contract } = require('./config.js');
const tq = require('@taquito/taquito');
const { MichelsonMap } = require('@taquito/michelson-encoder');
const conseiljs = require('conseiljs');
tq.Tezos.setProvider({ rpc: rpc });


function prepareItemsData(items) {

    items = JSON.parse(JSON.stringify(items));

    var new_items = {};

    for (const item of items) {

        const uid = CryptoJS.SHA256(item.name.toLowerCase() + item.ean_code.toLowerCase()).toString();

        delete item.name;
        delete item.ean_code;

        for (const i in item) {
            item[i] = CryptoJS.SHA256(item[i].toLowerCase()).toString();
        }

        new_items[uid] = MichelsonMap.fromLiteral(item);
    }

    return MichelsonMap.fromLiteral(new_items);

}

async function addItems(certifier_id, certifier_key, items) {

    /**
     * This is the function to add items to the smart contract.
     * 
     * @param certifier_id -> unique id of certifier
     * @param certifier_key -> current private key of certifier
     * @param items -> a list of items to be registered
     * 
     * Example
     * =======
     * 
     * addItems('cert1', 'edxxxxprivatekey', [{name:'xxx', ean_code:'xxx', 'expiry':'xxx'}, {name:'xxx', ean_code:'xxx', 'expiry':'xxx'}])
     */

    tq.Tezos.importKey(certifier_key);

    const data = prepareItemsData(items);

    try {
        const c = await tq.Tezos.contract.at(contract);

        const invokeOP = await c.methods.add_items(certifier_id, data).send();

        await invokeOP.confirmation(1);

        console.log(invokeOP.hash);
        
        return invokeOP.hash;

    } catch (error) {
        console.log(error);
        return;
    }

}

async function verifyItem(item){

    /**
     * Use this function to verify if item exists
     * 
     * @param item -> item data for instance  item = { name: 'item3 name hash',
     *                                         lot_number: 'item3 lot', ean_code: '221D',
     *                                         expiration_date: '2050-01-01' }
     * 
     */

    try {
        const itemHash = CryptoJS.SHA256(item.name.toLowerCase() + item.ean_code.toLowerCase()).toString();
        const c = await tq.Tezos.contract.at(contract);

        const s = await c.storage();

        const product = await s.products.get(itemHash);

        return product;
    } catch (error) {
        console.log(error);
        return;
    }
}


async function validateCredentials(certifier_id, certifier_key){

    /**
     * This function takes the id and private key of certifier and checks if 
     * the certifier is registered.
     * 
     * @param certifier_id -> id of certifier
     * @param certifier_key -> private key of certifier
     * 
     * The function returns true or false
     */

    var keystore;
    
     try{

        keystore = await conseiljs.TezosWalletUtil.restoreIdentityWithSecretKey(certifier_key);

        console.log(keystore);

     } catch(error){
        console.log(error);

        return false;
     }

    const c = await tq.Tezos.contract.at(contract);

    const s = await c.storage();

    try {
        const pkh = s.certifiers.get(certifier_id);
        
        if (pkh != keystore.publicKeyHash) {
            return false;
        }
        
    } catch (error) {
        console.log(error);

        return false;
    }

     return true;
}


module.exports = {
    addItems: addItems,
    verifyItem: verifyItem,
    validateCredentials: validateCredentials
}

