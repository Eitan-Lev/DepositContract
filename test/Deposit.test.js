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
const RESTRICTED_INITIATOR_ONLY =
	'VM Exception while processing transaction: revert You lack permissions for this action';
const RESTRICTED_COUNTERPART_ONLY =
	'VM Exception while processing transaction: revert Restricted to counterpart only: restrictedCounter';
const RESTRICTED_COUNTERPART_IS_INITIATOR =
	'VM Exception while processing transaction: revert Party is already the initiator';
const RESTRICTED_COUNTERPART_ALREADY_SET = '';
const RESTRICTED_COUNTERPART_NOT_YET_SET = '';
const RESTRICTED_CONTRACT_IS_LOCKED = '';
const RESTRICTED_ONLY_INVOLVED_PARTIES = '';
const INIT_VALUE = 1;
const FEE_VALUE = 1;
const A_DEPOSIT = 1;
const B_DEPOSIT = 1;

//let accounts;
let deposit, factory;
let depositAddress;
let initiator, counterpart, attacker;
let SgxAddress;
let aDeposit = A_DEPOSIT;
let bDeposit = B_DEPOSIT;
let web3;
//let defaultInitiatorBalance = 100000000000000000000;

// Runs before each test
beforeEach(async () => {
	// console.log('see.. this function is run EACH time');
	web3 = web3Helper.initWeb3(); //FIXME This is here for legacy. Lazy to change old calls
	[
		initiator,
		counterpart,
		attacker,
		SgxAddress
	] = await web3Helper.getAccounts();
	initialValue = INIT_VALUE;
	factory = await web3Helper.newFactoryContract(compiledFactory, initiator);
	web3Helper.setProvider(factory);

	// Not sure why - but these two lines solve the factory issue. TODO understand
	// and apply these changes
	//factory.options.gasPrice = '2000'; // default gas price in wei
	factory.options.gasPrice = '20'; // default gas price in wei
	factory.options.gas = 5000000; // provide as fallback always 5M gas

	// Using the factory's method "createDeposit" to create a new deposit contract
	// gasDepositCreating = await web3.eth.estimateGas(await factory.methods.createDeposit().send({
	// 	from: initiator,
	// 	gas: '3000000',
	// 	value: initialValue + FEE_VALUE
	// }));
	await factory.methods.createDeposit().send({
		from: initiator,
		gas: '3000000',
		value: initialValue + FEE_VALUE
	});

	//Fancy way to do const array = await...; depositAddress = array[0];
	[depositAddress] = await factory.methods.getDepositContract(initiator).call();
	//[depositAddress] = await factory.methods.getDeployedDeposits().call();
	deposit = await web3Helper.newDepositContract(
		compiledDeposit,
		depositAddress
	);
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
		console.log('~~~~~~~~~~ initiator: ' + initiator);
		console.log('~~~~~~~~~~ typeof initiator: ' + typeof initiator);
	});

	it("saves contract in factory's deployed contracts", async () => {
		assert.equal(
			depositAddress,
			await factory.methods.deployedDeposits(initiator, 0).call()
		);
	});
});

