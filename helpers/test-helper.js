const assert = require('assert');

module.exports = {
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
	toHex(str) {
		var hex = '';
		for (var i = 0; i < str.length; i++) {
			hex += '' + str.charCodeAt(i).toString(16);
		}
		return hex;
	},
	getSignature(web3, addr, msg) {
		msgHex = this.toHex(msg);
		console.log("reached here");
		let signature = web3.eth.sign(addr, '0x' + msgHex);
		console.log("reached here 2");
		return signature;
	}
}
