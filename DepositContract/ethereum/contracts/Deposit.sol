pragma solidity ^0.4.17;

contract CampaignFactory {
    address[] public deployedCampaigns;

    function createCampaign(uint minimum) public {
        address newCampaign = new Campaign(minimum, msg.sender);
        deployedCampaigns.push(newCampaign);
    }

    function getDeployedCampaigns() public view returns (address[]) {
        return deployedCampaigns;
    }
}

contract Deposit {
	//struct State {
		//int initialBalance[2];
		//int currentDeposit[2];
		//int finalBalance[2];
	//}
	struct State {
		Balance initialBalance;
		Balance currentDeposit;
		Balance finalBalance;
	}
	struct Balance {
		int Initiator;
		int Counterpart;
	}

	address public initiator;
	address public counterpart;
	type public sgxPublicSharedKey;
	State public state;
	bool public isKeySet;

	//TODO not sure about this:
	int private initValue = -1;//Default value

	constructor(address creator) public {
		initiator = creator;
		require(msg.value > 0);
		State memory newState = State();
		State memory newState = State({
			initialBalance: Balance({
				Initiator: initValue;
				Counterpart: initValue;
			}),
			currentDeposit: Balance({
				Initiator: initValue;
				Counterpart: initValue;
			}),
			finalBalance: Balance({
				Initiator: initValue;
				Counterpart: initValue;
			})

		});
		counterpart = 0;
		isKeySet = false;
	}

	function addDeposit() public payable restricted {
		if (msg.sender == initiator) {//The initiator adds money
			state.currentDeposit.Initiator += msg.value;
		} else if (state.initialBalance.Counterpart != initValue) {//Counterpart adds money the first time
			state.initialBalance.Counterpart = msg.value;	
			state.currentDeposit.Counterpart = msg.value;
		} else {//Counterpart adds aditional money
			state.currentDeposit.Counterpart += msg.value;
		}
	}

	//Restricts accress to initiator and counterpart only.
	//Allows action only in unlocked state (payment channel not yet closed).
	modifier restrictedUnlocked() {
		require(state.finalBalance.Initiator == initValue && Sate.finalBalance.Counterpart == initValue);//Payment Channel still open
		require(msg.sender == initiator || msg.sender == counterpart);//Only these 2 are allowed to add money
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

	function getCurrentDeposit() public view restrictedUnlocked returns (Balance) {
		return state.currentDeposit;
	}

	function setCounterpart(address adr) public restrictedInit {
		require(counterpart == 0);//Initiator cannot change counterpart once set
		counterpart = adr;
	}

	function setPublicKey(type key) public restrictedUnlocked returns (type) {
		//TODO not yet implemented
	}

	function drawMyBalance() public payable restricted {
		//Reset session before it began
		if (state.initialBalance.Counterpart == initValue) {//Validate counterpart has not deposited money yet
			require(state.currentDeposit.Initiator >= 0);
			initiator.transfer(state.currentDeposit.Initiator);
			reset();//TODO this will not work!!! calling to another function is tricky
			return;//TODO not sure if this works, if not change to "else"
		}
		//After payment channel is active:
		require(state.finalBalance.Initiator != initValue && state.finalBalance.Counterpart != initValue);//require end state
		if (msg.sender == initiator) {
			initiator.transfer(state.finalBalance.Initiator);
			state.finalBalance.Initiator = 0;
		} else if (msg.sender == counterpart) {
			counterpart.transfer(state.finalBalance.Counterpart);
			state.finalBalance.Counterpart = 0;
		}
		if (state.finalBalance.Initiator == 0 && state.finalBalance.Counterpart == 0) {//If both sides drawed, reset contract
			reset();//TODO this will not work!!! calling to another function is tricky
		}
	}

	function lockPublicSharedKey(type key) public restrictedCounter returns (bool) {
		if (key == sgxPublicSharedKey) {
			isKeySet = true;
		}
		return isKeySet;
	}

	//Not implemented yet
	function terminate(struct SignedFinalstate. public restrictedUnlocked {
		//TODO validate the SGX signature.
		//TODO update the final state.
	}

	function reset() private {
		state.initialBalance.Initiator = initValue;
		state.initialBalance.Counterpart = initValue;
		state.currentDeposit.Initiator = initValue;
		state.currentDeposit.Counterpart = initValue;
		state.finalBalance.Initiator = initValue;
		state.finalBalance.Counterpart = initValue;
		counterpart = 0;
		isKeySet = false;
	}

}
