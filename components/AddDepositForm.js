import React from 'react';
import { Component } from 'react';
import {
	Form,
	Input,
	Message,
	Button,
	Segment,
	Label,
	Dropdown
} from 'semantic-ui-react';
import Deposit from '../ethereum/deposit';
import web3 from '../ethereum/web3';
import { Router } from '../routes';

class AddDepositForm extends Component {
	state = {
		value: '',
		errorMessage: '',
		loading: false,
		currency: 'wei'
	};

	onSubmit = async event => {
		event.preventDefault();

		const deposit = Deposit(this.props.address);
		this.setState({ loading: true, errorMessage: '' });

		try {
			const accounts = await web3.eth.getAccounts();
			const valueInwei =
				this.state.currency == 'wei'
					? this.state.value
					: web3.utils.toWei(this.state.value, 'ether');

			await deposit.methods.addDeposit().send({
				from: accounts[0],
				value: valueInwei
			});
			Router.replaceRoute(`/deposits/${this.props.address}`);
		} catch (err) {
			this.setState({ errorMessage: err.message });
		}

		this.setState({ loading: false, value: '' });
	};

	render() {
		const options = [
			{ key: 'wei', text: 'wei', value: 'wei' },
			{ key: 'ether', text: 'ether', value: 'ether' }
		];

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
							label={
								<Dropdown
									onChange={(e, data) => {
										this.setState({ currency: data.value });
									}}
									defaultValue="wei"
									options={options}
								/>
							}
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
