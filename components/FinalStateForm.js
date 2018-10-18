import React from 'react';
import { Component } from 'react';
import {
	Form,
	Input,
	Message,
	Button,
	Grid,
	Segment,
	Label
} from 'semantic-ui-react';
import Deposit from '../ethereum/deposit';
import web3 from '../ethereum/web3';
import { Router } from '../routes';

class FinalStateForm extends Component {
	state = {
		initiatorFinalBalance: '',
		counterpartFinalBalance: '',
		errorMessage: '',
		loading: false
	};

	onSubmit = async event => {
		event.preventDefault();

		const deposit = Deposit(this.props.address);
		this.setState({ loading: true, errorMessage: '' });
		const Totals = [
			this.state.initiatorFinalBalance,
			this.state.counterpartFinalBalance
		];

		try {
			const accounts = await web3.eth.getAccounts();
			await deposit.methods.setFinalState(Totals).send({
				from: accounts[0]
			});
			Router.replaceRoute(`/deposits/${this.props.address}`);
		} catch (err) {
			this.setState({ errorMessage: err.message });
		}

		this.setState({ loading: false });
	};

	render() {
		return (
			<Segment>
				<Label size="large" attached="top">
					Close The Payment Channel
				</Label>
				<Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
					<Grid>
						<Grid.Row columns={2}>
							<Grid.Column>
								<Form.Input
									label="Initiator Final Balance"
									value={this.state.initiatorFinalBalance}
									onChange={event =>
										this.setState({ initiatorFinalBalance: event.target.value })
									}
									placeholder="insert final balance in wei"
								/>
							</Grid.Column>
							<Grid.Column>
								<Form.Input
									label="Counterpart Final Balance"
									value={this.state.counterpartFinalBalance}
									onChange={event =>
										this.setState({
											counterpartFinalBalance: event.target.value
										})
									}
									placeholder="insert final balance in wei"
								/>
							</Grid.Column>
						</Grid.Row>

						<Grid.Row>
							<Grid.Column>
								<Message
									error
									header="Oops!"
									content={this.state.errorMessage}
								/>
								<Button loading={this.state.loading} primary>
									Close the channel!
								</Button>
							</Grid.Column>
						</Grid.Row>
					</Grid>
				</Form>
			</Segment>
		);
	}
}

export default FinalStateForm;
