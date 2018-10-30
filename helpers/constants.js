const UsingOriginalTruffle = 12, UsingRegularMocha = 13,
      UsingWeb3Version1 = 14, UsingWeb3Version1NoRedeploy = 15;

// const InitialStage = 0, NoCounterpart = 1, CounterpartSet = 2, SettingKey = 3, PaymentChannelOpen = 4,
//       PaymentChannelLocked = 5, Finished = 6;

const IsDepositRemoveBugExists = true;

const SgxVersionContract = 21, SgxVersionAddress = 22;

// const Stages = { InitialStage = 0, NoCounterpart = 1, CounterpartSet = 2, SettingKey = 3, PaymentChannelOpen = 4,
//       PaymentChannelLocked = 5, Finished = 6};

// export { UsingOriginalTruffle, UsingRegularMocha };
module.exports = {
  UsingOriginalTruffle,
  UsingRegularMocha,
  UsingWeb3Version1,
  UsingWeb3Version1NoRedeploy,
  usingWeb3Version1(version) {
    return (version == UsingWeb3Version1 || version == UsingWeb3Version1NoRedeploy);
  },
  IsDepositRemoveBugExists,
  SgxVersionContract, SgxVersionAddress
}
