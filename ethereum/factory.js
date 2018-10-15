import web3 from './web3';
import DepositFactory from './build/DepositFactory.json';

const instance = new web3.eth.Contract(
  JSON.parse(DepositFactory.interface),
  '0xFee35660D63040F21EdE38425caF0F54601eDFf9'
);

export default instance;
