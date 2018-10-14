import Web3 from 'web3';

let web3;

// inside browser & metamask available
if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
   // We are in the browser and metamask is running.
   web3 = new Web3(window.web3.currentProvider);
} else {
  // we are on the server OR the user is not running metamask
  const provider = new Web3.providers.HttpProvider(
    'https://rinkeby.infura.io/v3/dd214a51646245cdb34fedc3d67ac56f'
  );
  web3 = new Web3(provider);
}

export default web3;
