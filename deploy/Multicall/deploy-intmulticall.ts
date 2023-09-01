import { utils, Provider, Wallet,EIP712Signer,types } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ZKSYNC_MAIN_ABI } from "zksync-web3/build/src/utils";
import { sendAATx,TxParams } from "./sendtx";

export default async function (hre: HardhatRuntimeEnvironment) {
// const provider = new Provider("https://zksync2-testnet.zksync.dev");
const provider = new Provider("http://localhost:3050/");

const wallet = new Wallet("0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110").connect(provider);
const deployer = new Deployer(hre, wallet);

const owner1 = new ethers.Wallet("0x98bb673f82bef73a9adf9f2283f894b9602b03a140e8c1628d308451fc6dba83");
const owner2 = new ethers.Wallet("0x56ca5fd57d86c73d69a039b2cf270a746376d1d899bda20bb82819e966a57fd7");
const accountArtifact = await deployer.loadArtifact("TwoUserMultisig");
//

const erc20Artifact = await deployer.loadArtifact("MyERC20");
const accountContract = "0x4186fF5688F95B4a68B4aC80A2EB48DC1598104E"
const contract = new ethers.Contract(accountContract, accountArtifact.abi, wallet);
const data = '0x29451959000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000065c899b5fb8eb9ae4da51d67e1fc417c7cb7e96400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004440c10f1900000000000000000000000065c899b5fb8eb9ae4da51d67e1fc417c7cb7e96400000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000064'
//const Params = await contract.populateTransaction.multicall(data);

// const txParams: TxParams = {
//   provider: provider,
//   account: contract,
//   user1: owner1,
//   user2: owner2,
//   txData: data,
// };

// await sendAATx(txParams);
// console.log("ok")


// Transaction to deploy a new account using the multisig we just deployed
  let aaTx = await contract.populateTransaction.multicall(data);

  const gasLimit = await provider.estimateGas(aaTx);
  const gasPrice = await provider.getGasPrice();

  aaTx = {
    ...aaTx,
    // deploy a new account using the multisig
    from: accountContract,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(accountContract),
    type: 113,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0),
  };
  aaTx.gasPrice = await provider.getGasPrice();
  aaTx.gasLimit = ethers.BigNumber.from(200000000000000);
  const signedTxHash = EIP712Signer.getSignedDigest(aaTx);

  const signature = ethers.utils.concat([
    // Note, that `signMessage` wouldn't work here, since we don't want
    // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
    ethers.utils.joinSignature(owner1._signingKey().signDigest(signedTxHash)),
    ethers.utils.joinSignature(owner2._signingKey().signDigest(signedTxHash)),
  ]);

  aaTx.customData = {
    ...aaTx.customData,
    customSignature: signature,
  };
  console.log(aaTx)
  const sentTx = await provider.sendTransaction(utils.serialize(aaTx));
  await sentTx.wait();
}