describe('Deposit contract values after creation', () => {
	it('marks caller to factory as the deposit manager', async () => {
		const manager = await deposit.methods.initiator().call();
		assert.equal(initiator, manager);
	});

	it('sets correct initial values upon creation', async () => {
		const isKeySet = await deposit.methods.isKeySet().call();
		assert(!isKeySet, 'isKeySet should be false upon creation');

		const counterpart = await deposit.methods.counterpart().call();
		assert.equal(0, counterpart, 'Counterpart should not be set yet');

		const initiatorInitialDeposit = await deposit.methods
			.viewCurrentDeposit(initiator)
			.call();
		assert.equal(
			initiatorInitialDeposit,
			initialValue,
			'Initial value should be equal to amount sent to creation minus the fee'
		);

		[
			initiatorCurrentDeposit,
			counterpartCurrentDeposit
		] = await deposit.methods.viewCurrentDeposit().call();
		assert.equal(
			initiatorCurrentDeposit,
			initialValue,
			'viewCurrentDeposit without parameters should return the initiator current deposited also'
		);
		assert.equal(
			counterpartCurrentDeposit,
			0,
			'counterpart not set, current deposit should be 0'
		);

		const initialSgxAddress = await deposit.methods.SgxAddress().call();
		assert.equal(0, initialSgxAddress, 'SgxAddress should not be set yet');

		const factoryAddress = await deposit.methods.factory().call();
		assert.equal(
			factoryAddress,
			factory.options.address,
			'Factory addresses does not match!'
		);
	});

	it('sets correct initial values for the state', async () => {
		const initialInitialState = await deposit.methods.state().call();
		const initialStage = initialInitialState['stage'];
		assert.equal(initialStage, 1, 'Stage should be 1 after constructor!');
		//Note that the mappings in state are not checked directly
		const initialCurrentDeposits = await deposit.methods
			.viewCurrentDeposit()
			.call();
		assert.equal(
			initialCurrentDeposits[0],
			INIT_VALUE,
			'Initiator current deposit should be INIT_VALUE!'
		);
		assert.equal(
			initialCurrentDeposits[1],
			0,
			'Counterpart current deposit should be 0!'
		);
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
			testHelper.testRestrictionModifier(
				error,
				RESTRICTED_COUNTERPART_IS_INITIATOR
			);
		}
		let res;
		await deposit.methods.setCounterpart(counterpart).send({
			from: initiator,
			gas: '1000000'
		});
		res = await deposit.methods.counterpart().call();
		assert.equal(res, counterpart, "Counterpart wasn't set correctly");
	});
});

describe('Test keys', () => {
	it('check that key works', async () => {
		let initiator_online = '0x2EEC49EAb23f2082a2876D249FCAEF306E490bEa';
		let counterpart_online = '0x5AF1585D3B6B49FC265B5eEc6Bc1A55A5Ce93E2e';
		let sgx_online = '0x2EEC49EAb23f2082a2876D249FCAEF306E490bEa';
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
		assert(isKeySet, 'Key was not set correctly');
		let signature;
		let Totals = [aDeposit, bDeposit];
		//hexTotals = await web3.utils.sha3(Totals);//FIXME this is the theoritical correct way, but does not work.
		fixed_msg_sha = await web3.utils.soliditySha3(
			{ type: 'uint', value: Totals[0] },
			{ type: 'uint', value: Totals[1] }
		);
		//signature = await web3.eth.sign(hexTotals, SgxAddress);
		signature = await web3.eth.sign(fixed_msg_sha, SgxAddress);
		signature = signature.substr(2); //remove 0x
		let r = '0x' + signature.slice(0, 64);
		let s = '0x' + signature.slice(64, 128);
		let v = '0x' + signature.slice(128, 130);
		assert(
			web3Helper.isHexStrict(r) &&
				web3Helper.isHexStrict(s) &&
				web3Helper.isHexStrict(v),
			'either v, r, or s is not strictly hex'
		);
		//const v_decimal = web3Helper.hexToNumber(v) + 27;
		//assert(v_decimal == 27 || v_decimal == 28, "v_decimal is not 27 or 28");
		const v_decimal = web3Helper.toV_Decimal(v);
		try {
			res = await testHelper.setFinalState(
				Totals,
				fixed_msg_sha,
				v_decimal,
				r,
				s,
				counterpart
			);
		} catch (error) {
			assert(false, error);
		}
	});
});

