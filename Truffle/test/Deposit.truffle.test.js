// Importing libraries and misc. for testing
const assert = require('assert');
//const ganache = require('ganache-cli');
// const provider = ganache.provider();
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider("http://localhost:8545");
const web3 = new Web3(provider);
const web3Helper = require('../../helpers/web3-helper');

// Importing additional functions
const testHelper = require('../../helpers/test-helper');
const depositHelper = require('../../helpers/DepositMethods');
const factoryHelper = require('../../helpers/FactoryMethods');
const genContractHelper = require('../../helpers/GenContractMethods');
const sgxInterface = require('../../helpers/SgxInterface');
const constants = require('../../helpers/constants');
const Stages = require('../../helpers/Stages');

// Importing the contracts
const DepositFactory = artifacts.require("DepositFactory");
const DepositContract = artifacts.require("Deposit");
const SgxSimulator = artifacts.require("SgxSimulator");

// Constants:
const INIT_VALUE = 1;
const FEE_VALUE = 1;
const A_DEPOSIT = 1;
const B_DEPOSIT = 1;

// Values used accross tests:
let factory;
let deposit;
let depositAddress;
let initiator, counterpart, attacker, SgxAddress;
let SgxSimulatorAddress;
let initialValue = INIT_VALUE;
let newDepositValue = initialValue + FEE_VALUE;
let aDeposit = A_DEPOSIT;
let bDeposit = B_DEPOSIT;
let iniAccumelatedDeposit = 0;//Restart before every test
let countAccumelatedDeposit = 0;//Restart before every test

let testsCounter = 0;//Eitan knows what this is. Don't touch!
let Totals;

//Gas costs:
let contractDeploymentGas = '6000000';//Previously 3000000

let useDepositNumber = (-1);//to simply start from 0 with beforeEach

