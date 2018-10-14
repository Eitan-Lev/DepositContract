const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiledFactory = require('./build/DepositFactory.json');

const provider = new HDWalletProvider(
  'balance husband family north leader small cloud word cause game helmet tube',
  'https://rinkeby.infura.io/v3/dd214a51646245cdb34fedc3d67ac56f'
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);

  const result = await new web3.eth.Contract(
    JSON.parse(compiledFactory.interface)
  )
    .deploy({ data: compiledFactory.bytecode })
    .send({ gas: '5000000', from: accounts[0] });

  console.log('Contract deployed to', result.options.address);
};
deploy();
