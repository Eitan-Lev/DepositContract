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

    constructor() public {
        address newDeposit = new Deposit(msg.sender);
        deployedDeposits.push(newDeposit);
    }

    function getDeployedDeposits() public view returns (address[]) {
        return deployedDeposits;
    }
}

contract Deposit {
	struct State {
		mapping(address => uint) initialBalance;
		mapping(address => uint) currentDeposit;
		mapping(address => uint) finalBalance;
		//mapping(address => int) initialBalance;
		//mapping(address => int) currentDeposit;
		//mapping(address => int) finalBalance;
	}

	State state;//TODO weird fucking bug where you can't write public!!!
	
	address public initiator;
	address public counterpart;
	//TODO find what type
	//type public sgxPublicSharedKey;

	bool public isKeySet;

	//TODO not sure about this:
	//int private initValue = -1;//Default value
	uint private initValue = (uint)(-1);//Default value assumes no one deposits this much
	//int private initValue;

	constructor(address creator) public {
		initiator = creator;
		require(msg.value > 0);
		State memory newState = State();
		state = newState;
		counterpart = 0;
		isKeySet = false;
		//initValue = -1;
	}

	function addDeposit() public payable restricted {
		if (msg.sender == initiator) {//the initiator adds money
			state.currentDeposit[initiator] += (msg.value);
		} else if (state.initialBalance[counterpart] != initValue) {//counterpart adds money the first time
			state.initialBalance[counterpart] = (msg.value);
			state.currentDeposit[counterpart] = (msg.value);
		} else {//counterpart adds aditional money
			state.currentDeposit[counterpart] += (msg.value);
		}
	}

	//Restricts accress to initiator and counterpart only.
	//Allows action only in unlocked state (payment channel not yet closed).
	modifier restrictedUnlocked() {
		require(msg.sender == initiator || msg.sender == counterpart);//Only these 2 are allowed to add money
		require(state.finalBalance[initiator] == initValue && state.finalBalance[counterpart] == initValue);//Payment Channel still open
		_;
	}

	modifier restricted() {
		require(msg.sender == initiator || msg.sender == counterpart);//Only these 2 are allowed to add money
		_;
	}

	modifier restrictedInit() {//Only initiator restriction 
		require(msg.sender == initiator);
		_;
	}

	modifier restrictedCounter() {//Only counterpart restriction 
		require(counterpart != 0);
		require(msg.sender == counterpart);
		_;
	}

	//function getCurrentDeposit(address party) public view restrictedUnlocked returns (int) {
		//return state.currentDeposit[party];
	//}

	function setCounterpart(address adr) public restrictedInit {
		require(counterpart == 0);//Initiator cannot change counterpart once set
		counterpart = adr;
	}

	//function setPublicKey(type key) public restrictedUnlocked returns (type) {
		////TODO not yet implemented
	//}

	//function drawMyBalance() public payable restricted {
		////Reset session before it began
		//if (state.initialBalance[counterpart] == initValue) {//Validate counterpart has not deposited money yet
			//require(state.currentDeposit[initiator] >= 0);
			//initiator.transfer((uint)(state.currentDeposit[initiator]));
			////reset();//TODO this will not work!!! calling to another function is tricky
			//return;//TODO not sure if this works, if not change to "else"
		//}
		////After payment channel is active:
		//require(state.finalBalance[initiator] != initValue && state.finalBalance[counterpart] != initValue);//require end state
		//if (msg.sender == initiator) {
			////initiator.transfer(state.finalBalance[initiator]);
			////state.finalBalance[initiator] = 0;
		//} else if (msg.sender == counterpart) {
			////counterpart.transfer(state.finalBalance[counterpart]);
			////state.finalBalance[counterpart] = 0;
		//}
		//if (state.finalBalance[initiator] == 0 && state.finalBalance[counterpart] == 0) {//If both sides drawed, reset contract
			////reset();//TODO this will not work!!! calling to another function is tricky
		//}
	//}

	//function lockPublicSharedKey(type key) public restrictedCounter returns (bool) {
		//if (key == sgxPublicSharedKey) {
			//isKeySet = true;
		//}
		//return isKeySet;
	//}

	////Not implemented yet
	//function terminate(struct SignedFinalstate. public restrictedUnlocked {
		////TODO validate the SGX signature.
		////TODO update the final state.
	//}

	//function reset() private {
		//state.initialBalance.Initiator = initValue;
		//state.initialBalance.Counterpart = initValue;
		//state.currentDeposit.Initiator = initValue;
		//state.currentDeposit.Counterpart = initValue;
		//state.finalBalance.Initiator = initValue;
		//state.finalBalance.Counterpart = initValue;
		//counterpart = 0;
		//isKeySet = false;
	//}

}
