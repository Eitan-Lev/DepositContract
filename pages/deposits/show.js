import React, { Component } from 'react';
import Layout from '../../components/Layout';
import Deposit from '../../ethereum/deposit';
import { Card, Grid, Button } from 'semantic-ui-react';
import AddDepositForm from '../../components/AddDepositForm';
import { Link } from '../../routes';

class DepositShow extends Component {
	static async getInitialProps(props) {
		//Accessing the contract for data
		const deposit = Deposit(props.query.address); //the address of the actual deposit
		const summary = await deposit.methods.getSummary().call();
		return {
			depositAddress: props.query.address,
			initiatorAddress: summary[0],
			counterpartAddress: summary[1],
			sgxAddress: summary[2],
			isKeySet: summary[3],
			initiatorBalance: summary[4],
			counterpartBalance: summary[5]
		};
	}

	renderCards() {
		const {
			initiatorAddress,
			counterpartAddress,
			sgxAddress,
			isKeySet,
			initiatorBalance,
			counterpartBalance
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
				header: counterpartAddress,
				meta: 'Address of counterpart',
				description: 'The counterpart is the other party of the contract',
				style: { overflowWrap: 'break-word' }
			},
			{
				header: sgxAddress,
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
				header: initiatorBalance,
				meta: "Initiator's balance (wei)",
				description:
					'How much money do the initiator currently have in the deposit?'
			},
			{
				header: counterpartBalance,
				meta: "Counterpart's balance (wei)",
				description:
					'How much money do the counterpart currently have in the deposit?'
			}
		];

		return <Card.Group items={items} />;
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
						</Grid.Column>
					</Grid.Row>

					<Grid.Row>
						<Grid.Column>
							<Link route={`/deposits/${this.props.depositAddress}/manage`}>
								<a>
									<Button secondary> Manage this contract!</Button>
								</a>
							</Link>
						</Grid.Column>
					</Grid.Row>
				</Grid>
			</Layout>
		);
	}
}

export default DepositShow;
