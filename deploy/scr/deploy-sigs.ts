import { utils, Provider, Wallet,Contract,EIP712Signer,types } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { hashMessage, hexlify, toUtf8Bytes } from 'ethers/lib/utils'

export default async function (hre: HardhatRuntimeEnvironment) {
 //const provider = new Provider("https://zksync2-testnet.zksync.dev");
const provider = new Provider("http://localhost:3050/");
const wallet = new Wallet("0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110").connect(provider);

const owner1 = new ethers.Wallet("0xb5d76d63b2315f53aeddb21c3f1745fc4044ca5be8674812394aa258343d1963");
const owner2 = new ethers.Wallet("0x07f964f2fe6eff2cbdf8b02c2a3a7777d717d617e975d7ae978d7cb2b611140d");

const guardian1PrivateKey = new ethers.Wallet("0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3")
//const guardian2PrivateKey = new ethers.Wallet("0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e")

const deployer = new Deployer(hre, wallet);
const accountArtifact = await deployer.loadArtifact("TwoUserMultisig");
const scrArtifact = await deployer.loadArtifact("SocialRecovery");
const scrcontract = "0x6F580854224A6Ec4757ff9c99a8a4Af3882f6E24";
const accountContract = "0x5C69650D096dCcdEB710FFf34e7E409F5cFaB966" 

const scraccount = new ethers.Contract(
  scrcontract,
  scrArtifact.abi,
  wallet
);

//   const newOwners = ['0xa61464658AfeAf65CccaaFD3a512b69A83B77618'];
//   const nouce = await scraccount.nonce(wallet.address);
//   const hash  = await scraccount.getSocialRecoveryHash(accountContract, newOwners, nouce);
//   console.log(hash)

 const is = await scraccount.guardiansCount(accountContract);
 console.log(is.toString())
// //0x41537c566d4ca20919721d12379139f865dceeaa56b0629dd828be4cdd19859078a73b4ad26b8ce70e484471b72226d2d5bda078d764f9e9092799ecf6e92d3a1b

// let aaTx = await scraccount.populateTransaction.updateGuardians(["0xa61464658AfeAf65CccaaFD3a512b69A83B77618"],"1","0x0000000000000000000000000000000000000000000000000000000000000000");
// let aaTx = await scraccount.populateTransaction.();
// aaTx = {
//   ...aaTx,
//   // deploy a new account using the multisig
//   from: accountContract,
//   chainId: (await provider.getNetwork()).chainId,
//   nonce: await provider.getTransactionCount(accountContract),
//   type: 113,
//   customData: {
//     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
//   } as types.Eip712Meta,
//   value: ethers.BigNumber.from(0),
// };
// aaTx.gasPrice = await provider.getGasPrice();
// aaTx.gasLimit = ethers.BigNumber.from(200000);
// const signedTxHash = EIP712Signer.getSignedDigest(aaTx);

// const signature = ethers.utils.concat([
//   // Note, that `signMessage` wouldn't work here, since we don't want
//   // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
//   ethers.utils.joinSignature(owner1._signingKey().signDigest(signedTxHash)),
//   ethers.utils.joinSignature(owner2._signingKey().signDigest(signedTxHash)),
// ]);

// aaTx.customData = {
//   ...aaTx.customData,
//   customSignature: signature,
// };
// console.log(aaTx)
// const sentTx = await provider.sendTransaction(utils.serialize(aaTx));
// await sentTx.wait();
// console.log(sentTx)

}

// registry: "0xb8701D2cB3C4C02665ec4bcF64591CE0D3a1c3E9",
// moduleManager: "0xa9e6018dCCC40cc30568ea051169512FEb230DeF",
// sccontract: "0xB9341063B7F027034f227d0f89a62355b4d01B89",
// 0xB9341063B7F027034f227d0f89a62355b4d01B89
// MM: "0xa9e6018dCCC40cc30568ea051169512FEb230DeF",
// aafactory: "0x28FcCFB8FC6712a0a5b5951971b583b2dc54d1F6",
// Owner 1 address: 0x30488b03bb077B5e50D3dB631aBC4635bdc612aC
// Owner 1 address: 0x8d82784c1279fec7462d732b333da861fb585d21aaec807e2661c0fbd8366f81
// Owner 2 address: 0x8a755934DA5dBC5c618F70F2562660334dE1D971
// Owner 2 address: 0xc980d155b9ffdddd7abbc49d84a14e2150da11519d3a4ff4801133c0b34d6a09
// account: "0x1d2A44abC4efc5879E795842eA55114f3A7B5107",


//  function convertToBytes32(signature: Uint8Array): string {
//   if (signature.length !== 130) {
//     throw new Error('Invalid signature length');
//   }

//   const r = ethers.utils.arrayify(signature.slice(0, 32));
//   const s = ethers.utils.arrayify(signature.slice(32, 64));
//   const v = ethers.utils.hexlify(signature[64]);

//   const bytes32Sig = ethers.utils.hexlify(ethers.utils.concat([r, s, v]));

//   return bytes32Sig;
// }

// const bytes32Signature = convertToBytes32(signature);
// console.log(bytes32Signature);