const assert = require('assert');
const constants = require('./constants');

let initiator
let counterpart;
let factory;
let web3;
let typeOfRun;

module.exports = {
	setVersion(_typeOfRun) {
		typeOfRun = _typeOfRun;
	},
	initFactory(_initiator, _counterpart, _web3, _typeOfRun) {
		typeOfRun = _typeOfRun;
		initiator = _initiator;
		counterpart = _counterpart;
		web3 = _web3;
	},
	async deployOrCreateFactory({from, gas}) {
		const artifact = artifacts.require("DepositFactory");
		if (typeOfRun == constants.UsingOriginalTruffle) {
			factory = await DepositFactory.new();//New contract for every "it" run
		} else if (typeOfRun == constants.UsingWeb3Version1) {
			factory = await new web3.eth.Contract(artifact.abi)
				.deploy({ data: artifact.bytecode })
				.send({ from: from, gas: gas });
		} else if (typeOfRun == constants.UsingWeb3Version1NoRedeploy) {
			const deployedAddress = artifact.networks[artifact.network_id].address;
			factory =  new web3.eth.Contract(artifact.abi, deployedAddress);
		} else {
			assert(false, 'not yet implemented')
		}
		return factory;
	},
	async createDeposit({from, gas, value}) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return await factory.createDeposit({
				from: from,
				gas: gas,
				value: value
			});
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			return await factory.methods.createDeposit().send({
				from: from,
				gas: gas,
				value: value
			});
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async getDepositContract(party) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return await factory.getDepositContract(party);
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			return await factory.methods.getDepositContract(party).call();
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async deployedDeposits(party, index = 0) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return await factory.deployedDeposits.call(party, index);
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			return await factory.methods.deployedDeposits(party, index).call();
		} else {
			assert(false, 'not yet implemented')
		}
	},
	advanceDepositsIndex(index) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return index;//No need to advance counter, using new Factory each time
		} else if (typeOfRun == constants.UsingWeb3Version1) {
			return index;
		} else if (typeOfRun == constants.UsingWeb3Version1NoRedeploy) {
			return index + 1;
		} else {
			assert(false, 'not yet implemented')
		}
	}
}
