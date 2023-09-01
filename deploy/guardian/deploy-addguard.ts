import { utils, Provider, Wallet,Contract,EIP712Signer,types } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function (hre: HardhatRuntimeEnvironment) {
const provider = new Provider("https://zksync2-testnet.zksync.dev");
//const provider = new Provider("http://localhost:3050/");
const wallet = new Wallet("2c204cd103db06e84c958d479372ce60567d98bf24ace26a0cc5191870fed067").connect(provider);
//const wallet = new Wallet("0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110").connect(provider);
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

  //  const guardian = Wallet.createRandom();
  //  console.log(guardian.address);
  //  console.log(guardian.privateKey);//0x8b6975211dC8b76B25e75EC141565Cc40031fe67
  // //0x89820125d092699a2ef7f326ae903f4d19777c04c039c9af92f2d2bbc65532cb
  // await (
  //   await deployer.zkWallet.sendTransaction({
  //     to: guardian.address,
  //     value: ethers.utils.parseEther("0.8"),
  //   })       
  // ).wait();

  let aaTx = await account.populateTransaction.addGuardianWithThreshold(accountContract,"0x2C56B7408F9af54346bcF93Fc86F8D9Ae17A4e52","1");
  //let aaTx = await account.populateTransaction.getdetails(accountContract,"2");
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
  const sentTx = await provider.sendTransaction(utils.serialize(aaTx));
  await sentTx.wait();
  console.log(aaTx)
  console.log("added guardian in account")
}
//Guradianstorage: "0xbF4D0433837608eB07d52DFf29232011Ee421B62",
// sccontract: "0x596477f962E6ac938E53F77A18F0e74d87ebE0C6",
// aafactory: "0xb9b59809Dc42C2b82c9E8AE44F9b7a9892aB8Cf6",
// Owner 1 address: 0xd8a1bCd6b7086bDAd0D9dBfC1ab1aB58D324b34d
// Owner 1 address: 0x4a342f580be26db822458e4812627feca53bbbf9876cf62a4221361bfcd5e19c
// Owner 2 address: 0x636bbd4692E27867c1487F0372Dbe71c7a79B326
// Owner 2 address: 0xe74b82747f1b01e12758cd85ab505840f7293848479255c1d3630519cb3245e7
// account: "0x208155B74Ba871185Dfe613C5f50504a84Bc7b61",

//final
// Guradianstorage: "0x457C5919A52A0d3Be2a07e64bf1791b7Fc8b6149",
// sccontract: "0xEFE2e2910c81315E4be0949ED25986418a22ca44",
// aafactory: "0x75B1fcfED329d408315E05fF0E7cdd2e82051fd1",
// Owner 1 address: 0xa4851f20b9dC60fdc6E1c53b69fA4FEDa747617B
// Owner 1 address: 0x9d42135b7424ec41bef07c4e87be407e19d78d2da63ade30fcfd388b199c3810
// Owner 2 address: 0xE1047Bb4DA847fd75D24c8A2E2435f7dc408FE5e
// Owner 2 address: 0xc1168877ffbdd33fe10816259ddc48310028ce4a79e8fa1c805f04881afcd203
// account: "0x41AFC01928eaF637D863aC7D7e339324C00E10D9",