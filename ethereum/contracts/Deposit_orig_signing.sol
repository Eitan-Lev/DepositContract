pragma solidity ^0.4.17;//for keccak256 and security issues


/**
* A contract used to create Deposit contracts. This contract can be deployed
* once and any user that wants to initiate a Deposit contract can access it.
*/
contract DepositFactory {

	//Using mappings means we can't know simply how many contracts exist.
	//Also, there is no way to iterate over all contracts.
	//Creator => Contract because creator has to know somehow what is the address of hes contracts.
	mapping(address => address) public depositsCreators;
	//Contract => Creator to be able to destroy cotnracts.
	mapping(address => address[]) public deployedDeposits;
	uint feeValue = 1;

	/**
	* createDeposit
	* Generates a new Deposit Contract. A fee has to be send to this function,
	* to cover the cost of creating. Any sum above the fee will
	* be added to the Deposit.
	*/
	function createDeposit() public payable {
		require(msg.value >= feeValue, "Not enough money sent.");
		//initialized to 0
		uint initialDeposit;
		if (msg.value > feeValue) initialDeposit = msg.value - feeValue;
		address newDeposit = (new Deposit).value(initialDeposit)(msg.sender);
		(deployedDeposits[msg.sender]).push(newDeposit);
		depositsCreators[newDeposit] = msg.sender;
		// Don't return anything since it's payable,
		// which does not go well with return values
	}

	//function getDeployedDeposits() public view returns (address[]) {
		//return deployedDepositsArray;
	//}

	/**
	* getDepositContract
	* Gets all the addresses of contracts created by 'creator'.
	* returns 0x000... if creator does not exist
	*/
	function getDepositContract(address creator) public view returns (address[]) {
		return deployedDeposits[creator];
	}

	/**
	* getDepositContractCreator
	* Gets the address of the creator of 'depositContract'.
	* returns 0x000... if creator does not exist
	*/
	function getDepositContractCreator(address depositContract) public view returns (address) {
		return depositsCreators[depositContract];
	}

	/**
	* removeDeposit
	* Removes all the contracts that were created by the user using this function.
	* TODO: change to remove specific contract in the future
	* TODO: This function requires more changes
	*/
	function removeDeposit() public {
		//Currently the remove causes all contracts of a creator to be removed (undesired behaviour)
		delete deployedDeposits[(depositsCreators[msg.sender])];//Only relevant if sent by a contract, so need to restrict
		delete depositsCreators[msg.sender];//Only relevant if sent by a contract, so need to restrict
	}
}


