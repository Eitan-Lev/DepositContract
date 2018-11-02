# Smart Contract for Payment Channels over Ethereum
* Pull the repository and perform the installation steps. There is no need to do these steps more than once on each computer.
* Do not save any private keys on this repository.
* Enjoy!

## Table of Contents

- [Background](#background)
- [Installation Instructions](#installation-instructions)
- [Compilation and Deployment Instructions](#compilation-and-deployment-instructions)
- [Testing](#testing)
- [Front End interaction](#front-end-interaction)
- [Maintainers](#maintainers)
- [License](#license)
- [Example- In Development](#example)
- [Documentation- In Development](#documentation)
- [Development- In Development](#development)

## Background

Relying on the notion of the payment channels using Ethereum, this project implements the concept by incorperating SGX (or any equivalent third party abilities). As a result, allowing usage of payment channels over Ethereum while minimizing gas costs and transaction amounts on the Blockchain.

## Installation Instructions
1. Download the latest node.js from: https://nodejs.org/en/download/
2. Git clone/ pull the project from our github repository.
3. Use npm init in the root directory (/DepositContract)
4. If using Windows- open a windows command line as administrator and run:
    1. npm install --global --production windows-build-tools
    1. If that doesn't work - you have to go to the course video, lecture 37 and follow the second option.
5. Install a bunch of libraries: (If using Windows- open cmd as admin, if Linux- sudo before each one)
    1. npm install --save solc
    1. npm install --save mocha ganache-cli web3@1.0.0-beta.35
    1. npm install --save fs-extra
    1. npm install --save truffle-hdwallet-provider@0.0.3
    1. npm i truffle
If any of these commands doesn't execute successfully, look online for solutions.
6. Install libraries used for development of front end (not sure if this is a must in order to see it):
    1. npm install --save semantic-ui-react
    1. npm install --save semantic-ui-css
    1. npm install --save next-routes
    
    Again, if any of that doesn't work - you should search for a solution.

## Compilation and Deployment Instructions
### For Node
If you wish to re-compile the contract (you don't have to do it, and it's better you don't do it unless you have a good reason):
1. cd ..\ethereum
1. node compile.js
1. (verify you see all 3 .json files inside \ethereum\build)
1. node deploy.js
1. Save the addresses you get for the factory and for the SGX simulator.
1. The factory address should be placed in \ethereum\factory.js at line 6.
1. Note: Sometimes when you use node compile.js or deploy you get some weird error. in this
      case - open node.js terminal as administrator from windows search, close the code editor and run the command from the
      terminal you opened. It fixes it.

### For Truffle
1. cd to Truffle/contract directory.
1. In the command line:
    1. Windows- mklink Deposit.sol ..\..\ethereum\contracts\Deposit.sol
    1. Linux- sudo ln -s Deposit.sol ../../ethereum/contact/Deposit.sol
1. cd ..
1. truffle compile
1. truffle migrate

## Testing
### with Node
1. cd back into root directory (not sure if this is a must) and run:
npm run dev

### with truffle
1. cd to Truffle directory
2. truffle test

## Front End interaction:
Wait until the command line tells you that compilation was successful.
1. cd back into root directory (not sure if this is a must).
2. Open chrome (or any other browser with metamask) and enter localhost:3000

## Maintainers
[@eitanlev](https://github.com/Eitan-Lev)
[@amitw](https://github.com/Amit-Weiss)

## License
Solidity is licensed under [GNU General Public License v3.0](https://github.com/ethereum/solidity/blob/develop/LICENSE.txt)


## Example

In Development

## Documentation

In Development

## Development

In Development
