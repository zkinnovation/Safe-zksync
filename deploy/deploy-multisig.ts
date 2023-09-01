import { utils, Wallet, Provider, EIP712Signer, types } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Put the address of your AA factory
const AA_FACTORY_ADDRESS = "0xd0a217A9fCc538C971CFf2A48C33Eb51A061b723";
//const modulemanager = "0x4f4A0F99981E9884C9a3FfDeD9C33FF8D088bC30"
export default async function (hre: HardhatRuntimeEnvironment) {
  //const provider = new Provider("https://testnet.era.zksync.dev");
  const provider = new Provider("http://localhost:3050/");
  // Private key of the account used to deploy
  const wallet = new Wallet("0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110").connect(provider);
  const factoryArtifact = await hre.artifacts.readArtifact("AAFactory");

  const aaFactory = new ethers.Contract(
    AA_FACTORY_ADDRESS,
    factoryArtifact.abi,
    wallet
  );

  // The two owners of the multisig
  const owner1 = Wallet.createRandom();
  const owner2 = Wallet.createRandom();

  console.log(`Owner 1 address: ${owner1.address}`);
  console.log(`Owner 1 address: ${owner1.privateKey}`);
  console.log(`Owner 2 address: ${owner2.address}`);
  console.log(`Owner 2 address: ${owner2.privateKey}`);

  // For the simplicity of the tutorial, we will use zero hash as salt
  const salt = ethers.constants.HashZero;

  // deploy account owned by owner1 & owner2
  const tx = await aaFactory.deployAccount(
    salt,
    [owner1.address, owner2.address],
    "2"
  );
  await tx.wait();

  // Getting the address of the deployed contract account
  const abiCoder = new ethers.utils.AbiCoder();
  const multisigAddress = utils.create2Address(
    AA_FACTORY_ADDRESS,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(["address[]", "uint"], [[owner1.address, owner2.address], "2"])
  );
  console.log(`Multisig account deployed on address ${multisigAddress}`);

  console.log("Sending funds to multisig account");
  //Send funds to the multisig account we just deployed
  await (
    await wallet.sendTransaction({
      to: multisigAddress,
      // You can increase the amount of ETH sent to the multisig
      value: ethers.utils.parseEther("1"),
    })
  ).wait();

  let multisigBalance = await provider.getBalance(multisigAddress);

  console.log(`Multisig account balance is ${multisigBalance.toString()}`);

  // // Transaction to deploy a new account using the multisig we just deployed
  // let aaTx = await aaFactory.populateTransaction.deployAccount(
  //   salt,
  //   // These are accounts that will own the newly deployed account
  //   [Wallet.createRandom().address,Wallet.createRandom().address],
  //   "2"
    
  // );

  // const gasLimit = await provider.estimateGas(aaTx);
  // const gasPrice = await provider.getGasPrice();

  // aaTx = {
  //   ...aaTx,
  //   // deploy a new account using the multisig
  //   from: multisigAddress,
  //   gasLimit: gasLimit,
  //   gasPrice: gasPrice,
  //   chainId: (await provider.getNetwork()).chainId,
  //   nonce: await provider.getTransactionCount(multisigAddress),
  //   type: 113,
  //   customData: {
  //     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
  //   } as types.Eip712Meta,
  //   value: ethers.BigNumber.from(0),
  // };
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

  // console.log(
  //   `The multisig's nonce before the first tx is ${await provider.getTransactionCount(
  //     multisigAddress
  //   )}`
  // );
  // const sentTx = await provider.sendTransaction(utils.serialize(aaTx));
  // await sentTx.wait();

  // // Checking that the nonce for the account has increased
  // console.log(
  //   `The multisig's nonce after the first tx is ${await provider.getTransactionCount(
  //     multisigAddress
  //   )}`
  // );

  // multisigBalance = await provider.getBalance(multisigAddress);

  // console.log(`Multisig account balance is now ${multisigBalance.toString()}`);
}
