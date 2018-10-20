import React, { Component } from 'react';
import { Card, Grid, Button, Step, Segment } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import Deposit from '../../ethereum/deposit';
import AddDepositForm from '../../components/AddDepositForm';
import { Link } from '../../routes';
import web3 from '../../ethereum/web3';

class DepositShow extends Component {
	state = {
		userInitiator: false,
		userCounterpart: false,
		userOther: false
	};

	static async getInitialProps(props) {
		//Accessing the contract for data
		const deposit = Deposit(props.query.address); //the address of the actual deposit
		const summary = await deposit.methods.getSummary().call();
		const accounts = await web3.eth.getAccounts();

		return {
			depositAddress: props.query.address,
			initiatorAddress: summary[0],
			counterpartAddress: summary[1],
			sgxAddress: summary[2],
			isKeySet: summary[3] ? 'True' : 'False',
			initiatorBalance: summary[4],
			counterpartBalance: summary[5],
			contractStage: summary[6],
			userInitiator: accounts[0] == summary[0],
			userCounterpart: accounts[0] == summary[1],
			userOther: accounts[0] != summary[0] && accounts[0] != summary[1]
		};
	}

	renderSteps() {
		const currentStage = this.props.contractStage;
		const steps = [
			{
				key: 'created',
				title: 'Created',
				active: currentStage == 1,
				description: 'the pament channel was created',
				style: { overflowWrap: 'break-word' }
			},
			{
				key: 'counterpart',
				title: 'Counterpart',
				active: currentStage == 2,
				completed: true,
				description: 'a counterpart was set',
				style: { overflowWrap: 'break-word' }
			},
			{
				key: 'key',
				title: 'Key',
				active: currentStage == 3,
				description: 'a public key was set',
				style: { overflowWrap: 'break-word' }
			},
			{
				key: 'open',
				title: 'Open',
				active: currentStage == 4,
				description: 'the channel is now open',
				style: { overflowWrap: 'break-word' }
			},
			{
				key: 'closed',
				title: 'Closed',
				active: currentStage == 5,
				description: 'money can now be withdrawn',
				style: { overflowWrap: 'break-word' }
			}
		];

		return <Step.Group fluid items={steps} />;
	}

	renderCards() {
		var {
			initiatorAddress,
			counterpartAddress,
			sgxAddress,
			isKeySet,
			initiatorBalance,
			counterpartBalance,
			contractStage
		} = this.props;

		const items = [
			{
				header: initiatorAddress,
				meta: 'Address of initiator',
				description:
					'The initiator created this deposit and can add counterparts',
				style: { overflowWrap: 'break-word' }
			},
			{
				header: counterpartAddress == 0 ? 'Not Set' : counterpartAddress,
				meta: 'Address of counterpart',
				description: 'The counterpart is the other party of the contract',
				style: { overflowWrap: 'break-word' }
			},
			{
				header: sgxAddress == 0 ? 'Not Set' : sgxAddress,
				meta: 'Address of SGX',
				description:
					'The address, or public key, of the SGX that both sides approved',
				style: { overflowWrap: 'break-word' }
			},
			{
				header: isKeySet,
				meta: 'Is the public key set?',
				description: 'Have both sides decided on a key'
			},
			{
				header: this.props.userOther
					? 'Only available to parties'
					: initiatorBalance,
				meta: "Initiator's balance (wei)",
				description:
					'How much money do the initiator currently have in the deposit?'
			},
			{
				header: this.props.userOther
					? 'Only available to parties'
					: counterpartBalance,
				meta: "Counterpart's balance (wei)",
				description:
					'How much money do the counterpart currently have in the deposit?'
			}
		];

		return <Card.Group items={items} />;
	}

	renderButtons() {
		if (this.props.userInitiator) {
			return (
				<div>
					<Link route={`/deposits/${this.props.depositAddress}/manage`}>
						<a>
							<Button color="green">Manage this contract as initiator</Button>
						</a>
					</Link>
					<Grid.Row>
						<Button disabled color="grey">
							Manage this contract as counterpart
						</Button>
					</Grid.Row>
				</div>
			);
		} else if (this.props.userCounterpart) {
			return (
				<div>
					<Button disabled color="grey">
						Manage this contract as initiator
					</Button>
					<Grid.Row>
						<Link
							route={`/deposits/${this.props.depositAddress}/manageCounterpart`}
						>
							<a>
								<Button color="green">
									Manage this contract as counterpart
								</Button>
							</a>
						</Link>
					</Grid.Row>
				</div>
			);
		} else {
			return (
				<div>
					<Button disabled color="grey">
						Manage this contract as initiator
					</Button>
					<Grid.Row>
						<Button disabled color="grey">
							Manage this contract as counterpart
						</Button>
					</Grid.Row>
				</div>
			);
		}
	}

	render() {
		return (
			<Layout>
				<h3> Deposit Show </h3>
				<Grid>
					<Grid.Row>
						<Grid.Column width={10}>{this.renderCards()}</Grid.Column>
						<Grid.Column width={6}>
							<AddDepositForm address={this.props.depositAddress} />
							<Grid.Row>{this.renderButtons()}</Grid.Row>
						</Grid.Column>
					</Grid.Row>
					<Grid.Row>
						<Grid.Column>{this.renderSteps()}</Grid.Column>
					</Grid.Row>
				</Grid>
			</Layout>
		);
	}
}

export default DepositShow;
