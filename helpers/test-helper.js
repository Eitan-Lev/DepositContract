const assert = require('assert');

let deposit;
let factory;
let web3Helper;

module.exports = {
	//FIXME
	// Don't use yet. Does not work for some reason.
	initTestHelper(_factory, _deposit, _web3Helper) {
		factory = _factory;
		deposit = _deposit;
		web3Helper = _web3Helper;
	},
	ifUsingTestRPC(err) {
		//Make sure this is a throw we expect.
		if (err.message.indexOf('VM Exception while processing transaction: out of gas') == 0
			&& err.message.indexOf('VM Exception while processing transaction: invalid JUMP') == 0
			&& err.message.indexOf('VM Exception while processing transaction: invalid opcode') == 0) {
		     throw err;
		}
	},
	testRestrictionModifier(err, restrictionMessage) {
		//Make sure this is a throw we expect.
		if (err.message.indexOf('VM Exception while processing transaction: out of gas') == 0
			&& err.message.indexOf('VM Exception while processing transaction: invalid JUMP') == 0
			&& err.message.indexOf('VM Exception while processing transaction: invalid opcode') == 0) {
				throw err;
		} else {
			assert.equal(err.message, restrictionMessage);
		}
	},
	//async setFinalState(deposit, Totals, v_decimal, r, s, account) {
		//res = await deposit.methods.setFinalState(Totals, v_decimal, r, s)
			//.send({
				//from: account,
				//gas: '1000000'
			//});
		//return res;
	//},
	//async setFinalState(Totals, v_decimal, r, s, account) {
	async setFinalState(Totals, TotalsBytes, v_decimal, r, s, account) {
		res = await deposit.methods.setFinalState(Totals, TotalsBytes, v_decimal, r, s)
			.send({
				from: account,
				gas: '2000000'
			});
		return res;
	}
}
