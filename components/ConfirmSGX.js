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

class SGXInsert extends Component {
	state = {
		sgxAddress: '',
		errorMessage: '',
		loading: false
	};

	onSubmit = async event => {
		event.preventDefault();

		const deposit = Deposit(this.props.address);
		this.setState({ loading: true, errorMessage: '' });

		try {
			const accounts = await web3.eth.getAccounts();
			await deposit.methods.lockPublicSharedKey(this.state.SgxAdderss).send({
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
			<Segment>
				<Label size="large" attached="top">
					Confirm the SGX address
				</Label>
				<Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
					<Form.Input
						value={this.state.SgxAdderss}
						onChange={event =>
							this.setState({ SgxAdderss: event.target.value })
						}
						placeholder="Insert the address of the SGX to confirm it "
					/>
					<Message error header="Oops!" content={this.state.errorMessage} />
					<Button loading={this.state.loading} primary>
						Insert!
					</Button>
				</Form>
			</Segment>
		);
	}
}

export default SGXInsert;
