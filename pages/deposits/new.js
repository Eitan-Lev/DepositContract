import React, { Component } from 'react';
import { Form, Button, Input, Message } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import factory from '../../ethereum/factory';
import web3 from '../../ethereum/web3';

class DepositNew extends Component {
  state = {
    initialDeposit: '',
    errorMessage: '',
    loading: false
  };

  onSubmit = async (event) => {
    event.preventDefault(); //So we won't send the data to the server

    this.setState({ loading: true, errorMessage: '' });

    try {
      const accounts = await web3.eth.getAccounts();
      await factory.methods.createDeposit().send({
        from: accounts[0],
        value: this.state.initialDeposit
      });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    }

    this.setState({ loading: false });

  };

  render() {
    return (
      <Layout>
        <h3>Create a New Deposit!</h3>

        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>Initial Deposit </label>
            <Input
              label="wei"
              labelPosition="right"
              value={this.state.initialDeposit}
              onChange={event => this.setState({ initialDeposit: event.target.value})}
              />
          </Form.Field>

          <Message error header="Something went wrong!" content={this.state.errorMessage} />
          <Button loading={this.state.loading} primary> Create! </Button>
        </Form>

      </Layout>
    );
  }
}

export default DepositNew;
