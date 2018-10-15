import React from 'react';
import { Component } from 'react';
import { Form, Input, Message, Button } from 'semantic-ui-react';
import Deposit from '../ethereum/deposit';
import web3 from '../ethereum/web3';
import { Router } from '../routes';

class CounterpartInsert extends Component {
	state = {
		counterpartAddress: '',
		errorMessage: '',
		loading: false
	};

	onSubmit = async event => {
		event.preventDefault();

		const deposit = Deposit(this.props.address);
		this.setState({ loading: true, errorMessage: '' });

		try {
			const accounts = await web3.eth.getAccounts();
			await deposit.methods.setCounterpart(this.state.counterpartAddress).send({
				from: accounts[0]
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
					<label> Insert the address of the counterpart </label>
					<Input
						value={this.state.counterpartAddress}
						onChange={event =>
							this.setState({ counterpartAddress: event.target.value })
						}
					/>
				</Form.Field>
				<Message error header="Oops!" content={this.state.errorMessage} />
				<Button loading={this.state.loading} primary>
					Insert!
				</Button>
			</Form>
		);
	}
}

export default CounterpartInsert;
