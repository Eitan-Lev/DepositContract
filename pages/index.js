import React, { Component } from 'react';
import {
	Card,
	Button,
	Grid,
	Input,
	Divider,
	Form,
	Icon
} from 'semantic-ui-react';
import factory from '../ethereum/factory';
import Layout from '../components/Layout';
import { Link } from '../routes';
import web3 from '../ethereum/web3';

const my_address = '0x5af1585d3b6b49fc265b5eec6bc1a55a5ce93e2e';

class DepositIndex extends Component {
	static async getInitialProps() {
		const deposits = await factory.methods
			.getDepositContract(my_address)
			.call();
		//returning, so this component will now be available via props
		return { deposits };
	}

	state = {
		searchboxAddress: '',
		addressSearched: false,
		addressMetamask: false,
		items: ''
	};

	onSubmit = async event => {
		event.preventDefault();

		const deposits = await factory.methods
			.getDepositContract(this.state.searchboxAddress)
			.call();
		this.setState({
			addressSearched: true,
			addressMetamask: false,
			items: deposits.map(address => {
				return {
					header: address,
					description: (
						<Link route={`/deposits/${address}`}>
							<a>View Deposit</a>
						</Link>
					),
					fluid: true
				};
			})
		});
	};

	onSubmitMeta = async event => {
		event.preventDefault();

		const accounts = await web3.eth.getAccounts();
		const deposits = await factory.methods
			.getDepositContract(accounts[0])
			.call();
		{
			/*
        TODO: Check later if we need to add 'gas inside call'
        */
		}
		this.setState({
			addressSearched: false,
			addressMetamask: true,
			items: deposits.map(address => {
				return {
					header: address,
					description: (
						<Grid>
							<Grid.Row columns={2}>
								<Grid.Column>
									<Link route={`/deposits/${address}`}>
										<a>View Deposit</a>
									</Link>
								</Grid.Column>
								<Grid.Column textAlign="right">
									<Link
										route={`https://rinkeby.etherscan.io/address/${address}`}
									>
										<a>View Contract on Etherscan</a>
									</Link>
								</Grid.Column>
							</Grid.Row>
						</Grid>
					),
					fluid: true
				};
			})
		});
	};

	renderDeposits() {
		if (this.state.addressSearched) {
			return (
				<div>
					<h3>
						Displaying the channels where {this.state.searchboxAddress} is the
						initiator
					</h3>
					<Card.Group items={this.state.items} />
				</div>
			);
		} else if (this.state.addressMetamask) {
			return (
				<div>
					<h3>
						Displaying the channels where the active metamask account is the
						initiator
					</h3>
					<Card.Group items={this.state.items} />
				</div>
			);
		} else {
			return <h3> Choose one of the options above</h3>;
		}
	}

	render() {
		return (
			<Layout>
				<h2>Welcome to the payment channel home!</h2>
				<Grid>
					<Grid.Row>
						<Grid.Column width={8}>
							<Form onSubmit={this.onSubmit}>
								<Input
									fluid
									action={{ color: 'teal', content: 'Search' }}
									placeholder="Insert the address of the channel initiator here"
									value={this.state.searchboxAddress}
									onChange={event =>
										this.setState({ searchboxAddress: event.target.value })
									}
								/>
							</Form>
						</Grid.Column>
						<Grid.Column width={4}>
							<Form onSubmit={this.onSubmitMeta}>
								<Button floated="right" color="orange">
									Use the active metamask account
								</Button>
							</Form>
						</Grid.Column>
					</Grid.Row>
				</Grid>
				<Divider />
				{/*
				<Link route="/deposits/new">
					<a>
						<Button
							floated="right"
							content="Create a Deposit"
							icon="add circle"
							primary
						/>
					</a>
				</Link>
        */}
				<h3 />
				{this.renderDeposits()}
			</Layout>
		);
	}
}

export default DepositIndex;
