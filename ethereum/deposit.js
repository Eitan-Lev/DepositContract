import web3 from './web3';
import Deposit from './build/Deposit.json';

export default address => {
	let deposit = new web3.eth.Contract(JSON.parse(Deposit.interface), address);
	deposit.options.address = address;
	return deposit;
};
