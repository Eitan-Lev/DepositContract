const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const depositPath = path.resolve(__dirname, 'contracts', 'Deposit.sol');
//const simulatorPath = path.resolve(__dirname, 'contracts', 'SGXSimulator.sol');

//Read source code from sol file
const depositSource = fs.readFileSync(depositPath, 'utf8');
//const simulatorSource = fs.readFileSync(simulatorPath, 'utf8');

//Compile source code
const depositOutput = solc.compile(depositSource, 1).contracts;
//const simulatorOutput = solc.compile(simulatorSource, 1).contracts;

//Create the build folder if it doesn't exist
fs.ensureDirSync(buildPath);

//Create the .json files
for (let contract in depositOutput) {
	fs.outputJsonSync(
		path.resolve(buildPath, contract.replace(':', '') + '.json'),
		depositOutput[contract]
	);
}
