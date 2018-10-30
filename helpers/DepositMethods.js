const assert = require('assert');
const constants = require('./constants');

let deposit;
let initiator
let counterpart;
let factory;
let web3;
let typeOfRun;

module.exports = {
	setVersion(_typeOfRun) {
		typeOfRun = _typeOfRun;
	},
	initDeposit(_initiator, _counterpart, _web3, _typeOfRun) {
		typeOfRun = _typeOfRun;
		initiator = _initiator;
		counterpart = _counterpart;
		web3 = _web3;
	},
	async getDeployedDeposit(address) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			deposit = await DepositFactory.at(address);//New contract for every "it" run
			return deposit;
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			const artifact = artifacts.require("Deposit");
			deposit = await new web3.eth.Contract(artifact.abi, address);
			return deposit;
		} else {
			assert(false, 'not yet implemented')
		}
	},
	// FIXME: don't use!!!
	// currently causes a weird bug from unknown reason
	// async viewCurrentDeposit() {
	// 	await console.log("viewCurrentDeposit");
	// 	if (typeOfRun == constants.UsingOriginalTruffle) {
	// 		console.log("UsingOriginalTruffle");
	// 		initiatorDeposit = await deposit.viewCurrentDeposit.call(initiator);
	// 		counterpartDeposit = await deposit.viewCurrentDeposit.call(counterpart);
	// 		// [initiatorDeposit, counterpartDeposit] = await deposit.viewCurrentDeposit.call();
	// 		return [initiatorDeposit, counterpartDeposit];
	// 	} else if (constants.usingWeb3Version1(typeOfRun)) {
	// 		console.log("usingWeb3Version1");
	// 		initiatorDeposit = await deposit.methods.viewCurrentDeposit(initiator).call({from: initiator});
	// 		console.log(initiatorDeposit);
	// 		initiatorDeposit = await deposit.methods.viewCurrentDeposit(initiator).call();
	// 		console.log(initiatorDeposit);
	// 		counterpartDeposit = await deposit.methods.viewCurrentDeposit(counterpart).call();
	// 		// currentDeposits = await deposit.methods.viewCurrentDeposit().call();
	// 		return currentDeposits;
	// 	} else {
	// 		assert(false, 'not yet implemented')
	// 	}
		// return [initiatorDeposit, counterpartDeposit];
	// },
	async viewCurrentDeposit(party) {
		isPartyDefined = (typeof party !== 'undefined');
		if (typeOfRun == constants.UsingOriginalTruffle) {
			if (isPartyDefined) {
				return await deposit.viewCurrentDeposit.call(party);
			} else {
				return await deposit.viewCurrentDeposit.call();
			}
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			if (isPartyDefined) {
				return await deposit.methods.viewCurrentDeposit(party).call();
			} else {
				return await deposit.viewCurrentDeposit().call();
			}
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async state() {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			currentState = await deposit.state.call();
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			currentState = await deposit.methods.state().call();
		} else {
			assert(false, 'not yet implemented')
		}
		return currentState;
	},
	async getCurrentStage() {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			currentState = await deposit.state.call();
			currentStage = currentState[1].toNumber();//stage, fron BigNumber
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			currentState = await deposit.methods.state().call();
			currentStage = currentState['stage'];
		} else {
			assert(false, 'not yet implemented')
		}
		return currentStage;
	},
	async getStageOfState(currentState) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			currentStage = currentState[1].toNumber();//stage, fron BigNumber
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			currentStage = currentState['stage'];
		} else {
			assert(false, 'not yet implemented')
		}
		return currentStage;
	},
	async setCounterpart({_counterpart, from}) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			await deposit.setCounterpart(_counterpart, { from: from });
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			await deposit.methods.setCounterpart(_counterpart).send({ from: from });
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async initiator() {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return await deposit.initiator.call();
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			return await deposit.methods.initiator().call();
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async counterpart() {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return await deposit.counterpart.call();
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			return await deposit.methods.counterpart().call();
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async isKeySet() {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return await deposit.isKeySet.call();
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			return await deposit.methods.isKeySet().call();
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async SgxAddress() {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return await deposit.SgxAddress.call();
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			return await deposit.methods.SgxAddress().call();
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async factory() {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			return await deposit.factory.call();
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			return await deposit.methods.factory().call();
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async cancelDepositContract({ from }) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			await deposit.cancelDepositContract({ from: from });
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			await deposit.methods.cancelDepositContract().send({ from: from });
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async addDeposit({from, gas, value}) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			await deposit.addDeposit.send({ from: from, gas: gas, value: value	});
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			await deposit.methods.addDeposit().send({ from: from, gas: gas, value: value	});
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async setPublicKey(sgxAddress, {from, gas}) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			await deposit.setPublicKey.send(sgxAddress, { from: from, gas: gas	});
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			await deposit.methods.setPublicKey(sgxAddress).send({ from: from, gas: gas	});
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async lockPublicSharedKey(sgxAddress, {from, gas}) {
		if (typeOfRun == constants.UsingOriginalTruffle) {
			await deposit.lockPublicSharedKey.send(sgxAddress, { from: from, gas: gas	});
		} else if (constants.usingWeb3Version1(typeOfRun)) {
			await deposit.methods.lockPublicSharedKey(sgxAddress).send({ from: from, gas: gas	});
		} else {
			assert(false, 'not yet implemented')
		}
	},
	//FIXME remove later
	// async getHashAndAddress(Totals, signature) {
	// 	if (typeOfRun == constants.UsingOriginalTruffle) {
	// 		await deposit.lockPublicSharedKey.send(sgxAddress, { from: from, gas: gas	});
	// 	} else if (constants.usingWeb3Version1(typeOfRun)) {
	// 		return await deposit.methods.getHashAndAddress(Totals, signature.v, signature.r, signature.s);
	// 	} else {
	// 		assert(false, 'not yet implemented')
	// 	}
	// },
	async setFinalStateBySgxSig(Totals, fixed_msg_sha, v_decimal, r, s, {from, gas}) {
		if (constants.usingWeb3Version1(typeOfRun)) {
			await deposit.methods.setFinalState(Totals, fixed_msg_sha, v_decimal, r, s)
				.send({	from: from,	gas: gas });
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async setFinalStateBySgxSimulator(Totals, {from, gas}) {
		if (constants.usingWeb3Version1(typeOfRun)) {
			await deposit.methods.setFinalState(Totals)
				.send({	from: from,	gas: gas });
		} else {
			assert(false, 'not yet implemented')
		}
	},
	async drawMyBalance({from, gas}) {
		if (constants.usingWeb3Version1(typeOfRun)) {
			await deposit.methods.drawMyBalance().send({
				from: from,
				gas: gas
			});
		} else {
			assert(false, 'not yet implemented')
		}
	}
}
