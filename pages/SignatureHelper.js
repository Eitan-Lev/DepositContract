import React from 'react';
import { Component } from 'react';
import {
	Divider,
	Label,
	Grid,
	Button,
	Input,
	Form,
	Message
} from 'semantic-ui-react';
import Layout from '../components/Layout';
import web3 from '../ethereum/web3';

class SignatureHelper extends Component {
	state = {
		initiatorFinalBalance: '',
		counterpartFinalBalance: '',
		sgxAddress: '',
		loading: false,
		msg_sha: '',
		r: '',
		s: '',
		v: ''
	};

	onSubmit = async event => {
		event.preventDefault();
		this.setState({ loading: true });

		const Totals = [
			this.state.initiatorFinalBalance,
			this.state.counterpartFinalBalance
		];

		const fixed_msg_sha = await web3.utils.soliditySha3(
			{ type: 'uint', value: Totals[0] },
			{ type: 'uint', value: Totals[1] }
		);

		let signature = await web3.eth.sign(fixed_msg_sha, this.state.sgxAddress);
		signature = signature.substr(2); //remove 0x
		console.log('////////' + signature);
		let r = '0x' + signature.slice(0, 64);
		let s = '0x' + signature.slice(64, 128);
		let v = '0x' + signature.slice(128, 130);
		const v_decimal = web3.utils.hexToNumber(v) + 27;
		{
			/*}
		assert(
			web3Helper.isHexStrict(r) &&
				web3Helper.isHexStrict(s) &&
				web3Helper.isHexStrict(v),
			'either v, r, or s is not strictly hex'
		);*/
		}

		console.log('~~~ right before assigning');
		this.setState({
			msg_sha: fixed_msg_sha,
			r: r,
			s: s,
			v: v
		});

		this.setState({ loading: false });
	};

	renderSig() {
		return (
			<Grid>
				<Grid.Row>
					<Grid.Column>
						<Message
							header="SHA of the balances"
							content={this.state.msg_sha}
						/>
					</Grid.Column>
				</Grid.Row>
				<Grid.Row>
					<Grid.Column>
						<Message header="R" content={this.state.r} />
					</Grid.Column>
				</Grid.Row>
				<Grid.Row>
					<Grid.Column>
						<Message header="S" content={this.state.s} />
					</Grid.Column>
				</Grid.Row>
				<Grid.Row>
					<Grid.Column>
						<Message header="V" content={this.state.v} />
					</Grid.Column>
				</Grid.Row>
			</Grid>
		);
	}

	render() {
		return (
			<Layout>
				<h1> Signature Helper </h1>
				<Form onSubmit={this.onSubmit}>
					<Grid>
						<Grid.Row columns={2}>
							<Grid.Column>
								<Form.Input
									label="Desired Initiator Final Balance"
									value={this.state.initiatorFinalBalance}
									onChange={event =>
										this.setState({
											initiatorFinalBalance: event.target.value
										})
									}
									placeholder="insert final balance in wei"
								/>
							</Grid.Column>
							<Grid.Column>
								<Form.Input
									label="Desired Counterpart Final Balance"
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

						<Grid.Row columns={1}>
							<Grid.Column>
								<Form.Input
									value={this.state.sgxAddress}
									onChange={event =>
										this.setState({ sgxAddress: event.target.value })
									}
									label="Address of the SGX"
									placeholder="insert the address of SGX used for signing"
									fluid
								/>
							</Grid.Column>
						</Grid.Row>
						<Grid.Row>
							<Grid.Column>
								<Form.Button loading={this.state.loading} primary>
									Generate signature!
								</Form.Button>
							</Grid.Column>
						</Grid.Row>
					</Grid>
				</Form>
				<Divider />
				{this.renderSig()}
			</Layout>
		);
	}
}

export default SignatureHelper;
