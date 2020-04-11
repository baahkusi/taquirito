const conseiljs = require('conseiljs');
const { rpc } = require('./config.js');

async function createAccount() {
    const mnemonic = conseiljs.TezosWalletUtil.generateMnemonic();
    console.log(`mnemonic: ${mnemonic}`);
    try {
        const keystore = await conseiljs.TezosWalletUtil.unlockIdentityWithMnemonic(mnemonic, '0a09075426ab2658814c1faf101f53e5209a62f5');
        console.log(`account id: ${keystore.publicKeyHash}`);
        console.log(`public key: ${keystore.publicKey}`);
        console.log(`secret key: ${keystore.privateKey}`);

        return { keystore: keystore, mnemonic: mnemonic }
    } catch (error) {
        console.log(error);
        return;
    }

}

async function activateAccount(keystore) {
    keystore.storeType = conseiljs.StoreType.Fundraiser;
    try {
        const result = await conseiljs.TezosNodeWriter.sendIdentityActivationOperation(rpc, keystore, '0a09075426ab2658814c1faf101f53e5209a62f5');
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
    createAccount: createAccount,
    activateAccount: activateAccount,
    revealAccount: revealAccount
};
