

const tq = require('@taquito/taquito');

tq.Tezos.setProvider({ rpc: "https://carthagenet.smartpy.io" });

tq.Tezos.importKey("edskS5YQ9xDuj2ZZX4XuB9zWsseeqyA6TUhRGfP9WJCZn5qdy7WFpxHj3GErV9pq1UiTN7TfLRxEcAPu2TDaTUJAB1KacxdxCn");

(async () => await tq.Tezos.contract.registerDelegate({}))();
