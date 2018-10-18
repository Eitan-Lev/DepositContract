import React from 'react';
import { Component } from 'react';
import { Form, Button, Message } from 'semantic-ui-react';
import Deposit from '../ethereum/deposit';
import web3 from '../ethereum/web3';

class DrawBalance extends Component {
	state = {
		errorMessage: '',
		successMessage: '',
		loading: false
	};

	onSubmit = async event => {
		event.preventDefault();

		const deposit = Deposit(this.props.address);
		this.setState({ loading: true, errorMessage: '', successMessage: '' });

		try {
			const accounts = await web3.eth.getAccounts();
			await deposit.methods.drawMyBalance().send({
				from: accounts[0]
			});
		} catch (err) {
			this.setState({ errorMessage: err.message });
		}

		this.setState({ loading: false });
		if (this.state.errorMessage == null) {
			this.setState({
				successMessage: 'Your balance has been drawn successfully!'
			});
		}
	};

	render() {
		return (
			<Form
				onSubmit={this.onSubmit}
				error={!!this.state.errorMessage}
				success={!!this.state.successMessage}
			>
				<Message error header="Oops!" content={this.state.errorMessage} />
				<Message success header="Yay!" content={this.state.successMessage} />
				<Form.Button fluid positive loading={this.state.loading}>
					If the channel is closed, you can draw your balance by clicking here!
				</Form.Button>
			</Form>
		);
	}
}

export default DrawBalance;
