import React from 'react';
import { Component } from 'react';
import { Form, Button, Message } from 'semantic-ui-react';
import Deposit from '../ethereum/deposit';

class Cancel extends Component {
	state = {
		errorMessage: '',
		loading: false
	};

	onSubmit = async event => {
		event.preventDefault();
		console.log('prevented');
		const deposit = Deposit(this.props.address);
		this.setState({ loading: true, errorMessage: '' });

		try {
			const accounts = await web3.eth.getAccounts();
			console.log('got accounts');
			console.log('for example accounts[0] is ' + accounts[0]);
			await deposit.methods.cancelDepositContract().send({
				from: accounts[0]
			});
		} catch (err) {
			this.setState({ errorMessage: err.message });
		}

		this.setState({ loading: false });
	};

	render() {
		return (
			<Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
				<Message error header="Oops!" content={this.state.errorMessage} />
				<Form.Button fluid negative loading={this.state.loading}>
					If you are yet to set a counterpart, you can cancel this channel
				</Form.Button>
			</Form>
		);
	}
}

export default Cancel;
