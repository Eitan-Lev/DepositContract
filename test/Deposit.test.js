// Importing libraries and misc. for testing
const assert = require('assert');
//const ganache = require('ganache-cli');
//const Web3 = require('web3');
//const provider = ganache.provider();
//const web3 = new Web3(provider);//TODO under trial
const web3Helper = require('../helpers/web3-helper');
//const ethUtil = require('ethereumjs-util');//FIXME under trial


// Importing additional functions
const testHelper = require('../helpers/test-helper');

// Importing the contracts
const compiledFactory = require('../ethereum/build/DepositFactory.json');
const compiledDeposit = require('../ethereum/build/Deposit.json');

// Constants:
//const RESTRICTED_INITIATOR_ONLY = "VM Exception while processing transaction: revert Restricted to initiator only: restrictedInit";
const RESTRICTED_INITIATOR_ONLY = "VM Exception while processing transaction: revert You lack permissions for this action";
const RESTRICTED_COUNTERPART_ONLY = "VM Exception while processing transaction: revert Restricted to counterpart only: restrictedCounter";
const RESTRICTED_COUNTERPART_IS_INITIATOR = "VM Exception while processing transaction: revert Party is already the initiator";
const RESTRICTED_COUNTERPART_ALREADY_SET = "";
const RESTRICTED_COUNTERPART_NOT_YET_SET = "";
const RESTRICTED_CONTRACT_IS_LOCKED = "";
const RESTRICTED_ONLY_INVOLVED_PARTIES = "";
const INIT_VALUE = 1;
const FEE_VALUE = 1;
const A_DEPOSIT = 1;
const B_DEPOSIT = 1;

//let accounts;
let factory;
let depositAddress;
let deposit;
let initiator;
let counterpart;
let attacker;
let SgxAddress;
let aDeposit = A_DEPOSIT;
let bDeposit = B_DEPOSIT;
let web3;

// Runs before each test
beforeEach(async () => {
	// console.log('see.. this function is run EACH time');
	web3 = web3Helper.initWeb3();//FIXME This is here for legacy. Lazy to change old calls
	[initiator, counterpart, attacker, SgxAddress] = await web3Helper.getAccounts();
	initialValue = INIT_VALUE;
	factory = await web3Helper.newFactoryContract(compiledFactory, initiator);
	web3Helper.setProvider(factory);

	// Not sure why - but these two lines solve the factory issue. TODO understand
	// and apply these changes
	//factory.options.gasPrice = '2000'; // default gas price in wei
	factory.options.gasPrice = '20'; // default gas price in wei
	factory.options.gas = 5000000; // provide as fallback always 5M gas

	// Using the factory's method "createDeposit" to create a new deposit contract
	await factory.methods.createDeposit().send({
		from: initiator,
		gas: '3000000',
		value: initialValue + FEE_VALUE
	});

	//Fancy way to do const array = await...; depositAddress = array[0];
	[depositAddress] = await factory.methods.getDepositContract(initiator).call();
	//[depositAddress] = await factory.methods.getDeployedDeposits().call();
	deposit = await web3Helper.newDepositContract(compiledDeposit, depositAddress);
	//campaign.setProvider(provider); TODO campaign??
	//TODO
	// Initialize the helper.
	// Save the contracts so we do not have to send them.
	// Send the web3Helper in case we need. Preffered behaviour is not to use that.
	// FIXME currently does not work, need to fix. Always send the contract;
	testHelper.initTestHelper(factory, deposit, web3Helper);
});

describe('Basic deployment of contracts', () => {
	it('deploys a factory and a deposit contract', () => {
		assert.ok(factory.options.address);
		assert.ok(deposit.options.address);
	});

	it('saves contract in factory\'s deployed contracts', async () => {
		assert.equal(depositAddress, await factory.methods.deployedDeposits(initiator,0).call());
	});
});

