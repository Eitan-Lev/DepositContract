// Importing libraries and misc. for testing
const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);

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

//let accounts;
let factory;
let depositAddress;
let deposit;
let initiator;
let counterpart;
let attacker;
let SgxAddress;

// Runs before each test
beforeEach(async () => {
  // console.log('see.. this function is run EACH time');
  //accounts = await web3.eth.getAccounts();
  [initiator, counterpart, attacker, SgxAddress] = await web3.eth.getAccounts();
  initialValue = INIT_VALUE;
  //initiator = accounts[0];
  //counterpart = accounts[1];
  //attacker = accounts[2];

  factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode })
    .send({ from: initiator, gas: '3000000' });
  factory.setProvider(provider);

  // Not sure why - but these two lines solve the factory issue. TODO understand
  // and apply these changes
  //factory.options.gasPrice = '20000000000000'; // default gas price in wei
  factory.options.gasPrice = '2000'; // default gas price in wei
  factory.options.gas = 5000000; // provide as fallback always 5M gas

  // Using the factory's method "createDeposit" to create a new deposit
  // contract
  await factory.methods.createDeposit().send({
    from: initiator,
    gas: '3000000',
    value: initialValue + FEE_VALUE
    //value: '1'
  });

  //Fancy way to do const array = await...; depositAddress = array[0];
  [depositAddress] = await factory.methods.getDepositContract(initiator).call();
  //[depositAddress] = await factory.methods.getDeployedDeposits().call();
  deposit = await new web3.eth.Contract(
    JSON.parse(compiledDeposit.interface),
    depositAddress
  );
  //campaign.setProvider(provider); TODO campaign??
});

describe('Deposits', () => {
	it('deploys a factory and a deposit', () => {
		assert.ok(factory.options.address);
		assert.ok(deposit.options.address);
	});

	it('marks caller as the deposit manager', async () => {
		const manager = await deposit.methods.initiator().call();
		assert.equal(initiator, manager);
	});

	it('validate contract was deployed', async () => {
		assert.equal(depositAddress, await factory.methods.deployedDeposits(initiator,0).call());
	});

	it('validate initial values upon creation', async () => {
		const isKeySet = await deposit.methods.isKeySet().call();
		assert(!isKeySet, "Key should be false upon creation");
		const counterpart = await deposit.methods.counterpart().call();
		assert.equal(0, counterpart, "Counterpart should not be set yet");
		const initiatorInitialDeposit = await deposit.methods.viewCurrentDeposit(initiator).call();
		assert.equal(initiatorInitialDeposit, initialValue, "Initial value should be equal to amount sent to creation minus the fee");
		[initiatorCurrentDeposit, counterpartCurrentDeposit] = await deposit.methods.viewCurrentDeposit().call();
		assert.equal(initiatorCurrentDeposit, initialValue, "viewCurrentDeposit without parameters should return the initiator current deposited also");
		assert.equal(counterpartCurrentDeposit, 0, "counterpart not set, current deposit should be 0");
	});

	it('validate restriction modifiers upon creation', async () => {
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
		//let signature = testHelper.getSignature(web3, SgxAddress, "asdsd");//FIXME change random string
		//signature = signature.substr(2); //remove 0x
		//const r = '0x' + signature.slice(0, 64);
		//const s = '0x' + signature.slice(64, 128);
		//const v = '0x' + signature.slice(128, 130);
		//const v_decimal = web3.toDecimal(v);
		//let aDeposit = 4;
		//let bDeposit = 4;
		//let Totals = [aDeposit, bDeposit];
		//res = await deposit.methods.setFinalState(
				//Totals,
				//v_decimal,
				//r,
				//s
				//).send({ 
			//from: counterpart,
			//gas: '1000000'
		//});
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
});
