import { ethers} from "ethers";
import { Wallet, utils, Contract} from 'zksync-web3';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { toBN, GASLIMIT } from "./helper";

// Deploy function
export async function deployAccount (
    wallet: Wallet,
    deployer: Deployer,
    ) {

    // Deploy AccountFactory
    const factoryArtifact = await deployer.loadArtifact("AAFactory");
    const accountArtifact = await deployer.loadArtifact("TwoUserMultisig");
    const bytecodeHash = utils.hashBytecode(accountArtifact.bytecode);
    const factory = <Contract>(await deployer.deploy(
        factoryArtifact, 
        [bytecodeHash], 
        undefined, 
        [accountArtifact.bytecode,])
        );

    console.log(`aafactory: "${factory.address}",`)

    // Deploy Account  && Setup
    const salt = ethers.constants.HashZero; 
    // The two owners of the multisig
    const owner1 = Wallet.createRandom();
    const owner2 = Wallet.createRandom();

    console.log(`Owner 1 address: ${owner1.address}`);
    console.log(`Owner 1 address: ${owner1.privateKey}`);
    console.log(`Owner 2 address: ${owner2.address}`);
    console.log(`Owner 2 address: ${owner2.privateKey}`);
    
    const transaction = await(await factory.deployAccount(salt,[owner1.address,owner2.address],"2",GASLIMIT)).wait();
    const accountAddr = (await utils.getDeployedContracts(transaction))[0].deployedAddress
    const accountContract = new ethers.Contract(accountAddr, accountArtifact.abi, wallet)
    console.log(`account: "${accountContract.address}",`)

}