describe('Basic behavior of Deposit contract', () => {
	it('enables the initiator to cancel the contract', async () => {
		try {
			const initialInitialState = await deposit.methods.state().call();
			await deposit.methods.cancelDepositContract().call({ from: initiator });
		} catch (error) {
			assert(false, "Can't cancel the deposit contract");
		}
	});

	it('Performs the necessary actions in each stage', async () => {
		//First we set the counterpart and verify we moved to the correct stage
		await deposit.methods.setCounterpart(counterpart).send({
			from: initiator,
			gas: '1000000'
		});
		let currentState = await deposit.methods.state().call();
		const counterpartTemp = await deposit.methods.counterpart().call();
		assert.equal(
			currentState['stage'],
			2,
			'The state should be CounterpartSet but it is not'
		);
		assert.equal(
			counterpartTemp,
			counterpart,
			'Counterpart was not set properly'
		);

		//Then we add money(both sides)
		await deposit.methods.addDeposit().send({
			from: initiator,
			gas: '1000000',
			value: '3'
		});
		await deposit.methods.addDeposit().send({
			from: counterpart,
			gas: '1000000',
			value: '2'
		});
		let currentDeposits = await deposit.methods.viewCurrentDeposit().call();
		assert.equal(
			currentDeposits[0],
			initialValue + 3,
			'Initiator current deposit is incorrect'
		);
		assert.equal(
			currentDeposits[1],
			2,
			'Initiator current deposit is incorrect'
		);

		//Then we set SgxAddress
		await deposit.methods.setPublicKey(SgxAddress).send({
			from: initiator,
			gas: '1000000'
		});
		currentState = await deposit.methods.state().call();
		const sgxAddressInserted = await deposit.methods.SgxAddress().call();
		assert.equal(
			currentState['stage'],
			3,
			'The state should be SettingKey but it is not'
		);
		assert.equal(
			sgxAddressInserted,
			SgxAddress,
			'The SgxAdress is not correct'
		);

		//Then we lock the SGX address, using the counterpart account
		await deposit.methods.lockPublicSharedKey(SgxAddress).send({
			from: counterpart,
			gas: '1000000'
		});
		currentState = await deposit.methods.state().call();
		const isKeySetRes = await deposit.methods.isKeySet().call();
		assert.equal(
			currentState['stage'],
			4,
			'The state should be PaymentChannelOpen but it is not'
		);
		assert.equal(isKeySetRes, true, 'Key is not set even though it should be');

		//Then we add more money, to simulate the sides adding cash
		await deposit.methods.addDeposit().send({
			from: initiator,
			gas: '1000000',
			value: '10'
		});
		await deposit.methods.addDeposit().send({
			from: counterpart,
			gas: '1000000',
			value: '12'
		});
		currentDeposits = await deposit.methods.viewCurrentDeposit().call();
		assert.equal(
			currentDeposits[0],
			initialValue + 13,
			'Initiator current deposit is incorrect'
		);
		assert.equal(
			currentDeposits[1],
			14,
			'Counterpart current deposit is incorrect'
		);

		//Then we lock the contract
		let signature;
		let Totals = [currentDeposits[0], currentDeposits[1]];
		fixed_msg_sha = await web3.utils.soliditySha3(
			{ type: 'uint', value: Totals[0] },
			{ type: 'uint', value: Totals[1] }
		);
		signature = await web3.eth.sign(fixed_msg_sha, SgxAddress);
		signature = signature.substr(2); //remove 0x
		let r = '0x' + signature.slice(0, 64);
		let s = '0x' + signature.slice(64, 128);
		let v = '0x' + signature.slice(128, 130);
		assert(
			web3Helper.isHexStrict(r) &&
				web3Helper.isHexStrict(s) &&
				web3Helper.isHexStrict(v),
			'either v, r, or s is not strictly hex'
		);
		const v_decimal = web3Helper.toV_Decimal(v);
		await deposit.methods
			.setFinalState(Totals, fixed_msg_sha, v_decimal, r, s)
			.send({
				from: counterpart,
				gas: '2000000'
			});
		currentState = await deposit.methods.state().call();
		assert.equal(
			currentState['stage'],
			5,
			'The state should be PaymentChannelLocked but it is not'
		);

		//Then both parties ask to draw their balance
		await deposit.methods.drawMyBalance().send({
			from: counterpart,
			gas: '1000000'
		});
		await deposit.methods.drawMyBalance().send({
			from: initiator,
			gas: '1000000'
		});
		// /** TODO: Need a different way to verify balance **/
		// console.log('~~~~ initiator balance: ' + await web3.eth.getBalance(initiator));
		// console.log('~~~~ counterpart balance: ' + await web3.eth.getBalance(counterpart));

		//Setting a longer timeout since this is a long test
	}).timeout(3500);
});

// describe('Verifying gas is only spent on things we know', () => {
// 	it('charges the initiator for using DepositFactory', async () => {
//     currentInitiatorBalance = await web3.eth.getBalance(initiator);
//     currentGasPrice = await web3.eth.getGasPrice();
//     console.log('~~1expected: ' + defaultInitiatorBalance + "-");
//     console.log('~~2expected: ' + gasDepositCreating * currentGasPrice);
//     console.log('~~~actual: ' + currentInitiatorBalance);
//     assert.equal(currentInitiatorBalance, defaultInitiatorBalance - gasDepositCreating * currentGasPrice,
//       "Some gas is lost in generating Deposit contract");
//
// 	});
// });
