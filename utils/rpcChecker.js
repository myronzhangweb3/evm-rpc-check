import axios from 'axios';
import { ethers } from 'ethers'; // Import ethers.js for signing transactions

export const rpcMethods = [
  'web3_clientVersion',
  'web3_sha3',
  'eth_syncing',
  'eth_gasPrice',
  'eth_maxPriorityFeePerGas',
  'eth_accounts',
  'eth_blockNumber',
  'eth_getBalance',
  'eth_getStorageAt',
  'eth_getTransactionCount',
  'eth_getBlockTransactionCountByHash',
  'eth_getBlockTransactionCountByNumber',
  'eth_getCode',
  'eth_sendRawTransaction',
  'eth_call',
  'eth_estimateGas',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getTransactionByHash',
  'eth_getTransactionByBlockHashAndIndex',
  'eth_getTransactionByBlockNumberAndIndex',
  'eth_getTransactionReceipt',
  'eth_getUncleByBlockHashAndIndex',
  'eth_getUncleByBlockNumberAndIndex',
  'eth_getFilterLogs',
  'eth_getFilterChanges',
  'eth_uninstallFilter',
  'eth_newFilter',
  'eth_newBlockFilter',
  'eth_newPendingTransactionFilter',
  'eth_getLogs',
  'debug_traceTransaction',
  'txpool_content',
  'trace_filter',
  'trace_block',
];

export const checkRpcMethods = async (rpcUrl, updateConsole) => {
  const availableMethods = [];

  const rpcRequest = async (method, params) => {
    const response = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    }, {
      timeout: 3000 // Set timeout to 3 seconds
    });
    return response;
  };

  // Get chainId from the RPC
  const chainIdResponse = await rpcRequest("eth_chainId", []);
  const chainId = parseInt(chainIdResponse.data.result, 16);
  updateConsole(`chainId: ${chainId}`);

  // Generate a random private key and sign a transaction
  const wallet = ethers.Wallet.createRandom();
  const rawTransaction = await wallet.signTransaction({
    to: '0x0000000000000000000000000000000000000000',
    value: ethers.parseEther('0.01'),
    gasLimit: 21000,
    gasPrice: ethers.parseUnits('10', 'gwei'),
    nonce: 0,
    chainId: chainId
  });
  updateConsole(`rawTransaction: ${rawTransaction}`);

  // block hash and tx hash
  let block, blockHash, txHash;
  let blockNumber = await rpcRequest("eth_blockNumber", []);
  blockNumber = parseInt(blockNumber.data.result, 16);
  while (blockNumber >= 0) {
    updateConsole(`query txhash from blockNumber: ${blockNumber}`);
    block = await rpcRequest("eth_getBlockByNumber", ["0x"+blockNumber.toString(16), true]);
    if (block.data.result.transactions.length > 0) {
      blockHash = block.data.result.hash;
      txHash = block.data.result.transactions[0].hash;
      availableMethods.push("eth_blockNumber");
      availableMethods.push("eth_getBlockByNumber");
      updateConsole(`blockHash: ${blockHash}`);
      updateConsole(`txHash: ${txHash}`);
      break;
    }
    blockNumber--;
  }

  // filter id
  const newFilter = await rpcRequest("eth_newFilter", [{ fromBlock: 'latest', toBlock: 'latest', address: '0x0000000000000000000000000000000000000000', topics: [] }]);
  const filterId = newFilter.data.result;
  availableMethods.push("eth_newFilter");
  updateConsole(`filterId: ${filterId}`);

  const methodParams = {
    'web3_sha3': ['0x68656c6c6f20776f726c64'], // Example input: "hello world" in hex
    'eth_getBalance': ['0x0000000000000000000000000000000000000000', 'latest'],
    'eth_getStorageAt': ['0x0000000000000000000000000000000000000000', '0x0', 'latest'],
    'eth_getTransactionCount': ['0x0000000000000000000000000000000000000000', 'latest'],
    'eth_getBlockTransactionCountByHash': [blockHash],
    'eth_getBlockTransactionCountByNumber': ['latest'],
    'eth_getCode': ['0x0000000000000000000000000000000000000000', 'latest'],
    'eth_sendRawTransaction': [rawTransaction], // Use the signed transaction
    'eth_call': [{ to: '0x0000000000000000000000000000000000000000', data: '0x' }, 'latest'],
    'eth_estimateGas': [{ to: '0x0000000000000000000000000000000000000000', data: '0x' }],
    'eth_getBlockByHash': [blockHash, true],
    'eth_getBlockByNumber': ['latest', true],
    'eth_getTransactionByHash': [txHash],
    'eth_getTransactionByBlockHashAndIndex': [blockHash, '0x0'],
    'eth_getTransactionByBlockNumberAndIndex': ['latest', '0x0'],
    'eth_getTransactionReceipt': [txHash],
    'eth_getUncleByBlockHashAndIndex': [blockHash, '0x0'],
    'eth_getUncleByBlockNumberAndIndex': ['latest', '0x0'],
    'eth_newFilter': [{ fromBlock: 'latest', toBlock: 'latest', address: '0x0000000000000000000000000000000000000000', topics: [] }],
    'eth_newPendingTransactionFilter': [],
    'eth_uninstallFilter': [filterId],
    'eth_getFilterChanges': [filterId],
    'eth_getFilterLogs': [filterId],
    'eth_getLogs': [{ fromBlock: 'latest', address: '0x0000000000000000000000000000000000000000', topics: [] }],
    'debug_traceTransaction': [txHash, {}],
    'trace_filter': [{ fromBlock: "latest", toBlock: "latest", fromAddress: ["0x0000000000000000000000000000000000000000"] }],
    'trace_block': ['latest']
  };

  const ignoreError = [
    "eth_sendRawTransaction",
    'eth_getFilterLogs',
    'eth_getFilterChanges',
    'eth_uninstallFilter',
    'eth_newFilter',
    'eth_newBlockFilter',
  ];

  for (let index = 0; index < rpcMethods.length; index++) {
    const params = methodParams[rpcMethods[index]] || [];
    try {
      const method = rpcMethods[index];
      if (availableMethods.includes(method)){
        continue
      }
      updateConsole(`check method: ${method}`);
      const response = await rpcRequest(method, params);
      if ((response.data && !response.data.error) || (response.status === 200 && ignoreError.includes(method))) {
        availableMethods.push(method);
      } else {
        updateConsole(`response null. Method: ${method}, params: ${JSON.stringify(params)}, response ${JSON.stringify(response)}`)
      }
    } catch (error) {
      updateConsole(`Error checking method ${method}, params: ${JSON.stringify(params)}: ${error}`);
    }
  }

  return availableMethods;
};
