const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const depositPath = path.resolve(__dirname, 'contracts', 'Deposit.sol');
const simulatorPath = path.resolve(__dirname, 'contracts', 'SGXSimulator.sol');

//Read source code from sol file
var input = {
	'Deposit.sol': fs.readFileSync(depositPath, 'utf8'),
	'SGXSimulator.sol': fs.readFileSync(simulatorPath, 'utf8')
};

// Assumes imported files are in the same folder/local path
function findImports(path) {
	return {
		contents: fs.readFileSync(path).toString()
	};
}

//Compile source code
console.log(solc.compile({ sources: input }, 1, findImports));
//let compiledContract = solc.compile({ sources: input }, 1, findImports);
const depositOutput = solc.compile(
	{ sources: input['Deposit.sol'] },
	1,
	findImports
);
const simulatorOutput = solc.compile(
	{ sources: input['SGXSimulator.sol'] },
	1,
	findImports
);

//Create the build folder if it doesn't exist
fs.ensureDirSync(buildPath);

//Create the .json files
for (let contract in depositOutput) {
	fs.outputJsonSync(
		path.resolve(buildPath, contract.replace(':', '') + '.json'),
		depositOutput[contract]
	);
}

for (let contract in simulatorOutput) {
	fs.outputJsonSync(
		path.resolve(buildPath, contract.replace(':', '') + '.json'),
		simulatorOutput[contract]
	);
}
