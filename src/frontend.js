const { rpc } = require('./config.js');
const tq = require('@taquito/taquito');
tq.Tezos.setProvider({ rpc:  rpc})


module.exports = {
    updateCertifiers: undefined,
    addItems: undefined,
    registerLookup: undefined,
    changeManager: undefined,
    verifyItem: undefined,
}

