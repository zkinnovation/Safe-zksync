import { utils, Provider, Wallet,Contract,EIP712Signer,types } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function (hre: HardhatRuntimeEnvironment) {
 //const provider = new Provider("https://zksync2-testnet.zksync.dev");
const provider = new Provider("http://localhost:3050/");
const wallet = new Wallet("0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110").connect(provider);
const owner1 = new ethers.Wallet("0xb5d76d63b2315f53aeddb21c3f1745fc4044ca5be8674812394aa258343d1963");
const owner2 = new ethers.Wallet("0x07f964f2fe6eff2cbdf8b02c2a3a7777d717d617e975d7ae978d7cb2b611140d");
const deployer = new Deployer(hre, wallet);
const accountArtifact = await deployer.loadArtifact("TwoUserMultisig");
// const scrcontract = "0xcFEbe41427dB860B7760507f50F39370e27e9D61";
const accountContract = "0x5C69650D096dCcdEB710FFf34e7E409F5cFaB966" 
await (
  await deployer.zkWallet.sendTransaction({
    to: accountContract,
    value: ethers.utils.parseEther("0.1"),
  })       
).wait();
console.log(deployer.zkWallet.address)

const account = new ethers.Contract(
  accountContract,
  accountArtifact.abi,
  wallet
);
// const mmadd = "0x4f4A0F99981E9884C9a3FfDeD9C33FF8D088bC30";
// const mm = await deployer.loadArtifact("ModuleManager");
// const mmc = new ethers.Contract(mmadd, mm.abi, wallet);
// const addmodule = await mmc.addModule("0x4455f936A8787b6d492edB996b887Efc553D1Ed6","0x4455f936A8787b6d492edB996b887Efc553D1Ed6");
// await addmodule.wait();

// Deploy Socialrecovery
//  const scrArtifact = await deployer.loadArtifact("SocialRecoveryModule");
//  const contract = new ethers.Contract(scrcontract, scrArtifact.abi, wallet);
// const guardianHashValue = "0x5fa82dbdc961b74d16d1c6d50b77ffe075ff664e5952c1106c4fd5642349f538"; // Replace this with the actual value
// //0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000015fa82dbdc961b74d16d1c6d50b77ffe075ff664e5952c1106c4fd5642349f5380000000000000000000000000000000000000000000000000000000000000001000000000000000000000000a61464658afeaf65cccaafd3a512b69a83b77618
// // Encode the parameters into bytes
// const encodedData = ethers.utils.defaultAbiCoder.encode(
//   ["address[]", "uint256", "bytes32"],
//   [["0xa61464658AfeAf65CccaaFD3a512b69A83B77618"], 1, guardianHashValue]
// );
// console.log(encodedData)

let aaTx = await account.populateTransaction.addModules([1]);
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
aaTx.gasLimit = ethers.BigNumber.from(200000);
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

console.log("addedmodule in account")
}