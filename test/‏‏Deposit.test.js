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
const A_DEPOSIT = 100;
const B_DEPOSIT = 1000000000000000000;

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
	initiator = '0x2EEC49EAb23f2082a2876D249FCAEF306E490bEa';
	counterpart = '0x5AF1585D3B6B49FC265B5eEc6Bc1A55A5Ce93E2e';
	SgxAddress = '0x2EEC49EAb23f2082a2876D249FCAEF306E490bEa';
	attacker = '0x211C49EAb23f2082a2876D249FCAEF306E490bEa';

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