describe('Deposit contract values after creation', () => {
	it('marks caller to factory as the deposit manager', async () => {
		const manager = await deposit.methods.initiator().call();
		assert.equal(initiator, manager);
	});

	it('sets correct initial values upon creation', async () => {
		const isKeySet = await deposit.methods.isKeySet().call();
		assert(!isKeySet, "isKeySet should be false upon creation");

		const counterpart = await deposit.methods.counterpart().call();
		assert.equal(0, counterpart, "Counterpart should not be set yet");

		const initiatorInitialDeposit = await deposit.methods.viewCurrentDeposit(initiator).call();
		assert.equal(initiatorInitialDeposit, initialValue, "Initial value should be equal to amount sent to creation minus the fee");

		[initiatorCurrentDeposit, counterpartCurrentDeposit] = await deposit.methods.viewCurrentDeposit().call();
		assert.equal(initiatorCurrentDeposit, initialValue, "viewCurrentDeposit without parameters should return the initiator current deposited also");
		assert.equal(counterpartCurrentDeposit, 0, "counterpart not set, current deposit should be 0");

		const initialSgxAddress = await deposit.methods.SgxAddress().call();
		assert.equal(0, initialSgxAddress, "SgxAddress should not be set yet");

		const factoryAddress = await deposit.methods.factory().call();
		assert.equal(factoryAddress, factory.options.address, "Factory addresses does not match!");
	});

	it('sets correct initial values for the state', async () => {
		const initialInitialState = await deposit.methods.state().call();
		const initialFinalBalanceSet = initialInitialState['finalBalanceSet'];
		const initialStage = initialInitialState['stage'];
		assert.equal(initialFinalBalanceSet, false, "FinalBalanceSet should be false!");
		assert.equal(initialStage, 1, "Stage should be 1 after constructor!");
		//Note that the mappings in state are not checked directly
		const initialCurrentDeposits = await deposit.methods.viewCurrentDeposit().call();
		assert.equal(initialCurrentDeposits[0], INIT_VALUE, "Initiator current deposit should be INIT_VALUE!");
		assert.equal(initialCurrentDeposits[1], 0, "Counterpart current deposit should be 0!");
	});

	it('creates restriction modifiers correctly', async () => {
		try {
			await deposit.methods.setCounterpart(initiator).call({ from: attacker });
		} catch (error) {
			testHelper.testRestrictionModifier(error, RESTRICTED_INITIATOR_ONLY);
		}
		try {
			await deposit.methods.setCounterpart(initiator).call({ from: initiator });
		} catch (error) {
			testHelper.testRestrictionModifier(error, RESTRICTED_COUNTERPART_IS_INITIATOR);
		}
		let res
		await deposit.methods.setCounterpart(counterpart).send({
			from: initiator,
			gas: '1000000'
		});
		res = await deposit.methods.counterpart().call();
		assert.equal(res, counterpart, "Counterpart wasn't set correctly");
	});
});

// describe('Basic behavior of Deposit contract', () => {
// 	it('enables the initiator to cancel the contract', async () => {
// 		try {
// 			await deposit.methods.cancelDepositContract().call({ from: initiator});
// 		} catch (error) {
// 			console.log('Error: ' + error);
// 			assert(false, "Can't cancel the deposit contract");
// 		}
// 	});
// });

describe('Test keys', () => {
	it('check that key works', async () => {
		await deposit.methods.setCounterpart(counterpart).send({
			from: initiator,
			gas: '1000000'
		});
		await deposit.methods.setPublicKey(SgxAddress).send({
			from: initiator,
			gas: '1000000'
		});
		let isKeySet;
		let res;
		isKeySet = await deposit.methods.lockPublicSharedKey(SgxAddress).send({
			from: counterpart,
			gas: '1000000'
		});
		assert(isKeySet, "Key was not set correctly");
		let signature;
		let Totals = [aDeposit,bDeposit];
		//hexTotals = await web3.utils.sha3(Totals);//FIXME this is the theoritical correct way, but does not work.
		fixed_msg_sha = await web3.utils.soliditySha3({type: 'uint', value: Totals[0]}, {type: 'uint', value: Totals[1]});
		//signature = await web3.eth.sign(hexTotals, SgxAddress);
		signature = await web3.eth.sign(fixed_msg_sha, SgxAddress);
		signature = signature.substr(2); //remove 0x
		let r = '0x' + signature.slice(0, 64);
		let s = '0x' + signature.slice(64, 128);
		let v = '0x' + signature.slice(128, 130);
		assert(web3Helper.isHexStrict(r) && web3Helper.isHexStrict(s) && web3Helper.isHexStrict(v), "either v, r, or s is not strictly hex");
		//const v_decimal = web3Helper.hexToNumber(v) + 27;
		//assert(v_decimal == 27 || v_decimal == 28, "v_decimal is not 27 or 28");
		const v_decimal = web3Helper.toV_Decimal(v);
		try {
			res = await testHelper.setFinalState(Totals, fixed_msg_sha, v_decimal, r, s, counterpart);
		} catch (error) {
			assert(false, error);
		}
	});
});
  //it('allows people to contribute money and marks them as approvers', async () => {
    //await campaign.methods.contribute().send({
      //value: '200',
      //from: accounts[1]
    //});
    //const isContributor = await campaign.methods.approvers(accounts[1]).call();
    //assert(isContributor);
  //});

  //it('requires a minimum contribution', async () => {
    //try {
      //await campaign.methods.contribute().send({
        //value: '5',
        //from: accounts[1]
      //});
      //assert(false);
    //} catch (err) {
      //assert(err);
    //}
  //});

  //it('allows a manager to make a payment request', async () => {
    //await campaign.methods
      //.createRequest('Buy batteries', '100', accounts[1])
      //.send({
        //from: accounts[0],
        //gas: '1000000'
      //});
    //const request = await campaign.methods.requests(0).call();

    //assert.equal('Buy batteries', request.description);
  //});

  //it('processes requests', async () => {
    //await campaign.methods.contribute().send({
      //from: accounts[0],
      //value: web3.utils.toWei('10', 'ether')
    //});

    //await campaign.methods
      //.createRequest('A', web3.utils.toWei('5', 'ether'), accounts[1])
      //.send({ from: accounts[0], gas: '1000000' });

    //await campaign.methods.approveRequest(0).send({
      //from: accounts[0],
      //gas: '1000000'
    //});

    //await campaign.methods.finalizeRequest(0).send({
      //from: accounts[0],
      //gas: '1000000'
    //});

    //let balance = await web3.eth.getBalance(accounts[1]);
    //balance = web3.utils.fromWei(balance, 'ether');
    //balance = parseFloat(balance);

    //assert(balance > 104);
  //});
