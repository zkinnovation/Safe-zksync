import { utils, Provider, Wallet,Contract,EIP712Signer,types } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function (hre: HardhatRuntimeEnvironment) {
const provider = new Provider("https://zksync2-testnet.zksync.dev");
//const provider = new Provider("http://localhost:3050/");
const wallet = new Wallet("065e53d5536d5debf5ed8b8ab94947da2e3011a525616413373b5df41d885f25").connect(provider);
const owner1 = new ethers.Wallet("0x414411870ffc95f31146b56e4cf54c56f30be9d1d1722d31958b7b56532b6762");
const owner2 = new ethers.Wallet("0xa837d2d8ef040c348abbfd59a1a65a3b941c915845effd61663ac7dff4fbe765");
const deployer = new Deployer(hre, wallet);
const scContract = await deployer.loadArtifact("SocialRecoveryModule");
const sc = "0xB93186544FBe10E720c36658833Be8791473f16E";
const accountContract = "0x86523F071d5a6A87FC08171d2Ce94CdF644876a4";
const account = new ethers.Contract(
    sc,
    scContract.abi,
    wallet
);

// 0x87AF4643184c791cC2A18D1F75c8f9d388a7144C
// 0x094fdec3b5578b3965c4e5b396b3fc4bb32910c43115f2b704579ca92b75a3a1
// 0xb1fe1f44eD4BbC8c02ca59a4740925F6116F56Af
// 0x5e3669d2c0fd6715d9c0d1260619f5dceb738b6dd22937d391c7a33da8ea7c4c

// The two owners of the multisig
//  const owner1g = Wallet.createRandom();
//  const owner2g = Wallet.createRandom();


//  console.log(`Owner 1 gaddress: ${owner1g.address}`);
//  console.log(`Owner 1 gaddress: ${owner1g.privateKey}`);
//  console.log(`Owner 2 gaddress: ${owner2g.address}`);
//  console.log(`Owner 2 gaddress: ${owner2g.privateKey}`);
 
// 0x389053b22755c83177cc542d2d6126804d3b4d777e340bc8311a92ece23d866e


  //let aaTx = await account.confirmRecovery(accountContract,["0xC589e0f4F5FfD97cc806EAf660e367d5C41a2D16","0x6611E69259b383BE23ecBB5e6BbC14674455dB17"],"1",false);
  //let aaTx = await account.populateTransaction.hasGuardianApproved(accountContract,"0x2C56B7408F9af54346bcF93Fc86F8D9Ae17A4e52",["0xC589e0f4F5FfD97cc806EAf660e367d5C41a2D16","0x6611E69259b383BE23ecBB5e6BbC14674455dB17"],"1");
  //let aaTx = await account.executeRecovery(accountContract,["0xC589e0f4F5FfD97cc806EAf660e367d5C41a2D16","0x6611E69259b383BE23ecBB5e6BbC14674455dB17"],"1");
  let aaTx = await account.finalizeRecovery(accountContract);
  console.log(aaTx);
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
  
  // console.log(" guardian recovery ")
}
//Guradianstorage: "0xbF4D0433837608eB07d52DFf29232011Ee421B62",
// sccontract: "0x596477f962E6ac938E53F77A18F0e74d87ebE0C6",
// aafactory: "0xb9b59809Dc42C2b82c9E8AE44F9b7a9892aB8Cf6",
// Owner 1 address: 0xd8a1bCd6b7086bDAd0D9dBfC1ab1aB58D324b34d
// Owner 1 address: 0x4a342f580be26db822458e4812627feca53bbbf9876cf62a4221361bfcd5e19c
// Owner 2 address: 0x636bbd4692E27867c1487F0372Dbe71c7a79B326
// Owner 2 address: 0xe74b82747f1b01e12758cd85ab505840f7293848479255c1d3630519cb3245e7
// account: "0x208155B74Ba871185Dfe613C5f50504a84Bc7b61",