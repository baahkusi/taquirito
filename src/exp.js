const Random = require('random-js');
const CryptoJS = require("crypto-js");
const blake = require('blakejs');
const convert = (from, to) => str => Buffer.from(str, from).toString(to);
const utf8ToHex = convert('utf8', 'hex');
const hexToUtf8 = convert('hex', 'utf8');
const network = 'carthagenet';
const tezosNode = `https://tezos-dev.cryptonomic-infra.tech/`;
const conseilServer = {
  url: 'https://conseil-dev.cryptonomic-infra.tech:443',
  apiKey: 'galleon',
  network: network
};
const conseil = require('conseiljs');
const contract = require('./contract');

function encryptData(dataStr, pKey, hex = false) {
  var cipher = CryptoJS.AES.encrypt(dataStr, pKey).toString();

  if (!hex) {
    return cipher;
  }

  return utf8ToHex(cipher);

};

function decryptData(dataCipher, pKey) {
  console.log(dataCipher.toString(CryptoJS.enc.Utf8));

  const dataStr = CryptoJS.AES.decrypt(dataCipher, pKey).toString(CryptoJS.enc.Utf8);
  return JSON.parse(dataStr);
};

function getKTAddress() {
  return localStorage.getItem('KTAddress');
};

function setKTAddress(KTAddress) {
  return localStorage.setItem('KTAddress', KTAddress);
};

function generateProof (private_key, nonce, hash = false) {

  // if we are hashing (hash == true) then we use utf string
  // if we are creating proof (hash == false) we return hex of proof

  // the order is important
  const iv = CryptoJS.enc.Base64.parse(nonce);
  private_key = CryptoJS.enc.Utf8.parse(private_key);
  const proof = CryptoJS.AES.encrypt(nonce, private_key, { iv: iv }).toString();

  if (hash) {
    return '0x' + blake.blake2bHex(proof, null, 32);
  }

  return '0x' + utf8ToHex(proof);

}

async function deployContract(initialNonce, initialHashedProof, michelson = false) {

  const keystore = {
    publicKey: contract.credentials[network].publicKey,
    privateKey: contract.credentials[network].privateKey,
    publicKeyHash: contract.credentials[network].publicKeyHash,
    seed: '',
    StoreType: conseil.StoreType.Fundraiser
  };

  const fee = Number((await conseil.TezosConseilClient.getFeeStatistics(conseilServer, network, conseil.OperationKindType.Origination))[0]['high']);

  var nodeResult;

  if (michelson) {
    const contract = contract.SecretStoreMichelson;

    const storage = contract.SecretStoreStorageMichelson(initialNonce, initialHashedProof);

    nodeResult = await conseil.TezosNodeWriter.sendContractOriginationOperation(tezosNode, keystore, 0, undefined,
      fee, '', 1000, 100000, contract,
      storage, conseil.TezosParameterFormat.Michelson);
  } else {
    const contract = JSON.stringify(contract.SecretStore);

    const storage = JSON.stringify(contract.SecretStoreStorage(initialNonce, initialHashedProof));

    nodeResult = await conseil.TezosNodeWriter.sendContractOriginationOperation(tezosNode, keystore, 0, undefined,
      fee, '', 1000, 100000, contract,
      storage, conseil.TezosParameterFormat.Micheline);
  }

  const reg1 = /"/g;
  const reg2 = /\n/;
  const groupid = nodeResult['operationGroupID'].replace(reg1, '').replace(reg2, ''); // clean up RPC output
  const conseilResult = await conseil.TezosConseilClient.awaitOperationConfirmation(conseilServer, network, groupid, 5);
  return conseilResult;
}

async function invokeContract(KTAddress, params, michelson = false) {
  const keystore = {
    publicKey: contract.credentials[network].publicKey,
    privateKey: contract.credentials[network].privateKey,
    publicKeyHash: contract.credentials[network].publicKeyHash,
    seed: '',
    StoreType: conseil.StoreType.Fundraiser
  };

  var nodeResult;
  if (michelson) {
    
    try {
      const args = `(Pair (Pair ${params.encryptedData} ${params.hashedProof}) ${params.proof})`;
      nodeResult = await conseil.TezosNodeWriter.sendContractInvocationOperation(tezosNode, keystore, KTAddress,
        10000, 100000, '', 1000, 100000,
        undefined, JSON.stringify(args), conseil.TezosParameterFormat.Michelson);
    } catch (error) {
      console.log(error);
      return;
    }
    
  } else {

    try {
      const args = { "prim": "Pair", "args": [{ "prim": "Pair", "args": [{ "string": params.encryptedData }, { "bytes": params.hashedProof.replace('0x', '') }] }, { "bytes": params.proof.replace('0x', '') }] };
      nodeResult = await conseil.TezosNodeWriter.sendContractInvocationOperation(tezosNode, keystore, KTAddress,
        10000, 100000, '', 1000, 100000,
        undefined, JSON.stringify(args), conseil.TezosParameterFormat.Micheline);
    } catch (error) {
      console.log(error);
      return;
    }

  }

  const reg1 = /"/g;
  const reg2 = /\n/;
  const groupid = nodeResult['operationGroupID'].replace(reg1, '').replace(reg2, ''); // clean up RPC output
  const conseilResult = await conseil.TezosConseilClient.awaitOperationConfirmation(conseilServer, network, groupid, 5);
  return conseilResult;
}


async function getStorage(KTAddress) {
  const entity = 'accounts';
  const platform = 'tezos';
  var accountQuery = conseil.ConseilQueryBuilder.blankQuery();
  accountQuery = conseil.ConseilQueryBuilder.addFields(accountQuery, 'storage');
  accountQuery = conseil.ConseilQueryBuilder.addPredicate(accountQuery, 'account_id', conseil.ConseilOperator.EQ, [KTAddress], false);
  accountQuery = conseil.ConseilQueryBuilder.setLimit(accountQuery, 1);

  var result;
  try {
    result = await conseil.ConseilDataClient.executeEntityQuery(conseilServer, platform, network, entity, accountQuery);
  } catch (error) {
    console.log(error);
    return;
  }

  console.log(result[0]);

  return result[0];
}

async function getSecrets (KTAddress) {
  const storage = await getStorage(KTAddress);
  const result = storage.storage.split(' ');

  const start = result.indexOf('{') + 1;
  const end = result.indexOf('}');

  const secrets = result.slice(start, end).join('');
  console.log(secrets.split(';'));
  return secrets.split(';').map((secret) => hexToUtf8(secret.slice(1, -1)));
}


async function getCurrentNonce(KTAddress) {

  const storage = await getStorage(KTAddress);

  const result = storage.storage.split(' ');

  const nonce = Number(result[result.length - 1]);

  return nonce;
}


function randInt () {
  const random = new Random(); // uses the nativeMath engine
  return random.integer(1, 2 ** 32);
}

