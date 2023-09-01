import { utils, Wallet,Provider } from "zksync-web3";
import { ethers, BigNumber } from 'ethers';
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Address } from "zksync-web3/build/src/types";


export default async function (hre: HardhatRuntimeEnvironment) {
const BATCH_SELECTOR = "0x29451959"
const provider = new Provider("http://localhost:3050/");

const wallet = new Wallet("0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110");
const deployer = new Deployer(hre, wallet);
// Example values
//const swapTx = ...; // Populate with the swap transaction object
const token = '0x65C899B5fb8Eb9ae4da51D67E1fc417c7CB7e964'; // Token contract address
const amount = BigNumber.from(100);


async function constructBatchedCalldata(transactions: ethers.PopulatedTransaction[]):Promise<any> {

    const isDelegatecalls:boolean[] = [];
    const targets:string[] = [];
    const methods:string[] = [];
    const values:BigNumber[] = [];

    for (let i = 0; i < transactions.length; i++) {

        const isDelegatecall:boolean = transactions[i].to ? true : false;
        isDelegatecalls.push(isDelegatecall);

        targets.push(transactions[i].to as string)
        methods.push(transactions[i].data as string)

        const value:BigNumber = transactions[i].value ? transactions[i].value as BigNumber : BigNumber.from(0);
        values.push(value)
    }

    // Encode contract addresses and methods data for Multicall
    const AbiCoder = new ethers.utils.AbiCoder()
    const batchedCalldata: string 
    = AbiCoder.encode(
        ["bool[]", "address[]", "bytes[]", "uint[]"], 
        [isDelegatecalls, targets, methods, values]
        )
    console.log("batchedCalldata: ", batchedCalldata)
    return BATCH_SELECTOR.concat(batchedCalldata.replace("0x", ""))

}

const contractAddress = token;
const spender = '0x094499Df5ee555fFc33aF07862e43c90E6FEe501';
//const amount = ethers.utils.parseUnits('100', 18); // Amount in wei

const abi = [
  // ... Include ERC20 ABI here
  // Example approve function definition
  {
    constant: false,
    inputs: [
      {
        name: '_spender',
        type: 'address',
      },
      {
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const erc20Contract = new ethers.Contract(contractAddress, abi, provider);

const approveFunctionSignature = erc20Contract.interface.getSighash('approve');
const approveFunctionData = approveFunctionSignature + erc20Contract.interface.encodeFunctionData('approve', [spender, amount]);

console.log('Approve Function Data:', approveFunctionData);

//MINTTT
const to = token;
const abi1 = [
  // ... Include ERC20 ABI here
  // Example mint function definition
  {
    constant: false,
    inputs: [
      {
        name: '_to',
        type: 'address',
      },
      {
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'mint',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const erc20Contracts = new ethers.Contract(contractAddress, abi1, provider);

//const mintFunctionSignature = erc20Contracts.interface.getSighash('mint');
const mintFunctionData = erc20Contracts.interface.encodeFunctionData('mint', [to, amount]);

console.log('Mint Function Data:', mintFunctionData);


//Example transactions array
const transactions = [
    {
      to: token,
      data: mintFunctionData,
      value: amount
    }
  ];

  //Call the function
  async function callConstructBatchedCalldata() {
    try {
      const batchedCalldata = await constructBatchedCalldata(transactions);
      console.log('Batched Calldata:', batchedCalldata);
      
      // Perform further operations with the batchedCalldata
      // For example, you can use it to make a batched call to a contract.
      
    } catch (error) {
      console.error('Error:', error);
  }
 }
  
  //Execute the function
  await callConstructBatchedCalldata();



}