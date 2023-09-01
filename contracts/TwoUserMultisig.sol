// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IAccount.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";

import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
// Used for signature validation
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
//import "./Modules/Multicall.sol";
// Access zkSync system contracts, in this case for nonce validation vs NONCE_HOLDER_SYSTEM_CONTRACT
import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
// to call non-view method of system contracts
import "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractsCaller.sol";
// import "./interfaces/IModule.sol";
// import "./interfaces/IModuleManager.sol";
import "contracts/Modules/ModuleManager.sol";
import "./Owner.sol";
import "./interfaces/ISignatureValidator.sol";
import "./interfaces/safemath.sol";



contract TwoUserMultisig is IAccount,OwnerManager,ModuleManager,ISignatureValidatorConstants {
    // to get transaction hash
    using TransactionHelper for Transaction;
    using SafeMath for uint256;


    bytes4 constant EIP1271_SUCCESS_RETURN_VALUE = 0x1626ba7e;

     /// @dev returns true if the address is an enabled module.
    //mapping(address => bool) public isModule;

    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this method"
        );
        // Continure execution if called from the bootloader.
        _;
    }


    constructor(address[] memory _owners, uint256 _threshold) {
        // owner1 = _owners[0];
        // owner2 = _owners[1];
        //threshold = 1;(used in safe for singleton)
        setupOwners(_owners, _threshold);
        setupModules(address(0), bytes(""));
    }
    

    function validateTransaction(
        bytes32,
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) external payable override onlyBootloader returns (bytes4 magic) {
        magic = _validateTransaction(_suggestedSignedHash, _transaction);
    }

    function _validateTransaction(
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) internal returns (bytes4 magic) {
        // Incrementing the nonce of the account.
        // Note, that reserved[0] by convention is currently equal to the nonce passed in the transaction
        SystemContractsCaller.systemCallWithPropagatedRevert(
            uint32(gasleft()),
            address(NONCE_HOLDER_SYSTEM_CONTRACT),
            0,
            abi.encodeCall(INonceHolder.incrementMinNonceIfEquals, (_transaction.nonce))
        );

        bytes32 txHash;
        // While the suggested signed hash is usually provided, it is generally
        // not recommended to rely on it to be present, since in the future
        // there may be tx types with no suggested signed hash.
        if (_suggestedSignedHash == bytes32(0)) {
            txHash = _transaction.encodeHash();
        } else {
            txHash = _suggestedSignedHash;
        }

        // The fact there is are enough balance for the account
        // should be checked explicitly to prevent user paying for fee for a
        // transaction that wouldn't be included on Ethereum.
        uint256 totalRequiredBalance = _transaction.totalRequiredBalance();
        require(totalRequiredBalance <= address(this).balance, "Not enough balance for fee + value");

        if (checkSignatures(txHash, _transaction.signature) == EIP1271_SUCCESS_RETURN_VALUE) {
            magic = ACCOUNT_VALIDATION_SUCCESS_MAGIC;
        }
    }

    function executeTransaction(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    ) external payable override onlyBootloader {
        _executeTransaction(_transaction);
    }

    function _executeTransaction(Transaction calldata _transaction) internal {
        address to = address(uint160(_transaction.to));
        uint128 value = Utils.safeCastToU128(_transaction.value);
        bytes memory data = _transaction.data;

        if (to == address(DEPLOYER_SYSTEM_CONTRACT)) {
            uint32 gas = Utils.safeCastToU32(gasleft());

            // Note, that the deployer contract can only be called
            // with a "systemCall" flag.
            SystemContractsCaller.systemCallWithPropagatedRevert(gas, to, value, data);
           
        }
        else if(isModuleEnabled(to)){
            require(execute(to, 0, data, Enum.Operation.Call, type(uint256).max), "GS000");
        }

        else {
            bool success;
            assembly {
                success := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)
            }
            require(success);
        }
    }

    function executeTransactionFromOutside(Transaction calldata _transaction)
        external
        payable
    {
        _validateTransaction(bytes32(0), _transaction);
        _executeTransaction(_transaction);
    }

    /**
     * @notice Checks whether the signature provided is valid for the provided data and hash. Reverts otherwise.
     * @param dataHash Hash of the data (could be either a message hash or transaction hash)
     * @param signatures Signature data that should be verified.
     *                   Can be packed ECDSA signature ({bytes32 r}{bytes32 s}{uint8 v}), contract signature (EIP-1271) or approved hash.
     */
    function checkSignatures(bytes32 dataHash, bytes memory signatures) public view returns (bytes4 magic) {
        // Load threshold to avoid multiple storage loads
        magic = EIP1271_SUCCESS_RETURN_VALUE;
        uint256 _threshold = threshold;
        // Check that a threshold is set
        require(_threshold > 0, "GS001");

        if (checkNSignatures(dataHash, signatures, _threshold)){
            magic = EIP1271_SUCCESS_RETURN_VALUE;
        }
        else{
            magic = bytes4(0);
        }
 
    }
    
    /// @dev divides bytes signature into `uint8 v, bytes32 r, bytes32 s`.
   
    /// @param signatures concatenated rsv signatures
    function signatureSplit(bytes memory signatures, uint256 pos) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        // solhint-disable-next-line no-inline-assembly
        /// @solidity memory-safe-assembly
        assembly {
            let signaturePos := mul(0x41, pos)
            r := mload(add(signatures, add(signaturePos, 0x20)))
            s := mload(add(signatures, add(signaturePos, 0x40)))
            v := byte(0, mload(add(signatures, add(signaturePos, 0x60))))
        }
    }

    /**
     * @notice Checks whether the signature provided is valid for the provided data and hash. Reverts otherwise.
     * @dev Since the EIP-1271 does an external call, be mindful of reentrancy attacks.
     *      The data parameter (bytes) is not used since v1.5.0 as it is not required anymore. Prior to v1.5.0,
     *      data parameter was used in contract signature validation flow using legacy EIP-1271.
     *      Version v1.5.0, uses dataHash parameter instead of data with updated EIP-1271 implementation.
     
     * @param dataHash Hash of the data (could be either a message hash or transaction hash)
     * @param signatures Signature data that should be verified.
     *                   Can be packed ECDSA signature ({bytes32 r}{bytes32 s}{uint8 v}), contract signature (EIP-1271) or approved hash.
     * @param requiredSignatures Amount of required valid signatures.
     */
    function checkNSignatures(
        bytes32 dataHash,
        bytes memory signatures,
        uint256 requiredSignatures
    ) public view returns (bool){
        address lastOwner = address(0);
        address currentOwner;
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 i;
        uint256 validSignatures = 0;
        
        for (i = 0; i < requiredSignatures; i++) {

            (v, r, s) = signatureSplit(signatures,i);
            bytes memory reconstructedSignature = joinSignature(v, r, s);
            require(checkValidECDSASignatureFormat(reconstructedSignature),"Invalid signature format");
            // Default is the ecrecover flow with the provided data hash
            // Use ecrecover with the messageHash for EOA signatures
            currentOwner = ECDSA.recover(dataHash,reconstructedSignature);
            
            require(owners[currentOwner] != address(0),"GS0002");
            require(currentOwner != SENTINEL_OWNERS, "GS026");
            lastOwner = currentOwner;
            validSignatures++;

        }
        return validSignatures == requiredSignatures;
    }

    function joinSignature(uint8 v, bytes32 r, bytes32 s) internal pure returns (bytes memory signature) {
    signature = new bytes(65);
        assembly {
        mstore(add(signature, 0x20), r)
        mstore(add(signature, 0x40), s)
        mstore8(add(signature, 0x60), v)
        }
    }

    // This function verifies that the ECDSA signature is both in correct format and non-malleable
    function checkValidECDSASignatureFormat(bytes memory _signature) internal pure returns (bool) {
        if(_signature.length != 65) {
            return false;
        }

        uint8 v;
		bytes32 r;
		bytes32 s;
		// Signature loading code
		// we jump 32 (0x20) as the first slot of bytes contains the length
		// we jump 65 (0x41) per signature
		// for v we load 32 bytes ending with v (the first 31 come from s) then apply a mask
		assembly {
			r := mload(add(_signature, 0x20))
			s := mload(add(_signature, 0x40))
			v := and(mload(add(_signature, 0x41)), 0xff)
		}
		if(v != 27 && v != 28) {
            return false;
        }

		// EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (301): 0 < s < secp256k1n ÷ 2 + 1, and for v in (302): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if(uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return false;
        }

        return true;
    }


    function payForTransaction(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    ) external payable override onlyBootloader {
        bool success = _transaction.payToTheBootloader();
        require(success, "Failed to pay the fee to the operator");
    }

    function prepareForPaymaster(
        bytes32, // _txHash
        bytes32, // _suggestedSignedHash
        Transaction calldata _transaction
    ) external payable override onlyBootloader {
        _transaction.processPaymasterInput();
    }

    /// @notice method to prove that this contract inherits IAccount interface, called
    /// @param interfaceId identifier unique to each interface
    /// @return true if this contract implements the interface defined by `interfaceId`
    /// Details: https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
    /// This function call must use less than 30 000 gas
    function supportsInterface(bytes4 interfaceId)
        external
        pure
        returns (bool)
    {
        return interfaceId == type(IAccount).interfaceId;
    }

    fallback() external {
        // fallback of default account shouldn't be called by bootloader under no circumstances
        assert(msg.sender != BOOTLOADER_FORMAL_ADDRESS);

        // If the contract is called directly, behave like an EOA
    }

    receive() external payable {
        // If the contract is called directly, behave like an EOA.
        // Note, that is okay if the bootloader sends funds with no calldata as it may be used for refunds/operator payments
    }
}


