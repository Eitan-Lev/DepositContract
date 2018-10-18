import React from 'react';
import { Component } from 'react';
import {
	Form,
	Input,
	Message,
	Button,
	Segment,
	Label
} from 'semantic-ui-react';
import Deposit from '../ethereum/deposit';
import web3 from '../ethereum/web3';
import { Router } from '../routes';

class AddDepositForm extends Component {
	state = {
		value: '',
		errorMessage: '',
		loading: false
	};

	onSubmit = async event => {
		event.preventDefault();

		const deposit = Deposit(this.props.address);
		this.setState({ loading: true, errorMessage: '' });

		try {
			const accounts = await web3.eth.getAccounts();
			await deposit.methods.addDeposit().send({
				from: accounts[0],
				value: this.state.value
			});
			Router.replaceRoute(`/deposits/${this.props.address}`);
		} catch (err) {
			this.setState({ errorMessage: err.message });
		}

		this.setState({ loading: false, value: '' });
	};

	render() {
		return (
			<Segment>
				<Label attached="top" size="large">
					Deposit more money to the Channel
				</Label>
				<Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
					<Form.Field>
						<Input
							value={this.state.value}
							onChange={event => this.setState({ value: event.target.value })}
							label="wei"
							labelPosition="right"
							placeholder="insert the amount of wei you wish to deposit"
						/>
					</Form.Field>
					<Message error header="Oops!" content={this.state.errorMessage} />
					<Button loading={this.state.loading} primary>
						Deposit!
					</Button>
				</Form>
			</Segment>
		);
	}
}

export default AddDepositForm;
