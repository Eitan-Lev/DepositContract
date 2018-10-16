import web3 from './web3';
import DepositFactory from './build/DepositFactory.json';

const instance = new web3.eth.Contract(
	JSON.parse(DepositFactory.interface),
	'0x2250b28fFb7A3a04d9D8069BA2F1fEb45d5CDBC3'
);

export default instance;