// if (v == 0) {
//                 // If v is 0 then it is a contract signature
//                 // When handling contract signatures the address of the contract is encoded into r
//                 currentOwner = address(uint160(uint256(r)));

//                 // Check that signature data pointer (s) is not pointing inside the static part of the signatures bytes
//                 // This check is not completely accurate, since it is possible that more signatures than the threshold are send.
//                 // Here we only check that the pointer is not pointing inside the part that is being processed
//                 require(uint256(s) >= requiredSignatures.mul(65), "GS021");

//                 // Check that signature data pointer (s) is in bounds (points to the length of data -> 32 bytes)
//                 require(uint256(s).add(32) <= signatures.length, "GS022");

//                 // Check if the contract signature is in bounds: start of data is s + 32 and end is start + signature length
//                 uint256 contractSignatureLen;
//                 // solhint-disable-next-line no-inline-assembly
//                 /// @solidity memory-safe-assembly
//                 assembly {
//                     contractSignatureLen := mload(add(add(signatures, s), 0x20))
//                 }
//                 require(uint256(s).add(32).add(contractSignatureLen) <= signatures.length, "GS023");

//                 // Check signature
//                 bytes memory contractSignature;
//                 // solhint-disable-next-line no-inline-assembly
//                 /// @solidity memory-safe-assembly
//                 assembly {
//                     // The signature data for contract signatures is appended to the concatenated signatures and the offset is stored in s
//                     contractSignature := add(add(signatures, s), 0x20)
//                 }
//                 require(ISignatureValidator(currentOwner).isValidSignature(dataHash, contractSignature) == EIP1271_SUCCESS_RETURN_VALUE, "GS024");
//             }