import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet, Provider } from 'zksync-web3';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { deployModules } from "./deploy-module";
import { deployAccount } from "./deploy-account";

// yarn hardhat deploy-zksync --script deploy/deployAll.ts

// Deploy function
export default async function deployAll (hre: HardhatRuntimeEnvironment) {
    //const provider = new Provider("http://localhost:3050", 270);
    const provider = new Provider("https://zksync2-testnet.zksync.dev");
    const wallet = new Wallet("2c204cd103db06e84c958d479372ce60567d98bf24ace26a0cc5191870fed067", provider);
    const deployer = new Deployer(hre, wallet);
    
    const[sccontract] 
    = await deployModules(
    wallet, 
    deployer,
    )

    await deployAccount(
        wallet, 
        deployer
    )

}