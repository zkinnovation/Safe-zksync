import { utils, Provider, Wallet,Contract,EIP712Signer,types } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ZKSYNC_MAIN_ABI } from "zksync-web3/build/src/utils";
import deployMultisig from "./deploy-multisig";

export default async function (hre: HardhatRuntimeEnvironment) {
 const provider = new Provider("https://zksync2-testnet.zksync.dev");
//const provider = new Provider("http://localhost:3050/");

const wallet = new Wallet("2c204cd103db06e84c958d479372ce60567d98bf24ace26a0cc5191870fed067").connect(provider);//0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110
const deployer = new Deployer(hre, wallet);

const owner1 = new ethers.Wallet("0x926d1f44286809477baf5b943830acf7ee08deac145c1b7cedc571c2b4d65585");
const owner2 = new ethers.Wallet("0xbff6de67ea3f9f344f03611f20e743ef529bb17e9ee3ec33d85d2ed15f61192d");

const erc20Artifact = await deployer.loadArtifact("MyERC20");

const erc20 = (await deployer.deploy(erc20Artifact, ["localtoken", "TT", 18]));
console.log(`erc: "${erc20.address}",`)
//const paymaster = "0x6c4f87c025020d6d0Aa40414CdcdCbf09bAFaA48";

const accountContract = "0xdfF49440f379edcFF85110E73fD0CEB2aDa1A677"
console.log(`Minting 5 tokens for empty wallet`);

// await (
//       await deployer.zkWallet.sendTransaction({
//         to: accountContract,
//         value: ethers.utils.parseEther("0.01"),
//       })       
//     ).wait();

// const paymasterParams = utils.getPaymasterParams(paymaster, {
//   type: "ApprovalBased",
//   token: erc201,
//   // set minimalAllowance as we defined in the paymaster contract
//   minimalAllowance: ethers.BigNumber.from(1),
//   // empty bytes as testnet paymaster does not use innerInput
//   innerInput: new Uint8Array(),
// });
// console.log(paymasterParams)

let mint = await erc20.populateTransaction.mint(wallet.address, 10000);
// 
 mint = {
  ...mint,
  from: accountContract,
  chainId: (await provider.getNetwork()).chainId,
  nonce: await provider.getTransactionCount(accountContract),
  type: 113,
  customData: {
    gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
   // paymasterParams: paymasterParams,
  } as types.Eip712Meta,
  value: ethers.BigNumber.from(0),
 };
 mint.gasPrice = await provider.getGasPrice();
 mint.gasLimit = ethers.BigNumber.from(20000000);
 const signedTxHash = EIP712Signer.getSignedDigest(mint);
  const signature = ethers.utils.concat([
    // Note, that `signMessage` wouldn't work here, since we don't want
    // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
    ethers.utils.joinSignature(owner1._signingKey().signDigest(signedTxHash)),
    ethers.utils.joinSignature(owner2._signingKey().signDigest(signedTxHash)),
  ]);
 mint.customData = {
  ...mint.customData,
  customSignature: signature,
 };
 console.log(mint)
 const sentTx = await provider.sendTransaction(utils.serialize(mint));
 await sentTx.wait();
 console.log("after this")
}
