const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    rpc: process.env.RPC_NODE,
    manager: process.env.MANAGER_SECRET_KEY,
    contract: process.env.CONTRACT_ADDRESS
}
