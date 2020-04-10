const tq = require('@taquito/taquito');
tq.Tezos.setProvider({rpc: 'https://carthagenet.smartpy.io'})

async function invoke(){

try{
const c = await tq.Tezos.contract.at('KT1TgSfmnMDcduArGR6bwqkRDwNFDgJQLzHX');
const s = await c.storage();
console.log(s);
return s;
}catch(error){
console.log(error)
}
}

invoke();
exports.contract = invoke;
