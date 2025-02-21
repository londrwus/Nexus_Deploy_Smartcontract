import { config } from "dotenv";
import { ethers } from "ethers";
import solc from "solc";
import chalk from "chalk";
import ora from "ora";
import cfonts from "cfonts";
config(); // Load environment variables

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

if (!PRIVATE_KEY || !RPC_URL) {
    console.log(chalk.red.bold("❌ Missing environment variables!"));
    process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const contractSource = `
pragma solidity ^0.8.0;

contract Counter {
    uint256 private count;
    
    event CountIncremented(uint256 newCount);
    
    function increment() public {
        count += 1;
        emit CountIncremented(count);
    }
    
    function getCount() public view returns (uint256) {
        return count;
    }
}
`;

function compileContract() {
    const spinner = ora("Compiling contract...").start();
    
    try {
        const input = {
            language: "Solidity",
            sources: { "Counter.sol": { content: contractSource } },
            settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } }
        };

        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        // Fix: Access the correct contract name
        const contract = output.contracts["Counter.sol"].Counter; 

        spinner.succeed(chalk.green("Contract compiled successfully!"));
        return { abi: contract.abi, bytecode: contract.evm.bytecode.object };
    } catch (error) {
        spinner.fail(chalk.red("Contract compilation failed!"));
        console.error(error);
        process.exit(1);
    }
}

async function deploy() {
    cfonts.say("NT Exhaust", {
        font: "block",
        align: "center",
        colors: ["cyan", "magenta"],
        background: "black",
        letterSpacing: 1,
        lineHeight: 1,
        space: true,
        maxLength: "0",
      });
    
       console.log(chalk.blue.bold("=== Telegram Channel : NT Exhaust (@NTExhaust) ===", "\x1b[36m"));
    console.log(chalk.blue.bold("\n🚀 Deploying HelloWorld contract...\n"));

    const { abi, bytecode } = compileContract();
    const spinner = ora("Deploying contract to blockchain...").start();

    try {
        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        const contract = await factory.deploy();

        console.log("⏳ Waiting for transaction confirmation...");
        const txReceipt = await contract.deploymentTransaction().wait();

        spinner.succeed(chalk.green("Contract deployed successfully!"));
        console.log(chalk.cyan.bold("\n📌 Contract Address: ") + chalk.yellow(contract.target));
        console.log(chalk.cyan.bold("\n📜 Transaction Hash: ") + chalk.yellow(txReceipt.hash));
        console.log(chalk.green("\n✅ Deployment complete! 🎉\n"));
    } catch (error) {
        spinner.fail(chalk.red("Deployment failed!"));
        console.error(error);
        process.exit(1);
    }
}


deploy().catch(console.error);
