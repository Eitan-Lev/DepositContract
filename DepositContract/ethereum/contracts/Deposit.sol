pragma solidity ^0.4.17;

//contract MainDepositsFactories {
    //address[] public deployedDepositFactories;

    //constructor() public {
        //address newDepositFactory = new DepositFactory(msg.sender);
        //deployedDepositFactories.push(newDepositFactory);
    //}

    //function getDeployedDepositFactories() public view returns (address[]) {
        //return deployedDepositFactories;
    //}
//}

contract DepositFactory {
    address[] public deployedDeposits;
    uint feeValue = 1;
    
    function createDeposit() public payable {
        require(msg.value >= feeValue, "Not enough money sent.");
        uint initialDeposit;//initialized to 0
        if (msg.value > feeValue) initialDeposit = msg.value;
        address newDeposit = new Deposit(msg.sender, initialDeposit);
        newDeposit.transfer(msg.value-1);//1 is fee
        deployedDeposits.push(newDeposit);
    }
    
    //constructor() public {
	//address newDeposit = new Deposit(msg.sender);
	//deployedDeposits.push(newDeposit);
    //}

    function getDeployedDeposits() public view returns (address[]) {
        return deployedDeposits;
    }
}

contract Deposit {
	struct State {
		mapping(address => uint) initialBalance;
		mapping(address => bool) initialBalanceSet;
		mapping(address => uint) currentDeposit;
		mapping(address => uint) finalBalance;
		mapping(address => bool) finalBalanceSet;
	}

	State state;//TODO weird fucking bug where you can't write public!!!
	
	address public initiator;
	address public counterpart;
	//TODO find what type
	//bytes sgxPublicSharedKey;

	bool public isKeySet;

	constructor(address creator, uint initialDeposit) public {
		initiator = creator;
		State memory newState = State();
		state = newState;
		//state.initialBalance[initiator] = initValue;
		//counterpart = 0;
		//isKeySet = false;
		state.initialBalance[initiator] = initialDeposit;
		state.currentDeposit[initiator] = initialDeposit;
		if (initialDeposit > 0) {
		    state.initialBalanceSet[initiator] = true;
		} else {
		    state.initialBalanceSet[initiator] = false;
		}
		//TODO not sure if needed:
		//state.initialBalance[counterpart] = 0;
		//state.currentDeposit[counterpart] = 0;
		//state.finalBalance[counterpart] = 0;
		state.finalBalance[initiator] = 0;
		//state.finalBalanceSet[counterpart] = false;
		//state.initialBalanceSet[counterpart] = false;
		state.finalBalanceSet[initiator] = false;
	}

	function addDeposit() public payable restricted {
		if (msg.sender == initiator) {//the initiator adds money
			state.currentDeposit[initiator] += (msg.value);
		} else if (state.initialBalanceSet[counterpart] != true) {//counterpart adds money the first time
			state.initialBalance[counterpart] = (msg.value);
			state.currentDeposit[counterpart] = (msg.value);
			state.initialBalanceSet[counterpart] = true;
		} else {//counterpart adds aditional money
			state.currentDeposit[counterpart] += (msg.value);
		}
	}

	//Restricts accress to initiator and counterpart only.
	//Allows action only in unlocked state (payment channel not yet closed).
	modifier restrictedUnlocked() {
	    if (msg.sender != initiator) {
	        require(msg.sender == counterpart, "Only invlolved parties are allowed to perform this.");//Only these 2 are allowed to add money
	    }
		//require(msg.sender == initiator || msg.sender == counterpart, "Only invlolved parties are allowed to perform this.");//Only these 2 are allowed to add money
		//require(state.finalBalance[initiator] == initValue && state.finalBalance[counterpart] == initValue);//Payment Channel still open
		require(state.finalBalanceSet[initiator] == false && state.finalBalanceSet[counterpart] == false, "Contract is locked, action not possible.");//Payment Channel still open
		_;
	}

	modifier restricted() {
	    if (msg.sender != initiator) {
	        require(msg.sender == counterpart, "Only invlolved parties are allowed to perform this.");//Only these 2 are allowed to add money
	    }
		//require(msg.sender == initiator || msg.sender == counterpart, "Only invlolved parties are allowed to perform this.");//Only these 2 are allowed to add money
		_;
	}

	modifier restrictedInit() {//Only initiator restriction 
		require(msg.sender == initiator, "Restricted to initiator only.");
		_;
	}

	modifier restrictedCounter() {//Only counterpart restriction 
		require(counterpart != 0, "Counterpart not yet set.");
		require(msg.sender == counterpart, "Restricted to counterpart only.");
		_;
	}

	function viewCurrentDeposit(address party) public view restrictedUnlocked returns (uint) {
		return state.currentDeposit[party];
	}

	function setCounterpart(address adr) public restrictedInit {
		require(counterpart == 0);//Initiator cannot change counterpart once set
		counterpart = adr;
		//TODO not sure if needed:
		state.initialBalance[counterpart] = 0;
		state.currentDeposit[counterpart] = 0;
		state.finalBalance[counterpart] = 0;
		state.initialBalanceSet[counterpart] = false;
		state.finalBalanceSet[counterpart] = false;
	}

	//function setPublicKey(type key) public restrictedUnlocked returns (type) {
		////TODO not yet implemented
	//}

	function drawMyBalance() public payable restricted {
		//Reset session before it began
		if (state.initialBalanceSet[counterpart] == false) {//Validate counterpart has not deposited money yet
			require(state.initialBalanceSet[initiator] == true);
			initiator.transfer(state.currentDeposit[initiator]);
			reset();
			return;
		}
		//After payment channel is active:
		require(state.finalBalanceSet[initiator] == true && state.finalBalanceSet[counterpart] == true);//require end state
		if (msg.sender == initiator) {
			initiator.transfer(state.finalBalance[initiator]);
			state.finalBalance[initiator] = 0;
		} else if (msg.sender == counterpart) {
			counterpart.transfer(state.finalBalance[counterpart]);
			state.finalBalance[counterpart] = 0;
		}
		if (state.finalBalance[initiator] == 0 && state.finalBalance[counterpart] == 0) {//If both sides drawed, reset contract
			reset();
		}
	}

	//function lockPublicSharedKey(bytes key) public restrictedCounter returns (bool) {
		//if (key == sgxPublicSharedKey) {
			//isKeySet = true;
		//}
		//return isKeySet;
	//}

	//Not fully implemented yet
	//function terminate(uint[2] Totals, byte32 hash, bytes sig) public restrictedUnlocked {
	function terminate(uint[2] Totals) public restrictedUnlocked {
		//TODO validate the SGX signature.
		state.finalBalance[initiator] = Totals[0];
		state.finalBalance[counterpart] = Totals[1];
		state.finalBalanceSet[initiator] = true;
		state.finalBalanceSet[initiator] = true;
		//TODO update the final state.
	}

	function reset() private {
		//TODO not sure if needed:
		state.initialBalance[initiator] = 0;
		state.initialBalance[counterpart] = 0;
		state.initialBalanceSet[initiator] = false;
		state.initialBalanceSet[counterpart] = false;
		state.currentDeposit[initiator] = 0;
		state.currentDeposit[counterpart] = 0;
		state.finalBalance[initiator] = 0;
		state.finalBalance[counterpart] = 0;
		state.finalBalanceSet[initiator] = false;
		state.finalBalanceSet[counterpart] = false;
		counterpart = 0;
		isKeySet = false;
	}

}
