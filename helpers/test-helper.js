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
	}
}
