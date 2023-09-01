import { utils, Provider, Wallet,Contract,EIP712Signer,types } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function (hre: HardhatRuntimeEnvironment) {
const provider = new Provider("https://zksync2-testnet.zksync.dev");
//const provider = new Provider("http://localhost:3050/");
const wallet = new Wallet("2c204cd103db06e84c958d479372ce60567d98bf24ace26a0cc5191870fed067").connect(provider);
const owner1 = new ethers.Wallet("0x414411870ffc95f31146b56e4cf54c56f30be9d1d1722d31958b7b56532b6762");
const owner2 = new ethers.Wallet("0xa837d2d8ef040c348abbfd59a1a65a3b941c915845effd61663ac7dff4fbe765");
const deployer = new Deployer(hre, wallet);
const accountArtifact = await deployer.loadArtifact("TwoUserMultisig");
const accountContract = "0xdfF49440f379edcFF85110E73fD0CEB2aDa1A677" 
await (
  await deployer.zkWallet.sendTransaction({
    to: accountContract,
    value: ethers.utils.parseEther("0.004"),
  })       
).wait();
console.log(deployer.zkWallet.address)
const account = new ethers.Contract(
    accountContract,
    accountArtifact.abi,
    wallet
  );

  let aaTx = await account.populateTransaction.enableModule("0xc45388Db412e2473A930D83611Cb44a278dbbFCC");
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
//Guradianstorage: "0xbF4D0433837608eB07d52DFf29232011Ee421B62",
// sccontract: "0x596477f962E6ac938E53F77A18F0e74d87ebE0C6",
// aafactory: "0xb9b59809Dc42C2b82c9E8AE44F9b7a9892aB8Cf6",
// Owner 1 address: 0xd8a1bCd6b7086bDAd0D9dBfC1ab1aB58D324b34d
// Owner 1 address: 0x4a342f580be26db822458e4812627feca53bbbf9876cf62a4221361bfcd5e19c
// Owner 2 address: 0x636bbd4692E27867c1487F0372Dbe71c7a79B326
// Owner 2 address: 0xe74b82747f1b01e12758cd85ab505840f7293848479255c1d3630519cb3245e7
// account: "0x208155B74Ba871185Dfe613C5f50504a84Bc7b61",