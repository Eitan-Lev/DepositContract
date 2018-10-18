pragma solidity ^0.4.17;

/**
 * This contract simulates the behavior of a SGX. It stores the balances of both
 * parties, that are updated during the time the payment channel is open and in
 * the closing of the payment channel it supplies that information to the
 * DepositContract.
 */
contract SGXSimulator {

  /**
   * Initialized to 0
   * initiator's balance is currentBalance[0]
   * and counterpart's balance is currentBalance[1]
   */
	uint[2] public currentBalance;

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

}
