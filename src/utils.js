
const { rpc } = require('./config.js');



async function activateAccount(keystore) {
    keystore.storeType = conseiljs.StoreType.Fundraiser;
    try {
        const result = await conseiljs.TezosNodeWriter.sendIdentityActivationOperation(rpc, keystore, '');
        console.log(`Injected operation group id ${result.operationGroupID}`);
        return true
    } catch (error) {
        console.log(error);
        return;
    }
}

async function revealAccount(keystore) {
    try {
        const result = await conseiljs.TezosNodeWriter.sendKeyRevealOperation(rpc, keystore);
        console.log(`Injected operation group id ${result.operationGroupID}`);
        return true;
    } catch (error) {
        console.log(error);
        return;
    }
}

module.exports = {
    createAccount: createAccount
};
