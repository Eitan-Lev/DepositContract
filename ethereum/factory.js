import web3 from './web3';
import DepositFactory from './build/DepositFactory.json';

const instance = new web3.eth.Contract(
	JSON.parse(DepositFactory.interface),
	'0xB01cDe6c95a088c1E7a15645d9C6Dbc0bd1367c8'
);

export default instance;