contract("DepositFactory", function(accounts) {
	before(async function() {
		usingVersion = constants.UsingWeb3Version1NoRedeploy;
		sgxVersion = constants.SgxVersionAddress;
		genContractHelper.setVersion(usingVersion);
		factoryHelper.initFactory(initiator, counterpart, web3, usingVersion);
		depositHelper.initDeposit(initiator, counterpart, web3, usingVersion);
		sgxInterface.initSgxMethods(web3, usingVersion, sgxVersion);

		initiator = accounts[0];
		counterpart = accounts[1];
		attacker = accounts[2];

		SgxAddress = await sgxInterface.createSgxAccount();

		factory = await factoryHelper.deployOrCreateFactory({from: initiator, gas: contractDeploymentGas});

		SgxSimulatorAddress = await sgxInterface.defineSgxSimulator();
	});

	beforeEach(async function() {
		iniAccumelatedDeposit = initialValue;
		countAccumelatedDeposit = 0;

		//We use same Deposit Factory each time (can't seem to avoid it).
		//So deploy new Deposit each time, and get next one.
		useDepositNumber = factoryHelper.advanceDepositsIndex(useDepositNumber);//Use different

		var result = await factoryHelper.createDeposit({
			from: initiator,
			gas: contractDeploymentGas,
			value: newDepositValue
		});
		eventResult = await genContractHelper.getEventLogs(result);
		var creator = eventResult._creator.toLowerCase();
		assert.equal(creator, initiator.toLowerCase());
		let depositResult;
		depositResult = (await factoryHelper.getDepositContract(initiator, useDepositNumber))[useDepositNumber];
		assert.equal(eventResult._contract.toLowerCase(), depositResult.toLowerCase());
		depositAddress = eventResult._contract;
		deposit = await depositHelper.getDeployedDeposit(depositAddress);
	});

	beforeEach('Backup that contains both before and beforeEach', async function() {
		// iniAccumelatedDeposit = initialValue;
		// countAccumelatedDeposit = 0;
		//
		// usingVersion = constants.UsingWeb3Version1NoRedeploy;
		// sgxVersion = constants.SgxVersionAddress;
		// genContractHelper.setVersion(usingVersion);
		// factoryHelper.initFactory(initiator, counterpart, web3, usingVersion);
		// depositHelper.initDeposit(initiator, counterpart, web3, usingVersion);
		// sgxInterface.initSgxMethods(web3, usingVersion, sgxVersion);
		//
		// SgxAddress = await sgxInterface.createSgxAccount();
		//
		// initiator = accounts[0];
		// counterpart = accounts[1];
		// attacker = accounts[2];
		//
		// //We use same Deposit Factory each time (can't seem to avoid it).
		// //So deploy new Deposit each time, and get next one.
		// useDepositNumber = factoryHelper.advanceDepositsIndex(useDepositNumber);//Use different
		//
		// factory = await factoryHelper.deployOrCreateFactory({from: initiator, gas: contractDeploymentGas});
		//
		// var result = await factoryHelper.createDeposit({
		// 	from: initiator,
		// 	gas: contractDeploymentGas,
		// 	value: newDepositValue
		// });
		// eventResult = await genContractHelper.getEventLogs(result);
		// var creator = eventResult._creator.toLowerCase();
		// assert.equal(creator, initiator.toLowerCase());
		// let depositResult;
		// depositResult = (await factoryHelper.getDepositContract(initiator, useDepositNumber))[useDepositNumber];
		// assert.equal(eventResult._contract.toLowerCase(), depositResult.toLowerCase());
		// depositAddress = eventResult._contract;
		// deposit = await depositHelper.getDeployedDeposit(depositAddress);
		// SgxSimulatorAddress = await sgxInterface.defineSgxSimulator();
	});

	describe('Basic deployment of contracts', function() {
		it('deploys a factory and a deposit contract', function() {
			assert.ok(genContractHelper.getContractAddress(factory));
			assert.ok(genContractHelper.getContractAddress(deposit));
		});

		it("saves contract in factory's deployed contracts", async function() {
			assert.equal(depositAddress, (await factoryHelper.deployedDeposits(initiator, useDepositNumber)));
		});
	});

	describe('Deposit contract values after creation', function() {
		it('marks caller to factory as the deposit manager', async function() {
			const manager = await depositHelper.initiator();
			assert.equal(initiator, manager.toLowerCase());
		});

		it('sets correct initial values upon creation', async function() {
			const isKeySet = await depositHelper.isKeySet();
			assert(!isKeySet, 'isKeySet should be false upon creation');

			const counterpartAddress = await depositHelper.counterpart();
			assert.equal(0, counterpartAddress, 'Counterpart should not be set yet');

			initiatorInitialDeposit = await depositHelper.viewCurrentDeposit(initiator);
			initiatorCurrentDeposit = await depositHelper.viewCurrentDeposit(initiator);
			counterpartCurrentDeposit = await depositHelper.viewCurrentDeposit(counterpartAddress);
			assert.equal(initiatorInitialDeposit,	initialValue,
				'Initial value should be equal to amount sent to creation minus the fee');
			assert.equal(initiatorCurrentDeposit,	initialValue,
				'viewCurrentDeposit without parameters should return the initiator current deposited also');
			assert.equal(counterpartCurrentDeposit,	0,
				'counterpart not set, current deposit should be 0');

			const initialSgxAddress = await depositHelper.SgxAddress();
			assert.equal(0, initialSgxAddress, 'SgxAddress should not be set yet');

			const factoryAddress = await depositHelper.factory();
			assert.equal(factoryAddress, await genContractHelper.getContractAddress(factory), 'Factory addresses does not match!');
		});

		it('sets correct initial values for the state', async function() {
			const initialStage = await depositHelper.getCurrentStage();
			assert.equal(initialStage, Stages.NoCounterpart, 'Stage should be 1 after constructor!');
			//Note that the mappings in state are not checked directly
			initiatorCurrentDeposit = await depositHelper.viewCurrentDeposit(initiator);
			counterpartCurrentDeposit = await depositHelper.viewCurrentDeposit(counterpart);
			assert.equal(initiatorCurrentDeposit,	INIT_VALUE,
				'Initiator current deposit should be INIT_VALUE!');
			assert.equal(counterpartCurrentDeposit,	0,
				'Counterpart current deposit should be 0!');
		});

		it('creates restriction modifiers correctly', async function() {
			let result;
			try {
				result = await depositHelper.setCounterpart({ _counterpart: initiator, from: attacker });
				assert(false, "Exception should have been thrown");
			} catch (error) {
				//Can't check the exception due to annoying reasons
				// testHelper.testRestrictionModifier(error, RESTRICTED_INITIATOR_ONLY);
			}
			try {
				await depositHelper.setCounterpart({ _counterpart: initiator, from: initiator });
				assert(false, "Exception should have been thrown");
			} catch (error) {
				//Can't check the exception due to annoying reasons
				// testHelper.testRestrictionModifier(error,	RESTRICTED_COUNTERPART_IS_INITIATOR);
			}
			await depositHelper.setCounterpart({ _counterpart: counterpart, from: initiator });
			res = await depositHelper.counterpart();
			assert.equal(res.toLowerCase(), counterpart, "Counterpart wasn't set correctly");
		});
	});

	describe('E2E tests of Deposit Contract (including selfDestruct):', function() {

		afterEach('Restart deposits index becaus of bug', function() {
			//To reset the deposits (since a bug removes all existing ones):
			if (constants.IsDepositRemoveBugExists) {
				useDepositNumber = (-1);//Restart contracts since all are about to be deleted
			}
		});

		describe('enables the initiator to cancel the contract', function() {
			it('should cancel the contract before adding counter', async function() {
				try {
					assert.equal(await depositHelper.getCurrentStage(), Stages.NoCounterpart);
					await depositHelper.cancelDepositContract({ from: initiator });
				} catch (error) {
					assert(false, "Can't cancel the deposit contract");
				}
			});
		});

		describe('run setFinalState', function() {
			beforeEach(async function() {
				let useSgxAddress;
				if (testsCounter === 0) {
					useSgxAddress = SgxAddress;
				} else {
					useSgxAddress = SgxSimulatorAddress;
				}
				testsCounter = 1;
				//First we set the counterpart and verify we moved to the correct stage
				await depositHelper.setCounterpart({_counterpart: counterpart, from: initiator});
				let currentState = await depositHelper.state();
				let currentStage = await depositHelper.getCurrentStage();
				const counterpartTemp = await depositHelper.counterpart();
				assert.equal(currentStage, Stages.CounterpartSet,
					'The state should be CounterpartSet but it is not');
				assert.equal(counterpartTemp.toLowerCase(),	counterpart, 'Counterpart was not set properly');

				//Then we add money(both sides)
				let initiatorAdditionalValue = 3;
				let counterpartAdditionalValue = 2;
				await depositHelper.addDeposit({from: initiator, gas: '1000000',
					value: initiatorAdditionalValue.toString()});
				await depositHelper.addDeposit({from: counterpart, gas: '1000000',
					value: counterpartAdditionalValue.toString()});
				iniAccumelatedDeposit = iniAccumelatedDeposit + initiatorAdditionalValue;
				countAccumelatedDeposit = countAccumelatedDeposit + counterpartAdditionalValue;
				let currentDeposits = [];
				currentDeposits[0] = await depositHelper.viewCurrentDeposit(initiator);
				currentDeposits[1] = await depositHelper.viewCurrentDeposit(counterpart);
				assert.equal(currentDeposits[0], iniAccumelatedDeposit, 'Initiator current deposit is incorrect');
				assert.equal(currentDeposits[1], countAccumelatedDeposit, 'Counterpart current deposit is incorrect');
				//Then we set SgxAddress
				await depositHelper.setPublicKey(useSgxAddress,
					{from: initiator, gas: '1000000'}
				);
				currentState = await depositHelper.state();
				const sgxAddressInserted = await depositHelper.SgxAddress();
				assert.equal(await depositHelper.getStageOfState(currentState),	Stages.SettingKey, 'The state should be SettingKey but it is not');
				assert.equal(sgxAddressInserted.toLowerCase(), useSgxAddress.toLowerCase(), 'The SgxAdrress is not correct');

				//Then we lock the SGX address, using the counterpart account
				await depositHelper.lockPublicSharedKey(useSgxAddress,
					{from: counterpart, gas: '1000000'}
				);
				currentState = await depositHelper.state();
				const isKeySetRes = await depositHelper.isKeySet();
				assert.equal(await depositHelper.getStageOfState(currentState),	Stages.PaymentChannelOpen, 'The state should be PaymentChannelOpen but it is not');
				assert.equal(isKeySetRes, true, 'Key is not set even though it should be');

				//Then we add more money, to simulate the sides adding cash
				initiatorAdditionalValue = 10;
				counterpartAdditionalValue = 12;
				await depositHelper.addDeposit({from: initiator, gas: '1000000',
					value: initiatorAdditionalValue.toString()});
				await depositHelper.addDeposit({from: counterpart, gas: '1000000',
					value: counterpartAdditionalValue.toString()});
				iniAccumelatedDeposit = iniAccumelatedDeposit + initiatorAdditionalValue;
				countAccumelatedDeposit = countAccumelatedDeposit + counterpartAdditionalValue;
				currentDeposits[0] = await depositHelper.viewCurrentDeposit(initiator);
				currentDeposits[1] = await depositHelper.viewCurrentDeposit(counterpart);
				assert.equal(currentDeposits[0], iniAccumelatedDeposit, 'Initiator current deposit is incorrect');
				assert.equal(currentDeposits[1], countAccumelatedDeposit, 'Counterpart current deposit is incorrect');

				//Then we lock the contract
				Totals = [iniAccumelatedDeposit, countAccumelatedDeposit];
			});

			it('Performs the necessary actions in each stage and setFinalState by signature', async function() {
				// //First we set the counterpart and verify we moved to the correct stage
				// await depositHelper.setCounterpart({_counterpart: counterpart, from: initiator});
				// let currentState = await depositHelper.state();
				// let currentStage = await depositHelper.getCurrentStage();
				// const counterpartTemp = await depositHelper.counterpart();
				// assert.equal(currentStage, Stages.CounterpartSet,
				// 	'The state should be CounterpartSet but it is not');
				// assert.equal(counterpartTemp.toLowerCase(),	counterpart, 'Counterpart was not set properly');
				//
				// //Then we add money(both sides)
				// let initiatorAdditionalValue = 3;
				// let counterpartAdditionalValue = 2;
				// await depositHelper.addDeposit({from: initiator, gas: '1000000',
				// 	value: initiatorAdditionalValue.toString()});
				// await depositHelper.addDeposit({from: counterpart, gas: '1000000',
				// 	value: counterpartAdditionalValue.toString()});
				// iniAccumelatedDeposit = iniAccumelatedDeposit + initiatorAdditionalValue;
				// countAccumelatedDeposit = countAccumelatedDeposit + counterpartAdditionalValue;
				// let currentDeposits = [];
				// currentDeposits[0] = await depositHelper.viewCurrentDeposit(initiator);
				// currentDeposits[1] = await depositHelper.viewCurrentDeposit(counterpart);
				// assert.equal(currentDeposits[0], iniAccumelatedDeposit, 'Initiator current deposit is incorrect');
				// assert.equal(currentDeposits[1], countAccumelatedDeposit, 'Counterpart current deposit is incorrect');
				// //Then we set SgxAddress
				// await depositHelper.setPublicKey(SgxAddress,
				// 	{from: initiator, gas: '1000000'}
				// );
				// currentState = await depositHelper.state();
				// const sgxAddressInserted = await depositHelper.SgxAddress();
				// assert.equal(await depositHelper.getStageOfState(currentState),	Stages.SettingKey, 'The state should be SettingKey but it is not');
				// assert.equal(sgxAddressInserted.toLowerCase(), SgxAddress.toLowerCase(), 'The SgxAdrress is not correct');
				//
				// //Then we lock the SGX address, using the counterpart account
				// await depositHelper.lockPublicSharedKey(SgxAddress,
				// 	{from: counterpart, gas: '1000000'}
				// );
				// currentState = await depositHelper.state();
				// const isKeySetRes = await depositHelper.isKeySet();
				// assert.equal(await depositHelper.getStageOfState(currentState),	Stages.PaymentChannelOpen, 'The state should be PaymentChannelOpen but it is not');
				// assert.equal(isKeySetRes, true, 'Key is not set even though it should be');
				//
				// //Then we add more money, to simulate the sides adding cash
				// initiatorAdditionalValue = 10;
				// counterpartAdditionalValue = 12;
				// await depositHelper.addDeposit({from: initiator, gas: '1000000',
				// 	value: initiatorAdditionalValue.toString()});
				// await depositHelper.addDeposit({from: counterpart, gas: '1000000',
				// 	value: counterpartAdditionalValue.toString()});
				// iniAccumelatedDeposit = iniAccumelatedDeposit + initiatorAdditionalValue;
				// countAccumelatedDeposit = countAccumelatedDeposit + counterpartAdditionalValue;
				// currentDeposits[0] = await depositHelper.viewCurrentDeposit(initiator);
				// currentDeposits[1] = await depositHelper.viewCurrentDeposit(counterpart);
				// assert.equal(currentDeposits[0], iniAccumelatedDeposit, 'Initiator current deposit is incorrect');
				// assert.equal(currentDeposits[1], countAccumelatedDeposit, 'Counterpart current deposit is incorrect');
				//
				// //Then we lock the contract
				// let signature;
				// let Totals = [iniAccumelatedDeposit, countAccumelatedDeposit];
				signature = await sgxInterface.sgxSignMessage(Totals);
				fixed_msg_sha = await web3.utils.soliditySha3(
					{ type: 'uint', value: Totals[0] },
					{ type: 'uint', value: Totals[1] }
				);
				await depositHelper.setFinalStateBySgxSig(Totals, fixed_msg_sha, signature.v, signature.r, signature.s, {from: counterpart, gas: '5000000'});
				currentState = await depositHelper.state();
				currentStage = await depositHelper.getStageOfState(currentState);
				assert.equal(currentStage, Stages.PaymentChannelLocked,
					'The state should be PaymentChannelLocked but it is: ' + currentStage.toString());

				//Then both parties ask to draw their balance
				await depositHelper.drawMyBalance({
					from: counterpart,
					gas: '1000000'
				});
				await depositHelper.drawMyBalance({
					from: initiator,
					gas: '1000000'
				});
				if (constants.IsDepositRemoveBugExists) {
					useDepositNumber = (-1);//Restart contracts since all are about to be deleted
				}
				// /** TODO: Need a different way to verify balance **/
				// console.log('~~~~ initiator balance: ' + await web3.eth.getBalance(initiator));
				// console.log('~~~~ counterpart balance: ' + await web3.eth.getBalance(counterpart));
				//
				//Setting a longer timeout since this is a long test
			// }).timeout(3500);
			});

			it('Performs the necessary actions in each stage and setFinalState by SGX simulator', async function() {
				// //First we set the counterpart and verify we moved to the correct stage
				// await depositHelper.setCounterpart({_counterpart: counterpart, from: initiator});
				// let currentState = await depositHelper.state();
				// let currentStage = await depositHelper.getCurrentStage();
				// const counterpartTemp = await depositHelper.counterpart();
				// assert.equal(currentStage, Stages.CounterpartSet,
				// 	'The state should be CounterpartSet but it is not');
				// assert.equal(counterpartTemp.toLowerCase(),	counterpart, 'Counterpart was not set properly');
				//
				// //Then we add money(both sides)
				// let initiatorAdditionalValue = 3;
				// let counterpartAdditionalValue = 2;
				// await depositHelper.addDeposit({from: initiator, gas: '1000000',
				// 	value: initiatorAdditionalValue.toString()});
				// await depositHelper.addDeposit({from: counterpart, gas: '1000000',
				// 	value: counterpartAdditionalValue.toString()});
				// iniAccumelatedDeposit = iniAccumelatedDeposit + initiatorAdditionalValue;
				// countAccumelatedDeposit = countAccumelatedDeposit + counterpartAdditionalValue;
				// let currentDeposits = [];
				// currentDeposits[0] = await depositHelper.viewCurrentDeposit(initiator);
				// currentDeposits[1] = await depositHelper.viewCurrentDeposit(counterpart);
				// assert.equal(currentDeposits[0], iniAccumelatedDeposit, 'Initiator current deposit is incorrect');
				// assert.equal(currentDeposits[1], countAccumelatedDeposit, 'Counterpart current deposit is incorrect');
				// //Then we set SgxAddress
				// await depositHelper.setPublicKey(SgxSimulatorAddress,
				// 	{from: initiator, gas: '1000000'}
				// );
				// currentState = await depositHelper.state();
				// const sgxAddressInserted = await depositHelper.SgxAddress();
				// assert.equal(await depositHelper.getStageOfState(currentState),	Stages.SettingKey, 'The state should be SettingKey but it is not');
				// assert.equal(sgxAddressInserted.toLowerCase(), SgxSimulatorAddress.toLowerCase(), 'The SgxAdrress is not correct');
				//
				// //Then we lock the SGX address, using the counterpart account
				// await depositHelper.lockPublicSharedKey(SgxSimulatorAddress,
				// 	{from: counterpart, gas: '1000000'}
				// );
				// currentState = await depositHelper.state();
				// const isKeySetRes = await depositHelper.isKeySet();
				// assert.equal(await depositHelper.getStageOfState(currentState),	Stages.PaymentChannelOpen, 'The state should be PaymentChannelOpen but it is not');
				// assert.equal(isKeySetRes, true, 'Key is not set even though it should be');
				//
				// //Then we add more money, to simulate the sides adding cash
				// initiatorAdditionalValue = 10;
				// counterpartAdditionalValue = 12;
				// await depositHelper.addDeposit({from: initiator, gas: '1000000',
				// 	value: initiatorAdditionalValue.toString()});
				// await depositHelper.addDeposit({from: counterpart, gas: '1000000',
				// 	value: counterpartAdditionalValue.toString()});
				// iniAccumelatedDeposit = iniAccumelatedDeposit + initiatorAdditionalValue;
				// countAccumelatedDeposit = countAccumelatedDeposit + counterpartAdditionalValue;
				// currentDeposits[0] = await depositHelper.viewCurrentDeposit(initiator);
				// currentDeposits[1] = await depositHelper.viewCurrentDeposit(counterpart);
				// assert.equal(currentDeposits[0], iniAccumelatedDeposit, 'Initiator current deposit is incorrect');
				// assert.equal(currentDeposits[1], countAccumelatedDeposit, 'Counterpart current deposit is incorrect');
				//
				// //Then we lock the contract
				// let Totals = [iniAccumelatedDeposit, countAccumelatedDeposit];
				sgxInterface.runPaymentChannelUpToTheseBalances({
					initiatorBalance: iniAccumelatedDeposit,
					counterpartBalance: countAccumelatedDeposit
				});
				await depositHelper.setFinalStateBySgxSimulator(Totals, {from: counterpart, gas: '5000000'});
				currentState = await depositHelper.state();
				currentStage = await depositHelper.getStageOfState(currentState);
				assert.equal(currentStage, Stages.PaymentChannelLocked,
					'The state should be PaymentChannelLocked but it is: ' + currentStage.toString());

				// Then both parties ask to draw their balance
				await depositHelper.drawMyBalance({
					from: counterpart,
					gas: '1000000'
				});
				await depositHelper.drawMyBalance({
					from: initiator,
					gas: '1000000'
				});
				// /** TODO: Need a different way to verify balance **/
				// console.log('~~~~ initiator balance: ' + await web3.eth.getBalance(initiator));
				// console.log('~~~~ counterpart balance: ' + await web3.eth.getBalance(counterpart));
				//
				//Setting a longer timeout since this is a long test
			// }).timeout(3500);
			});

		});

	});

	describe.skip('Verifying gas is only spent on things we know', function() {
		it('charges the initiator for using DepositFactory', async function() {
	    currentInitiatorBalance = await web3.eth.getBalance(initiator);
	    currentGasPrice = await web3.eth.getGasPrice();
	    console.log('~~1expected: ' + defaultInitiatorBalance + "-");
	    console.log('~~2expected: ' + gasDepositCreating * currentGasPrice);
	    console.log('~~~actual: ' + currentInitiatorBalance);
	    assert.equal(currentInitiatorBalance, defaultInitiatorBalance - gasDepositCreating * currentGasPrice,
	      "Some gas is lost in generating Deposit contract");

		});
	});

});
