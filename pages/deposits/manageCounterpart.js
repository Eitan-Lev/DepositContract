import React, { Component } from 'react';
import { Grid, Divider } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import Cancel from '../../components/Cancel';
import ConfirmSGX from '../../components/ConfirmSGX';
import AddDepositForm from '../../components/AddDepositForm';
import DrawBalance from '../../components/DrawBalance';
import FinalStateForm from '../../components/FinalStateForm';

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
							<AddDepositForm address={this.props.address} />
						</Grid.Column>
					</Grid.Row>
					<Divider />

					<Grid.Row>
						<Grid.Column>
							<FinalStateForm address={this.props.address} />
						</Grid.Column>
					</Grid.Row>
					<Divider />

					<Grid.Row>
						<Grid.Column>
							<DrawBalance address={this.props.address} />
						</Grid.Column>
					</Grid.Row>
					<Divider />
				</Grid>
			</Layout>
		);
	}
}

export default ManageCounterpart;