/**
* A contract used for payment channel between two parties. Can be generated
* using the DepositFactory contract.
*/
contract Deposit {

	enum Party {
		Counterpart,
		Initiator
	}

	// An enum used to specify the stage of the contract.
	enum Stage {
		InitialStage,
		NoCounterpart,
		CounterpartSet,
		SettingKey,
		PaymentChannelOpen,
		PaymentChannelLocked,
		Finished
	}

	// A field of the contract that contains all the information about the
	// channel. This is the definition of the struct.
	struct State {
		mapping(address => uint) initialBalance;
		mapping(address => uint) currentDeposit;
		mapping(address => uint) finalBalance;
    bool finalBalanceSet; /*TODO: Not needed, but removing causes bug */
		Stage stage;
	}

	State public state;

	//Saves the factory address for self termination state.
	DepositFactory public factory;
	address public initiator;
	address public counterpart;

	address public SgxAddress;

	bool public isKeySet = false;

	/**
	* constructor
	* Called by a DepositFactory and sets all the fields for the new Deposit
	* contract. An amount of ether can be passed to the account and it will be
	* treated as if it was ether that the initiator passed to the contract.
	*/
	constructor(address creator) public payable transitionNext {
		factory = DepositFactory(msg.sender);
		initiator = creator;
		State memory newState = State({
			stage: Stage.InitialStage,
      finalBalanceSet: true
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
	 * addDeposit
	 * Adds ethereum to the relevant account (the one that called this function).
	 * Calling is allowed at all stages, but irrelevant from Locked stage.
	 */
	function addDeposit() public payable restricted {
		require(msg.value > 0, "Pay more than 0 please.");
		if (msg.sender == initiator) {	//the initiator adds money
			state.currentDeposit[initiator] += (msg.value);
		} else if (betweenStages(Stage.CounterpartSet, Stage.PaymentChannelOpen)) {
      //counterpart adds money
			state.currentDeposit[counterpart] += (msg.value);
		}
	}

	// Modifier - Allows both initiator and counterpart
	modifier restricted() {
		require(msg.sender == counterpart || msg.sender == initiator,
			"Only this channel's parties have permission for this action");
		_;
	}

	// Modifier - Allows only one of the parties to use a function, according to
	// what is sets by us in that function.
	modifier restrictedAccess(Party party) {
		address adr = (party == Party.Initiator) ? initiator : counterpart;
		require(msg.sender == adr, "You lack permissions for this action");
		_;
	}

	/* TODO: Amit - Need explanation here */
	//modifier isSigned(uint[2] Totals, uint8 v, bytes32 r, bytes32 s)
	modifier isSigned(uint[2] Totals, bytes32 TotalsBytes, uint8 v, bytes32 r, bytes32 s)
	{
		require(sha3(Totals) == TotalsBytes, "Sha3 of totals does not match given Sha3");
		bytes memory prefix = "\x19Ethereum Signed Message:\n32";
		bytes32 msgHash = keccak256(abi.encodePacked(prefix, TotalsBytes));
		require(ecrecover(msgHash, v, r, s) == SgxAddress, "Verify signature failed");
		_;
	}

	/**
	 * nextStage
	 * Moves the contract to the next stage, if possible and allowrd.
	 * TODO: Amit - many mixed assertions and requirements. This function needs a
	 * a bit re-factoring
	 */
	function nextStage() internal {
		/* TODO: Amit - why both of them? */
		require(state.stage != Stage.Finished, "Assert fails");
		assert(state.stage != Stage.Finished);
		Stage _stage = state.stage;
		state.stage = Stage(uint(_stage) + 1);
		require(state.stage != Stage.Finished, "Assert fails");
		assert(uint(state.stage) <= uint(Stage.Finished));
	}

	/**
	 * getErrorMsgAccordingToStage
	 * Returns a string describing the current stage of the account.
	 */
	function getErrorMsgAccordingToStage(Stage _stage) internal pure returns (string) {
		if (_stage == Stage.InitialStage) {
			return "InitialStage";
		} else if (_stage == Stage.NoCounterpart) {
			return "NoCounterpart";
		} else if (_stage == Stage.CounterpartSet) {
			return "Counterpart already set!";
		} else if (_stage == Stage.SettingKey) {
			return "SettingKey";
		} else if (_stage == Stage.PaymentChannelOpen) {
			return "PaymentChannelOpen";
		} else if (_stage == Stage.PaymentChannelLocked) {
			return "Final state was not yet given";
		} else if (_stage == Stage.Finished) {
			return "Finished";
		} else {
			return "No valid error message was found. THIS IS VERY BAD!!!";
		}
	}

	// Modifier - Makes sure we are in the stage we assume
	modifier verifyAtStage(Stage _stage) {
		require(atStage(_stage), getErrorMsgAccordingToStage(state.stage));
		_;
	}

	/* TODO: Amit - what is this modifier for?. Can we make it prettier?*/
	// Modifier - Not used for modifying, but more to change the stage into the
	// the next one
	modifier transitionNext() {
		_;
		nextStage();
	}

	/**
	 * viewCurrentDeposit
	 * Returns a value corresponding to the party's current deposit.
	 */
	function viewCurrentDeposit(address party) public view restricted returns (uint) {
		return state.currentDeposit[party];
	}

	/**
	 * viewCurrentDeposit
	 * Returns a value corresponding to the parties current deposits.
	 * array[0] is the deposit of the initiator and array[1] is deposit of the
	 * counterpart.
	 */
	function viewCurrentDeposit() public view restricted returns (uint[]) {
		uint[] memory balance = new uint[](2);
		balance[0] = state.currentDeposit[initiator];
		balance[1] = state.currentDeposit[counterpart];
		return balance;
	}

	/**
	 * setCounterpart
	 * Allows (only!) the initator to set the counterpart for the channel.
	 * After this call the contract moves to the next stage - CounterpartSet.
	 */
	function setCounterpart(address adr) public restrictedAccess(Party.Initiator)
		verifyAtStage(Stage.NoCounterpart) transitionNext {
		require(adr != initiator, "Party is already the initiator");
		counterpart = adr;
		state.initialBalance[counterpart] = 0;
		state.currentDeposit[counterpart] = 0;
		state.finalBalance[counterpart] = 0;
	}

	/**
	 * setPublicKey
	 * Allows (only!) the initator to set the address (agreed by both parties'
	 * SGXs).
	 * After this call the contract moves to the next stage - SettingKey.
	 */
	function setPublicKey(address _sgx) public restrictedAccess(Party.Initiator)
		verifyAtStage(Stage.CounterpartSet) transitionNext
	{
		SgxAddress = _sgx;
	}

	/**
	 * atStage
	 * Returns true if the current contract's stage is '_stge' and false otherwise
	 */
	function atStage(Stage _stage) internal view returns (bool) {
		return (state.stage == _stage);
	}

	/**
	 * beforeStage
	 * TODO: Amit - add documentation, consider removing
	 */
	/*function beforeStage(Stage endStage) internal view returns (bool) {
		require(state.stage != Stage.Finished, "Assert fails");
		assert(endStage != Stage.Finished);
		Stage newEndStage = Stage(uint(endStage) + 1);
		return betweenStages(Stage.InitialStage, newEndStage);
	}*/

	/**
	 * betweenStages
	 * TODO: Amit - add documentation, consider removing
	 */
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

	/**
	 * cancelDepositContract
	 * Allows (only!) the initator to cancel the contract. This action is allowed
	 * only if the contract is in the initial stage.
	 */
	function cancelDepositContract() public restrictedAccess(Party.Initiator)
		verifyAtStage(Stage.NoCounterpart)	{
		//Reset session before it began
		factory.removeDeposit();
		selfdestruct(initiator);
	}

	/**
	 * drawMyBalance
	 * Allows the initiator and counterpart to draw their balance and by that
   * terminating the channel.
   * This action is allowed only if the contract is in the correct stage.
	 */
	function drawMyBalance() public payable
		verifyAtStage(Stage.PaymentChannelLocked) {
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
    /** TODO maybe there is a prettier way to do it? asking if balance is 0 could be problematic */
		if (state.finalBalance[initiator] == 0
		    && state.finalBalance[counterpart] == 0)
		{
			factory.removeDeposit();
			selfdestruct(initiator);//initiator gets leftovers
		}
	}

	/**
	 * lockPublicSharedKey
	 * Allows (only!) the counterpart to lock the key, if the stage is correct
	 * and if the address he supplied as the SGX's address matches the one supplied
	 * earlier by the initiator. Return value indicates if the lock succeeded.
	 * After a successful call the contract moves to the next stage - PaymentChannelOpen.
	 */
	function lockPublicSharedKey(address _sgx) public restrictedAccess(Party.Counterpart)
		verifyAtStage(Stage.SettingKey) transitionNext returns (bool){
		if (_sgx == SgxAddress) {
			isKeySet = true;
		} else {
			state.stage = Stage(uint(state.stage) - 1);//revert stage
			SgxAddress = 0;
		}
		return isKeySet;
	}

	/* TODO: Amit - add documentation */
	//function setFinalState(uint[2] Totals, uint8 v, bytes32 r, bytes32 s)
	function setFinalState(uint[2] Totals, bytes32 TotalsBytes, uint8 v, bytes32 r, bytes32 s)
		public
		restricted
		verifyAtStage(Stage.PaymentChannelOpen)
		isSigned(Totals, TotalsBytes, v, r, s)
		//isSigned(Totals, v, r, s)
		transitionNext
	{
		state.finalBalance[initiator] = uint(Totals[0]);
		state.finalBalance[counterpart] = uint(Totals[1]);
	}

  // A helper function to get all the information we want to display in
  // the front-end
  function getSummary() public view returns (address, address, address, bool, uint, uint, Stage) {
    return (
      initiator, counterpart, SgxAddress, isKeySet,
      state.currentDeposit[initiator], state.currentDeposit[counterpart],
      state.stage
    );
  }

}
