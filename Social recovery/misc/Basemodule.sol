// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

//import "../interfaces/IMultisig.sol";//only for check authorized module
import "../interfaces/IModuleManager.sol";

abstract contract BaseModule {
    event ModuleInit(address indexed wallet);
    event ModuleDeInit(address indexed wallet);

    function inited(address wallet) internal view virtual returns (bool);

    function _init(bytes calldata data) internal virtual returns (address,uint256,uint256);

    function _deInit() internal virtual;

    function sender() public view returns (address) {
        return msg.sender;
    }
  //params - (address[] memory _guardians, uint256 _threshold, bytes32 _guardianHash)
    function walletInit(bytes calldata data) external returns (address,uint256,uint256) {
        address _sender = sender();
        // if (!inited(_sender)) {
        //     if (!IModuleManager(_sender).isAuthorizedModule(address(this))) {
        //         revert("not authorized module");
        //     }
            _init(data);
            emit ModuleInit(_sender);
        //}
    }

    function walletDeInit() external {
        address _sender = sender();
        // if (inited(_sender)) {
        //     if (IModuleManager(_sender).isAuthorizedModule(address(this))) {
        //         revert("authorized module");
        //     }
            _deInit();
            emit ModuleDeInit(_sender);
       // }
    }

}
