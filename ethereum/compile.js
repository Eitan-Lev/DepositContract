const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const depositPath = path.resolve(__dirname, 'contracts', 'Deposit.sol');
//console.log("1");
const source = fs.readFileSync(depositPath, 'utf8');//Read source code from sol file
//console.log("2");
const output = solc.compile(source, 1).contracts;//Compile source code

//const inboxPath = path.resolve(__dirname, 'contracts', 'Deposit.sol');
//const source = fs.readFileSync(inboxPath, 'utf8');
//module.exports = solc.compile(source, 1).contracts[':Deposit'];
//console.log(solc.compile(source, 1).contracts);

//console.log("3");
fs.ensureDirSync(buildPath); //Creates the build folder if it doesn't exist

for (let contract in output) {
  fs.outputJsonSync(
    path.resolve(buildPath, contract.replace(':', '') + '.json'),
    output[contract]
  );
}
