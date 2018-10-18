import React from 'react';
import { Component } from 'react';
import { Form, Button, Message } from 'semantic-ui-react';
import Deposit from '../ethereum/deposit';
import web3 from '../ethereum/web3';

class Cancel extends Component {
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
			await deposit.methods.cancelDepositContract().send({
				from: accounts[0]
			});
		} catch (err) {
			this.setState({ errorMessage: err.message });
		}

		this.setState({ loading: false });
		if (this.state.errorMessage == null) {
			this.setState({
				successMessage:
					'The deposit was canceled successfully! Unfortunately \
          currently that means that all deposits of initiator were deleted.'
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
				<Form.Button fluid negative loading={this.state.loading}>
					If you are yet to set a counterpart, you can cancel this channel by
					clicking here
				</Form.Button>
			</Form>
		);
	}
}

export default Cancel;
