import React, { Component } from 'react';
import { Card, Button } from 'semantic-ui-react';
import factory from '../ethereum/factory';
import Layout from '../components/Layout';

const my_address = '0x5af1585d3b6b49fc265b5eec6bc1a55a5ce93e2e';

class DepositIndex extends Component {
  static async getInitialProps() {
    const deposits = await factory.methods.getDepositContract(my_address).call();
    //returning, so this component will now be available via props
    return { deposits };
  }

  renderDeposits() {
    const items = this.props.deposits.map(address => {
      return {
        header: address,
        description: <a>View Deposit in etherscan</a>,
        fluid: true
      }
    });
    return <Card.Group items={items} />;
  }

  render() {
    return (
      <Layout>
        <div>
          <h2>The current user is the initiator of</h2>
          <h3>Active Deposits</h3>
          <Button
            floated="right"
            content="Create a Deposit"
            icon="add circle"
            primary
          />
          {this.renderDeposits()}
          </div>
        </Layout>
    );
  }
}

export default DepositIndex;
