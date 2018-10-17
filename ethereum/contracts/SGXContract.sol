pragma solidity ^0.4.17;//for keccak256 and security issues

contract SGXContract {

    /**
     * Initialized to 0
     * initiator's balance is currentBalance[0]
     * and counterpart's balance is currentBalance[1]
     */
	uint[2] currentBalance;

	function setInitiatorBalance(uint initiatorBalance) public {
	    currentBalance[0] = initiatorBalance;
	}

    function setCounterpartBalance(uint counterpartBalance) public {
	    currentBalance[1] = counterpartBalance;
	}

	function setBalances(uint initiatorBalance, uint counterpartBalance)
	public {
		setInitiatorBalance(initiatorBalance);
		setCounterpartBalance(counterpartBalance);
	}

	function getBalances() public view returns (uint[2]) {
	    return currentBalance;
	}

}
