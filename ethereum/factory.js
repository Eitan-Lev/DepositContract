import web3 from './web3';
import DepositFactory from './build/DepositFactory.json';

const instance = new web3.eth.Contract(
  JSON.parse(DepositFactory.interface),
  '0x2FEeC4e29438Ce80b2227aECBEa10777f5d62a73'
);

export default instance;
