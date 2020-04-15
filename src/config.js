const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    rpc: process.env.RPC_NODE,
    manager: process.env.MANAGER_SECRET_KEY,
    contract: process.env.CONTRACT_ADDRESS,
    network: process.env.NETWORK,
    conseilServer: {
        url: 'https://conseil-dev.cryptonomic-infra.tech:443',
        apiKey: 'galleon',
        network: process.env.NETWORK
      }
}
