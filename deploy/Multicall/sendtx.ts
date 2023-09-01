import { Wallet, Contract, Provider, utils, EIP712Signer, types } from "zksync-web3";
import { ethers } from "ethers";
import { Address } from "zksync-web3/build/src/types";
export interface TxParams {
    provider: Provider,
    //erc20: Contract, 
    account: Contract, 
    user1: any,
    user2: any,
    txData: any // or Bytes[], String[]?
  }

  // Send transaction from Account Abstraction via Paymaster
  export async function sendAATx(txParams:TxParams) {
    

    let tx = {
        ...txParams.txData,
        from: txParams.account.address,
        chainId: (await txParams.provider.getNetwork()).chainId,
        nonce: await txParams.provider.getTransactionCount(txParams.account.address),
        type: 113,
        customData: {
            ergsPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        } as types.Eip712Meta,
        value: ethers.BigNumber.from(0),
        gasPrice: await txParams.provider.getGasPrice(),
        gasLimit: "0x00"
    };

    tx = await makeTxData(txParams, tx)
    tx = await signTx(txParams, tx)
  
     const sentTx = await txParams.provider.sendTransaction(utils.serialize(tx));
     await sentTx.wait();

  }

   // Construct Transaction Data depending on whether batched or not
   async function makeTxData(txParams: TxParams, tx: any) {
        tx.to = txParams.account.address
        tx.data = txParams.txData
        tx.gasLimit = ethers.utils.hexlify(1000000)
    return tx;
    }

  // Sign Transaction 
   async function signTx(txParams:TxParams, tx: any) {

    const signedTxHash = EIP712Signer.getSignedDigest(tx);
    //const signature = ethers.utils.joinSignature(txParams.user1._signingKey().signDigest(signedTxHash))
    const signature = ethers.utils.concat([
        // Note, that `signMessage` wouldn't work here, since we don't want
        // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
        ethers.utils.joinSignature(txParams.user1._signingKey().signDigest(signedTxHash)),
        ethers.utils.joinSignature(txParams.user2._signingKey().signDigest(signedTxHash)),
      ]);
  
    tx.customData = {
      ...tx.customData,
      customSignature: signature,
    };

    return tx;
  }

  