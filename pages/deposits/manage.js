import React, { Component } from 'react';
import { Grid } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import Cancel from '../../components/Cancel';

class Manage extends Component {
	static async getInitialProps(props) {
		return {
			depositAddress: props.query.address
		};
	}

	render() {
		return (
			<Layout>
				<h3> Payment Channel Managment </h3>
				<Grid>
					<Grid.Row>
						<Grid.Column>
							<Cancel address={this.props.depositAddress} />
						</Grid.Column>
					</Grid.Row>
				</Grid>
			</Layout>
		);
	}
}

export default Manage;
