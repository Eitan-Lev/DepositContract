import web3 from './web3';
import DepositFactory from './build/DepositFactory.json';

const instance = new web3.eth.Contract(
	JSON.parse(DepositFactory.interface),
	'0x021C9936D551f5c42b58dA2867FA5CD2fFed7DEb'
);

export default instance;
