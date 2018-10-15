import React from 'react';
import { Component } from 'react';
import { Form, Input, Message, Button } from 'semantic-ui-react';
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
			<Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
				<Form.Field>
					<label> Deposit money into this channel! </label>
					<Input
						value={this.state.value}
						onChange={event => this.setState({ value: event.target.value })}
						label="wei"
						labelPosition="right"
					/>
				</Form.Field>
				<Message error header="Oops!" content={this.state.errorMessage} />
				<Button loading={this.state.loading} primary>
					Deposit!
				</Button>
			</Form>
		);
	}
}

export default AddDepositForm;
