const assert = require('assert');
const constants = require('./constants');

let deposit;
let initiator
let counterpart;
let factory;
let web3Helper;
let typeOfRun;

module.exports = {
	setVersion(_typeOfRun) {
		typeOfRun = _typeOfRun;
	},
	initGenMethods(_typeOfRun) {
		typeOfRun = _typeOfRun;
	},
	async getEventLogs(result) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return result.logs[0].args;
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			return result.events.newDepositCreation.returnValues;
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async getContractAddress(contract) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return contract.address;
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			return contract.options.address;
		} else {
			assert(false, 'not yet implemented')
		}
	}
}
