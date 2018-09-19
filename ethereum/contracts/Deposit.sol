pragma solidity ^0.4.17;

contract DepositFactory {
	mapping(address => address) public depositsCreators;//Contract => creator
	mapping(address => address[]) public deployedDeposits;//creator => Contract
	//Using mappings means we can't know simply how many contracts exist.
	//Also, there is no way to iterate over all contracts.
	//Two mappings required. 
	//Creator => Contract because creator has to know somehow what is the address of hes contracts.
	//Contract => Creator to be able to destroy.
	uint feeValue = 1;

	function createDeposit() public payable {
		require(msg.value >= feeValue, "Not enough money sent.");
		uint initialDeposit;//initialized to 0
		if (msg.value > feeValue) initialDeposit = msg.value - 1;
		address newDeposit = (new Deposit).value(initialDeposit)(msg.sender);
		//deployedDepositsArray.push(newDeposit);
		(deployedDeposits[msg.sender]).push(newDeposit);
		depositsCreators[newDeposit] = msg.sender;
		//return newDeposit;
		//Don't return anything since it's payable, which does not go well with return values
	}
    
	//function getDeployedDeposits() public view returns (address[]) {
		//return deployedDepositsArray;
	//}

	function getDepositContract(address creator) public view returns (address[]) {
		return deployedDeposits[creator];//returns 0x000... if creator does not exist
	}

	function getDepositContractCreator(address depositContract) public view returns (address) {
		return depositsCreators[depositContract];//returns 0x000... if contract does not exist
	}

	function removeDeposit() public {
		//Currently the remove causes all contracts of a creator to be removed (undesired behaviour)
		delete deployedDeposits[(depositsCreators[msg.sender])];//Only relevant if sent by a contract, so need to restrict
		delete depositsCreators[msg.sender];//Only relevant if sent by a contract, so need to restrict
	}
}

contract Deposit {
	struct State {
		mapping(address => uint) initialBalance;
		mapping(address => bool) initialBalanceSet;
		mapping(address => uint) currentDeposit;
		mapping(address => uint) finalBalance;
		bool finalBalanceSet;
	}

	State state;//TODO weird fucking bug where you can't write public!!!

	DepositFactory public factory;//Saves the factory address for self termination state
	address public initiator;
	address public counterpart;
	//TODO find what type
	//bytes sgxPublicSharedKey;

	bool public isKeySet;
	
	constructor(address creator) public payable {
		factory = DepositFactory(msg.sender);
		initiator = creator;
		State memory newState = State({
			finalBalanceSet: false
		});
		state = newState;
		uint initialDeposit;
		if (msg.value > 0) {
			initialDeposit = msg.value;
			state.initialBalanceSet[initiator] = true;
		} else {
			state.initialBalanceSet[initiator] = false;
		}
		state.initialBalance[initiator] = initialDeposit;
		state.currentDeposit[initiator] = initialDeposit;
		//TODO not sure if needed:
		state.finalBalance[initiator] = 0;
	}

	function addDeposit() public payable restricted {
		require(msg.value > 0, "Pay more than 0 please.");
		if (msg.sender == initiator) {//the initiator adds money
			if (state.initialBalanceSet[initiator] == false) {
				state.initialBalanceSet[initiator] = true;
				state.initialBalance[initiator] = (msg.value);
			}
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
		if (msg.sender != initiator) {//If  counterpart not yet set, following require is always true
			require(msg.sender == counterpart && counterpart != 0, "Only invlolved parties are allowed to perform this: restrictedUnlocked");//Only these 2 are allowed to add money
		}
		require(state.finalBalanceSet == false, "Contract is locked, action not possible: restrictedUnlocked");
		_;
	}

	modifier restricted() {
		if (msg.sender != initiator) {//If  counterpart not yet set, following require is always true
			require(msg.sender == counterpart && counterpart != 0, "Only invlolved parties are allowed to perform this: restricted");//Only these 2 are allowed to add money
		}
		_;
	}

	modifier restrictedInit() {//Only initiator restriction 
		require(msg.sender == initiator, "Restricted to initiator only: restrictedInit");
		_;
	}

	modifier restrictedCounter() {//Only counterpart restriction 
		require(counterpart != 0, "Counterpart not yet set.");
		require(msg.sender == counterpart, "Restricted to counterpart only: restrictedCounter");
		_;
	}

	function viewCurrentDeposit(address party) public view restrictedUnlocked returns (uint) {
		return state.currentDeposit[party];
	}
	
	function viewCurrentDeposit() public view restrictedUnlocked returns (uint[]) {
		uint[] memory balance = new uint[](2);
		balance[0] = state.currentDeposit[initiator];
		balance[1] = state.currentDeposit[counterpart];
		return balance;
	}

	function setCounterpart(address adr) public restrictedInit {
		require(counterpart == 0, "Counterpart already set!");//Initiator cannot change counterpart once set
		require(adr != initiator, "Party is already the initiator");
		counterpart = adr;
		//TODO not sure if needed:
		state.initialBalance[counterpart] = 0;
		state.currentDeposit[counterpart] = 0;
		state.finalBalance[counterpart] = 0;
		state.initialBalanceSet[counterpart] = false;
	}

	//function setPublicKey(type key) public restrictedUnlocked returns (type) {
		////TODO not yet implemented
	//}

	function drawMyBalance() public payable restricted {
		//Reset session before it began
		if (state.initialBalanceSet[counterpart] == false) {//Validate counterpart has not deposited money yet
			require(state.initialBalanceSet[initiator] == true, "Canno't refund because no money exists.");
			factory.removeDeposit();
			selfdestruct(initiator);
		}
		//After payment channel is active:
		require(state.finalBalanceSet == true, "Final state was not yet given.");//require end state
		if (msg.sender == initiator) {
			initiator.transfer(state.finalBalance[initiator]);
			state.finalBalance[initiator] = 0;
		} else if (msg.sender == counterpart) {
			counterpart.transfer(state.finalBalance[counterpart]);
			state.finalBalance[counterpart] = 0;
		}
		if (state.finalBalance[initiator] == 0 && state.finalBalance[counterpart] == 0) {//If both sides drawed, reset contract
			//reset();
			factory.removeDeposit();
			selfdestruct(initiator);//initiator gets leftovers
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
	function terminatePaymentChannel(uint[2] Totals) public restrictedUnlocked {
		//TODO validate the SGX signature.
		state.finalBalance[initiator] = Totals[0];
		state.finalBalance[counterpart] = Totals[1];
		state.finalBalanceSet = true;
		//TODO update the final state.
	}
}
