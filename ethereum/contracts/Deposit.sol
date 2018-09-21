pragma solidity ^0.4.17;//for keccak256 and security issues

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
		(deployedDeposits[msg.sender]).push(newDeposit);
		depositsCreators[newDeposit] = msg.sender;
		// Don't return anything since it's payable,
		// which does not go well with return values
	}
    
	//function getDeployedDeposits() public view returns (address[]) {
		//return deployedDepositsArray;
	//}

	function getDepositContract(address creator) 
		public 
		view 
		returns (address[]) 
	{
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
	enum Party {
		Counterpart,
		Initiator
	}

	enum Stage {
		InitialStage,
		NoCounterpart,
		CounterpartSet,
		SettingKey,
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
	State public state;

	DepositFactory public factory;//Saves the factory address for self termination state
	address public initiator;
	address public counterpart;

	address public SgxAddress;

	bool public isKeySet = false;
	
	constructor(address creator) public payable transitionNext {
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
		}
		state.initialBalance[initiator] = initialDeposit;
		state.currentDeposit[initiator] = initialDeposit;
		state.finalBalance[initiator] = 0;
	}

	/**
	 * Add Cryptocurrency to the relevant account.
	 * Calling is enabled at all stages, but irrelevant from Locked stage.
	 */
	function addDeposit() public payable restricted {
		require(msg.value > 0, "Pay more than 0 please.");
		if (msg.sender == initiator) {//the initiator adds money
			state.currentDeposit[initiator] += (msg.value);
		} else if (atStage(Stage.CounterpartSet)) {//counterpart adds money
			state.currentDeposit[counterpart] += (msg.value);
		}
	}

	modifier restricted() {
		require(msg.sender == counterpart || msg.sender == initiator, 
			"Only this channel's parties have permission for this action");
		_;
	}

	modifier restrictedAccess(Party party) {
		address adr = (party == Party.Initiator) ? initiator : counterpart;
		require(msg.sender == adr, "You lack permissions for this action");
		_;
	}

	modifier isSigned(uint[2] Totals, uint8 v, bytes32 r, bytes32 s) 
	{
		bytes32 msgHash = keccak256(Totals);
		require(ecrecover(msgHash, v, r, s) == SgxAddress);
		_;
	}

	function nextStage() internal {
		assert(state.stage != Stage.Finished);
		state.stage = Stage(uint(state.stage) + 1);
	}

	function getErrorMsgAccordingToStage(Stage _stage) internal pure returns (string) {
		if (_stage == Stage.InitialStage) {
			return "";
		} else if (_stage == Stage.CounterpartSet) {
			return "Counterpart already set!";
		} else if (_stage == Stage.SettingKey) {
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

	function viewCurrentDeposit(address party) public view restricted returns (uint) {
		return state.currentDeposit[party];
	}
	
	function viewCurrentDeposit() public view restricted returns (uint[]) {
		uint[] memory balance = new uint[](2);
		balance[0] = state.currentDeposit[initiator];
		balance[1] = state.currentDeposit[counterpart];
		return balance;
	}

	function setCounterpart(address adr) 
		public 
		restrictedAccess(Party.Initiator) 
		verifyAtStage(Stage.NoCounterpart) 
		transitionNext 
	{
		require(adr != initiator, "Party is already the initiator");
		counterpart = adr;
		state.initialBalance[counterpart] = 0;
		state.currentDeposit[counterpart] = 0;
		state.finalBalance[counterpart] = 0;
	}

	function setPublicKey(address _sgx) 
		public
		restrictedAccess(Party.Initiator) 
		verifyAtStage(Stage.CounterpartSet) 
		transitionNext 
	{
		SgxAddress = _sgx;
	}

	function atStage(Stage _stage) internal view returns (bool) {
		return (state.stage == _stage);
	}

	function beforeStage(Stage endStage) internal view returns (bool) {
		assert(endStage != Stage.Finished);
		Stage newEndStage = Stage(uint(endStage) + 1);
		return betweenStages(Stage.InitialStage, newEndStage);
	}

	function betweenStages(Stage beginStage, Stage endStage) 
		internal 
		view 
		returns (bool) 
	{
		uint endStageInt = uint(endStage);
		uint beginStageInt = uint(beginStage);
		uint stage = uint(state.stage);
		return ((stage <= endStageInt) && (stage >= beginStageInt));
	}

	function cancelDepositContract() 
		public 
		restrictedAccess(Party.Initiator) 
		verifyAtStage(Stage.InitialStage) 
	{
		//Reset session before it began
		factory.removeDeposit();
		selfdestruct(initiator);
	}

	function drawMyBalance() 
		public 
		payable 
		verifyAtStage(Stage.PaymentChannelLocked) 
	{
		//After payment channel is active:
		if (msg.sender == initiator) {
			initiator.transfer(state.finalBalance[initiator]);
			state.finalBalance[initiator] = 0;
		} else if (msg.sender == counterpart) {
			counterpart.transfer(state.finalBalance[counterpart]);
			state.finalBalance[counterpart] = 0;
		} else {
			return;//Do not continue to next step.
		}
		//If both sides drawed, reset contract
		if (state.finalBalance[initiator] == 0 
		    && state.finalBalance[counterpart] == 0)
		{
			factory.removeDeposit();
			selfdestruct(initiator);//initiator gets leftovers
		}
	}

	function lockPublicSharedKey(address _sgx) 
		public 
		restrictedAccess(Party.Counterpart) 
		verifyAtStage(Stage.SettingKey) 
		transitionNext 
		returns (bool) 
	{
		if (_sgx == SgxAddress) {
			isKeySet = true;
		} else {
			state.stage = Stage(uint(state.stage) - 1);//revert stage
			SgxAddress = 0;
		}
		return isKeySet;
	}

	function setFinalState(uint[2] Totals, uint8 v, bytes32 r, bytes32 s)
		public 
		restricted 
		verifyAtStage(Stage.PaymentChannelOpen) 
		isSigned(Totals, v, r, s)
		transitionNext 
	{
		state.finalBalance[initiator] = Totals[0];
		state.finalBalance[counterpart] = Totals[1];
	}
}
