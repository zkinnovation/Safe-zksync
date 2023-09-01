import { Wallet, Contract} from 'zksync-web3';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { toBN, GASLIMIT } from "./helper";

// Deploy function
export async function deployModules (
    wallet: Wallet,
    deployer: Deployer,
    ):Promise<any> {

    // Deploy AccountRegistry
    const registryArtifact = await deployer.loadArtifact("GuardianStorage");
    const registry = <Contract>(await deployer.deploy(registryArtifact, []));
    console.log(`Guradianstorage: "${registry.address}",`)

    // // Deploy ModuleManager
    // const moduleManagerArtifact = await deployer.loadArtifact("ModuleManager");
    // const moduleManager = <Contract>(await deployer.deploy(moduleManagerArtifact, [wallet.address, registry.address]));
    // console.log(`moduleManager: "${moduleManager.address}",`)

    const scrArtifact = await deployer.loadArtifact("SocialRecoveryModule");
    const sccontract = (await deployer.deploy(scrArtifact,[registry.address,"0"]));
    console.log(`sccontract: "${sccontract.address}",`)


    return [sccontract]
}