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
	enum Stage {
		InitialStage,
		NoCounterpart,
		CounterpartSet,
		CounterpartDepositSet,
		PaymentChannelOpen,
		PaymentChannelLocked,
		Finished
	}

	struct State {
		mapping(address => uint) initialBalance;
		mapping(address => uint) currentDeposit;
		mapping(address => uint) finalBalance;
		bool finalBalanceSet;
		Stage stage;// This is the current Stage
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
			finalBalanceSet: false,
			stage: Stage.InitialStage
		});
		state = newState;
		uint initialDeposit = 0;
		if (msg.value > 0) {
			initialDeposit = msg.value;
			state.stage = Stage.NoCounterpart;
		}
		state.initialBalance[initiator] = initialDeposit;
		state.currentDeposit[initiator] = initialDeposit;
		//TODO not sure if needed:
		state.finalBalance[initiator] = 0;
	}

	function addDeposit() public payable restricted restrictedUnlocked {
		require(msg.value > 0, "Pay more than 0 please.");
		if (msg.sender == initiator) {//the initiator adds money
			state.currentDeposit[initiator] += (msg.value);
		} else if (atStage(Stage.CounterpartSet)) {//counterpart adds money the first time
			state.initialBalance[counterpart] = (msg.value);
			state.currentDeposit[counterpart] = (msg.value);
			nextStage();
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
		require(beforeStage(Stage.PaymentChannelLocked), "Contract is locked, action not possible: restrictedUnlocked");
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

	function nextStage() internal {
		assert(state.stage != Stage.Finished);
		state.stage = Stage(uint(state.stage) + 1);
	}

	function getErrorMsgAccordingToStage(Stage _stage) internal pure returns (string) {
		if (_stage == Stage.InitialStage) {
			//return "Party is already the initiator";
			return "";
		} else if (_stage == Stage.CounterpartSet) {
			return "Counterpart already set!";
		} else if (_stage == Stage.CounterpartDepositSet) {
			return "";
		} else if (_stage == Stage.PaymentChannelOpen) {
			return "";
		} else if (_stage == Stage.PaymentChannelLocked) {
			return "Final state was not yet given";
		} else if (_stage == Stage.Finished) {
			return "";
		}
	}

	modifier verifyAtStage(Stage _stage) {//Only counterpart restriction 
		require(atStage(_stage), getErrorMsgAccordingToStage(_stage));
		_;
	}

	modifier transitionNext() {//Only counterpart restriction 
		_;
		nextStage();
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

	function setCounterpart(address adr) public restrictedInit verifyAtStage(Stage.NoCounterpart) transitionNext {
		require(adr != initiator, "Party is already the initiator");
		counterpart = adr;
		//TODO not sure if needed:
		state.initialBalance[counterpart] = 0;
		state.currentDeposit[counterpart] = 0;
		state.finalBalance[counterpart] = 0;
	}

	//function setPublicKey(type key) public restrictedUnlocked returns (type) {
		////TODO not yet implemented
	//}

	function atStage(Stage _stage) internal view returns (bool) {
		return (state.stage == _stage);
	}

	function beforeStage(Stage endStage) internal view returns (bool) {
		assert(endStage != Stage.Finished);
		Stage newEndStage = Stage(uint(endStage) + 1);
		return betweenStages(Stage.InitialStage, newEndStage);
	}

	function betweenStages(Stage beginStage, Stage endStage) internal view returns (bool) {
		uint endStageInt = uint(endStage);
		uint beginStageInt = uint(beginStage);
		uint stage = uint(state.stage);
		return ((stage <= endStageInt) && (stage >= beginStageInt));
	}

	function cancelDepositContract() public restricted verifyAtStage(Stage.InitialStage) {
		//Reset session before it began
		factory.removeDeposit();
		selfdestruct(initiator);
	}

	function drawMyBalance() public payable restricted verifyAtStage(Stage.PaymentChannelLocked) {
		//After payment channel is active:
		if (msg.sender == initiator) {
			initiator.transfer(state.finalBalance[initiator]);
			state.finalBalance[initiator] = 0;
		} else if (msg.sender == counterpart) {
			counterpart.transfer(state.finalBalance[counterpart]);
			state.finalBalance[counterpart] = 0;
		}
		if (state.finalBalance[initiator] == 0 && state.finalBalance[counterpart] == 0) {//If both sides drawed, reset contract
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
	function setFinalState(uint[2] Totals) public restrictedUnlocked {
		//TODO validate the SGX signature.
		state.finalBalance[initiator] = Totals[0];
		state.finalBalance[counterpart] = Totals[1];
		state.stage = Stage.PaymentChannelLocked;
		//TODO update the final state.
	}
}
