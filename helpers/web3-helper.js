// Importing libraries and misc. for testing
const assert = require('assert');
const ganache = require('ganache-cli');
//import Web3 from 'web3';
const Web3 = require('web3');
const provider = ganache.provider();
//const web3 = new Web3(provider);
let web3;
let isVersionOne;

module.exports = {
	initWeb3() {
		web3 = new Web3(provider);
		//TODO
		// There is a different API for each version.
		// Fow now only support version 1.
		isVersionOne = true;
		return web3;
	},
	setProvider(factory) {
		factory.setProvider(provider);
	},
	async getAccounts() {
		accounts = await web3.eth.getAccounts();
		return accounts;
	},
	async newFactoryContract(compiledFactory, account) {
		factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
		.deploy({ data: compiledFactory.bytecode })
		.send({ from: account, gas: '3000000' });
		return factory;
	},
	async newDepositContract(compiledDeposit, depositAddress) {
		deposit = await new web3.eth.Contract(
				JSON.parse(compiledDeposit.interface),
				depositAddress
			);
		return deposit;
	},
	toHex(str) {
		if (isVersionOne) {
			return web3.utils.toHex(str);
		} else {
			assert(false);
		}
	},
	hexToNumber(hex) {
		if (isVersionOne) {
			return web3.utils.hexToNumber(hex);
		} else {
			assert(false);
		}
	},
	toV_Decimal(v) {
		if (isVersionOne) {
			const v_decimal = this.hexToNumber(v) + 27;
			assert(v_decimal == 27 || v_decimal == 28, "v_decimal is not 27 or 28");
			return v_decimal;
		} else {
			assert(false);
		}
	},
	getSignature(addr, msg) {
		//msgHex = this.toHex(msg);
		msgHex = web3.utils.keccak256(msg);
		if (isVersionOne) {
			return web3.eth.sign('0x' + msgHex, addr);
		} else {
			assert(false);
		}
	},
	isHexStrict(hex) {
		if (isVersionOne) {
			return web3.utils.isHexStrict(hex);
		} else {
			assert(false);
		}
	}
}
