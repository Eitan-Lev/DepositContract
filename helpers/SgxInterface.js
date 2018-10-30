const assert = require('assert');
const constants = require('./constants');
const SgxSimulator = artifacts.require("SgxSimulator");

let SgxSimulatorContract;
let SgxSimulatorAddress;

let deposit;
let initiator
let counterpart;
let factory;
let web3;
let typeOfRun;
let sgxVersion;
let sgxAccount;
let sgxAddress;

module.exports = {
	SgxSimulatorAddress,
	initSgxMethods(_web3, _typeOfRun, _sgxVersion) {
		typeOfRun = _typeOfRun;
		sgxVersion = _sgxVersion;
		web3 = _web3;
	},
	async defineSgxSimulator() {
		SgxSimulatorContract = await SgxSimulator.deployed();
		SgxSimulatorAddress = SgxSimulator.address;
		return SgxSimulatorAddress;
	},
	async runPaymentChannelUpToTheseBalances({initiatorBalance, counterpartBalance}) {
		//Currently only implemented for Truffle deployment version
		await SgxSimulatorContract.setBalances(initiatorBalance, counterpartBalance);
	},
	setSgxAddress(_sgxAddress) {
		sgxAddress = _sgxAddress;
	},
	async createSgxAccount(_web3) {
		internalWeb3 = web3;
		if (typeof _web3 !== 'undefined') {
			internalWeb3 = _web3;
		}
		if (constants.usingWeb3Version1(typeOfRun)) {
			sgxAccount = await internalWeb3.eth.accounts.create();
			sgxAddress = sgxAccount.address;
			return sgxAddress;
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async getSgxAddress() {
		if (constants.usingWeb3Version1(typeOfRun)) {
			return sgxAddress;
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async sgxSignMessage(message, _web3) {
		internalWeb3 = web3;
		if (typeof _web3 !== 'undefined') {
			internalWeb3 = _web3;
		}
		if (constants.usingWeb3Version1(typeOfRun)) {
			// prefix = "\x19Ethereum Signed Message:\n32";
			// msgHash3 = await internalWeb3.utils.soliditySha3(
			// 	{ type: 'uint', value: message[0] },
			// 	{ type: 'uint', value: message[1] },
			// 	prefix
			// );
			msgHash = await internalWeb3.utils.soliditySha3({ type: 'uint[]', value: message });
			msgHash2 = await internalWeb3.utils.soliditySha3(
				{ type: 'uint', value: message[0] },
				{ type: 'uint', value: message[1] }
			);
			assert.equal(msgHash, msgHash2);
			signature = await sgxAccount.sign(msgHash);
			signature.v = internalWeb3.utils.hexToNumber(signature.v);
			return signature;
		} else {
			assert(false, 'not yet implemented')
		}
	}
}
