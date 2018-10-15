import React, { Component } from 'react';
import { Form,  Input, Message, Button } from 'semantic-ui-react';
import Deposit from '../ethereum/deposit';
import web3 from '../ethereum/web3';
import { Router } from '../routes';

class ManagementForm extends Component {
  state = {
    counterpartAddress: '',
    errorMessage: '',
    loading: false
  };

  onSubmitCounterpart = async (event) => {
    event.preventDefault();

    const deposit = Deposit(this.props.address);
    //Doesn't work without this line
    deposit.options.address = this.props.address;

    this.setState({ loading: true, errorMessage: '' });
    try {
      const accounts = await web3.eth.getAccounts();
      await deposit.methods.setCounterpart(this.state.counterpartAddress).send({
        from: accounts[0],
        gasLimit: 5000000
      });
      Router.replaceRoute(`/deposits/${this.props.address}`);
    } catch (err) {
      this.setState({ errorMessage: err.message });
    }
    this.setState({ loading: false, counterpartAddress: ''});
  }

  render() {
    return (
        <Form onSubmit={this.onSubmitCounterpart} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>Insert counterpart address </label>
            <Input
              value={this.state.counterpartAddress}
              onChange={event => this.setState({ counterpartAddress: event.target.value})}
            />
          </Form.Field>

          <Message error header="Oops!" content={this.state.errorMessage} />
          <Button loading={this.state.loading}> Submit </Button>
        </Form>
    );
  }

}

export default ManagementForm;
