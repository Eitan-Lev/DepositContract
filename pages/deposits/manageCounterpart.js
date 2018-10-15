import React, { Component } from 'react';
import { Grid, Divider } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import Cancel from '../../components/Cancel';
import ConfirmSGX from '../../components/ConfirmSGX';
import AddDepositForm from '../../components/AddDepositForm';

class ManageCounterpart extends Component {
	static async getInitialProps(props) {
		const { address } = props.query;
		return { address };
	}

	render() {
		return (
			<Layout>
				<h3> Payment Channel Managment - Counterpart </h3>
				<Grid>
					<Grid.Row>
						<Grid.Column>
							<ConfirmSGX address={this.props.address} />
						</Grid.Column>
					</Grid.Row>

					<Divider />
					<Grid.Row>
						<Grid.Column>
							<h4> Add More Money to the Channel</h4>
						</Grid.Column>
					</Grid.Row>
					<Grid.Row>
						<Grid.Column>
							<AddDepositForm address={this.props.address} />
						</Grid.Column>
					</Grid.Row>
				</Grid>
			</Layout>
		);
	}
}

export default ManageCounterpart;
