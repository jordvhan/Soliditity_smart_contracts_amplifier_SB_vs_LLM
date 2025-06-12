// File: @openzeppelin/contracts/token/ERC20/IERC20.sol


// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// File: @openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol


// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity ^0.8.20;


/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}

// File: @openzeppelin/contracts/utils/Context.sol


// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// File: @openzeppelin/contracts/interfaces/draft-IERC6093.sol


// OpenZeppelin Contracts (last updated v5.1.0) (interfaces/draft-IERC6093.sol)
pragma solidity ^0.8.20;

/**
 * @dev Standard ERC-20 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-20 tokens.
 */
interface IERC20Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC20InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC20InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `spender`’s `allowance`. Used in transfers.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     * @param allowance Amount of tokens a `spender` is allowed to operate with.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC20InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC20InvalidSpender(address spender);
}

/**
 * @dev Standard ERC-721 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-721 tokens.
 */
interface IERC721Errors {
    /**
     * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in ERC-20.
     * Used in balance queries.
     * @param owner Address of the current owner of a token.
     */
    error ERC721InvalidOwner(address owner);

    /**
     * @dev Indicates a `tokenId` whose `owner` is the zero address.
     * @param tokenId Identifier number of a token.
     */
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param tokenId Identifier number of a token.
     * @param owner Address of the current owner of a token.
     */
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC721InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC721InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param tokenId Identifier number of a token.
     */
    error ERC721InsufficientApproval(address operator, uint256 tokenId);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC721InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC721InvalidOperator(address operator);
}

/**
 * @dev Standard ERC-1155 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-1155 tokens.
 */
interface IERC1155Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     * @param tokenId Identifier number of a token.
     */
    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC1155InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1155InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC1155InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1155InvalidOperator(address operator);

    /**
     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.
     * Used in batch transfers.
     * @param idsLength Length of the array of token identifiers
     * @param valuesLength Length of the array of token amounts
     */
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}

// File: @openzeppelin/contracts/token/ERC20/ERC20.sol


// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.20;





/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC-20
 * applications.
 */
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Skips emitting an {Approval} event indicating an allowance update. This is not
     * required by the ERC. See {xref-ERC20-_approve-address-address-uint256-bool-}[_approve].
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to
     * true using the following override:
     *
     * ```solidity
     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    /**
     * @dev Updates `owner` s allowance for `spender` based on spent `value`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}

// File: @openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol


// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC20Capped.sol)

pragma solidity ^0.8.20;


/**
 * @dev Extension of {ERC20} that adds a cap to the supply of tokens.
 */
abstract contract ERC20Capped is ERC20 {
    uint256 private immutable _cap;

    /**
     * @dev Total supply cap has been exceeded.
     */
    error ERC20ExceededCap(uint256 increasedSupply, uint256 cap);

    /**
     * @dev The supplied cap is not a valid cap.
     */
    error ERC20InvalidCap(uint256 cap);

    /**
     * @dev Sets the value of the `cap`. This value is immutable, it can only be
     * set once during construction.
     */
    constructor(uint256 cap_) {
        if (cap_ == 0) {
            revert ERC20InvalidCap(0);
        }
        _cap = cap_;
    }

    /**
     * @dev Returns the cap on the token's total supply.
     */
    function cap() public view virtual returns (uint256) {
        return _cap;
    }

    /**
     * @dev See {ERC20-_update}.
     */
    function _update(address from, address to, uint256 value) internal virtual override {
        super._update(from, to, value);

        if (from == address(0)) {
            uint256 maxSupply = cap();
            uint256 supply = totalSupply();
            if (supply > maxSupply) {
                revert ERC20ExceededCap(supply, maxSupply);
            }
        }
    }
}

// File: @openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol


// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC20Burnable.sol)

pragma solidity ^0.8.20;



/**
 * @dev Extension of {ERC20} that allows token holders to destroy both their own
 * tokens and those that they have an allowance for, in a way that can be
 * recognized off-chain (via event analysis).
 */
abstract contract ERC20Burnable is Context, ERC20 {
    /**
     * @dev Destroys a `value` amount of tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 value) public virtual {
        _burn(_msgSender(), value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, deducting from
     * the caller's allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `value`.
     */
    function burnFrom(address account, uint256 value) public virtual {
        _spendAllowance(account, _msgSender(), value);
        _burn(account, value);
    }
}

// File: @openzeppelin/contracts/access/Ownable.sol


// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;


/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// File: @openzeppelin/contracts/security/Pausable.sol


// OpenZeppelin Contracts (last updated v4.7.0) (security/Pausable.sol)

pragma solidity ^0.8.0;


/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        require(!paused(), "Pausable: paused");
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        require(paused(), "Pausable: not paused");
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

// File: @openzeppelin/contracts/security/ReentrancyGuard.sol


// OpenZeppelin Contracts (last updated v4.9.0) (security/ReentrancyGuard.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}

// File: contracts/NBTX.sol


pragma solidity ^0.8.24;

// Import OpenZeppelin libraries for ERC20 functionality and security






/**
 * @title NetbitXToken
 * @dev Implementation of the NetbitX Token with advanced security features and cross-chain capabilities.
 * 
 * Features:
 * - Capped supply of 1,000,000 tokens
 * - Built-in protection against common attack vectors
 * - Cross-chain swap functionality through burning mechanism
 * - Advanced trading controls and limits
 * - Emergency stop functionality
 * 
 * Security Features:
 * - ReentrancyGuard for all external functions
 * - Transaction amount limits
 * - Wallet amount limits
 * - Trading cooldowns
 * - Block volume limits
 * - Blacklist functionality
 * 
 * @custom:info-contact info@netbitx.com
 */
contract NetbitXToken is
    ERC20,
    ERC20Capped,
    ERC20Burnable,
    Ownable,
    Pausable,
    ReentrancyGuard
{
  
    /**
     * @dev Burning mechanism configurations
     */
    bool public burningActive = false; // Controls if burning is enabled
    bool public emergencyStop = false; // Emergency stop for critical situations
    uint256 public burnRequestCooldown = 2 minutes; // Cooldown between burn requests
    uint256 public minBurnAmount = 0.5 * 10 ** 18; // Minimum burnable amount
    uint256 public burnMultiplier = 200; // Multiplier for cross-chain swap rewards (200%)

     /**
     * @dev Protection-related state variables
     */
    uint256 public maxTxAmount; // Limits a purchase to a % of total supplt per TX between cool downs
    uint256 maxWalletAmount; // // Limits purchase to a % of total supplt per wallet
    uint256 public maxVolumePerBlock; // Maximum volume allowed per block

      /**
     * @dev Trading control variables
     */
    bool public tradingEnabled; // Control if trading is active
    uint256 public tradingEnabledAt; // Timestamp when trading was enabled
    uint256 public constant TRADING_ACTIVATION_DELAY = 1 minutes; // Delay after enabling trading
    uint256 public constant TRANSFER_COOLDOWN = 30 seconds; // Adjustable cooldown period


     /**
     * @dev Mappings for various token functionalities
     */
    mapping(address => uint256) private lastTransactionTimestamp;
    mapping(address => uint256) private lastBurnRequestTime;  // Track last burn request time to enforce cooldowns
    mapping(uint256 => uint256) public volumePerBlock; // Track volume per block
    mapping(address => BurnVerification[]) public burnVerifications;   
    mapping(address => bool) private _blacklisted;

    // ================================
    // Events
    // ================================
    
    event BlacklistUpdated(address indexed account, bool isBlacklisted); // Logs changes to blacklist
    event TokenBurnedForCrossChainSwap(
        address indexed burner, // Address that burned tokens
        uint256 burnedAmount, // Amount of tokens burned
        uint256 newBlockchainAmount // Rewarded tokens on the target blockchain
    );
    event BurningStatusChanged(bool isActive); // Logs changes to burning activation
    event EmergencyStopChanged(bool isActive); // Logs changes to the emergency stop
    event AdminAction(string action, address indexed admin, uint256 timestamp); // Logs significant administrative actions
    event MaxVolumeLimitUpdated(uint256 newLimit); 
    event MaxTxAmountUpdated(uint256 newAmount);
    event MaxWalletAmountUpdated(uint256 newAmount);
    event TradingEnabled(uint256 timestamp);

       
   // ================================
    // Structs
    // ================================

    /**
     * @dev Structure for tracking burn verifications
     * @param burnHash Unique hash of the burn transaction
     * @param verified Whether the burn has been verified
     * @param timestamp When the burn occurred
     */
    struct BurnVerification {
     bytes32 burnHash;
     bool verified;
     uint256 timestamp;
}

    // ================================
    // Modifiers
    // ================================

  /**
     * @dev Modifier that implements various transaction protection checks.
     * This modifier ensures transactions comply with security limits and cooldown periods.
     * 
     * Protection mechanisms:
     * 1. Blacklist check for both sender and recipient
     * 2. Maximum transaction amount limit
     * 3. Transfer cooldown period enforcement
     * 4. Maximum wallet balance limit
     * 
     * @param sender The address sending the tokens
     * @param recipient The address receiving the tokens
     * @param amount The amount of tokens being transferred
     * 
     * Requirements:
     * - Neither sender nor recipient can be blacklisted
     * - Transfer amount must not exceed maxTxAmount 
     * - Sender must wait for cooldown period between transactions
     * - Recipient's resulting balance must not exceed maxWalletAmount
     * 
     * Exceptions:
     * - Owner is exempt from all limits
     * -Burn address (0x0) are exempt from max wallet limit
     */
    modifier protectionChecks(address sender, address recipient, uint256 amount) {
            require(!isBlacklisted(sender) && !isBlacklisted(recipient), "Address is blacklisted");
        
        if (sender != owner() && recipient != owner()) {  // Owner exempt from limits
            // Transaction amount limit
            require(amount <= maxTxAmount, "Amount exceeds max transaction limit");
            
            // Cooldown check
            require(
                block.timestamp >= lastTransactionTimestamp[sender] + TRANSFER_COOLDOWN,
                "Must wait for cooldown period"
            );
            
            // Max wallet check (skip for burn address)
            if (recipient != address(0)) {
                uint256 recipientBalance = balanceOf(recipient) + amount;
                require(recipientBalance <= maxWalletAmount, "Exceeds max wallet limit");
            }
        }
        _;
        
        // Update last transaction timestamp
        lastTransactionTimestamp[sender] = block.timestamp;
    }

     /**
     * @dev Additional security checks for transactions
     */
    modifier enhancedProtectionChecks(address sender, address recipient, uint256 amount) {
     require(volumePerBlock[block.number] + amount <= maxVolumePerBlock, "Exceeds block volume");
        require(sender != recipient, "Self-transfers prohibited");
    _;
    volumePerBlock[block.number] += amount;
}

    /**
     * @dev Ensures trading is enabled and activation delay has passed
     */
    modifier onlyAfterTrading() {
        require(tradingEnabled, "Trading not enabled");
        require(block.timestamp >= tradingEnabledAt + TRADING_ACTIVATION_DELAY, 
                "Trading not active yet");
        _;
    }


     // ================================
     // Constructor
    // ================================

    /**
     * @dev Constructor to initialize the contract with the owner.
     * @param initialOwner Address to receive the minted tokens at deployment.
     */
    constructor(
        address initialOwner
    )
        ERC20("NetbitX", "NBTX") // Token name and symbol
        ERC20Capped(1000000 * 10 ** 18) // Cap total token supply at 1,000,000
        Ownable(initialOwner)
    {
        require(initialOwner != address(0), "Owner cannot be zero address");
        burningActive = false;
        maxTxAmount = (cap() * 5) / 10000;     // 0.05% of total supply, will be changed with time 
        maxWalletAmount = (cap() * 1) / 1000; // 0.1% of total supply , will be changed with time 
        maxVolumePerBlock = cap() * 1 / 100; // 1% of total supply per block
       _mint(initialOwner, cap()); // Mint the entire supply to the owner

        tradingEnabled = false;
       
    }

    // ================================
    // Admin Functions
    // ================================


     /**
     * @dev Sets the maximum amount of tokens that can be transferred in a single transaction.
     * This limit helps prevent large dumps and market manipulation.
     * 
     * Emits a {MaxTxAmountUpdated} event.
     * 
     * @param newAmount The new maximum transaction amount (in token units)
     * 
     * @custom:example setMaxTxAmount(1000 * 10**18) // Sets limit to 1000 tokens (Will be changed with time)
     */
    function setMaxTxAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0 && newAmount <= cap(), "Invalid amount");
        maxTxAmount = newAmount;
        emit MaxTxAmountUpdated(newAmount);
    }
    
    /*
     * @dev Sets the maximum amount of tokens that can be held in a single wallet.
     * This limit helps prevent token accumulation by whales and promotes better distribution.
     * 
     * Emits a {MaxWalletAmountUpdated} event.
     * 
     * @param newAmount The new maximum wallet amount (in token units)
     * 
     * Requirements:
     * - Can only be called by the contract owner
     * - New amount must be greater than 0
     * - New amount must not exceed the total token cap
     * 
     * Exceptions:
     * - Owner wallet is not subject to this limit
     * - Burn address (0x0) is not subject to this limit
     * 
     * @custom:Considered token distribution goals when setting this value
     * @custom:example setMaxWalletAmount(5000 * 10**18) // Sets limit to 5000 tokens (Will be changed with time)
     */

     function setMaxWalletAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0 && newAmount <= cap(), "Invalid amount");
        maxWalletAmount = newAmount;
        emit MaxWalletAmountUpdated(newAmount);
    }

    /**
     * @notice Enables or disables token burning functionality.
     * @param isActive Boolean to enable or disable burning.
     */
    function setBurningActive(bool isActive) external onlyOwner {
        burningActive = isActive;
        emit BurningStatusChanged(isActive);
        emit AdminAction(
            "Burning Activation Updated",
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Toggles the emergency stop functionality to halt all token transfers.
     */
    function toggleEmergencyStop() external onlyOwner {
        emergencyStop = !emergencyStop;
        emit EmergencyStopChanged(emergencyStop);
        emit AdminAction("Emergency Stop Toggled", msg.sender, block.timestamp);
    }

    /**
     * @notice Enables trading of the token
     * @dev Can only be called once by the owner
     */
   function enableTrading() external onlyOwner {
    require(!tradingEnabled, "Trading already enabled");
    tradingEnabled = true;
    tradingEnabledAt = block.timestamp; // Changed from tradingEnabled = block.timestamp
    emit TradingEnabled(block.timestamp);
}

/**
     * @notice Sets the maximum volume allowed per block
     * @param newLimit The new maximum volume per block
     * @dev Requires timelock
     */
    function setMaxVolumePerBlock(uint256 newLimit) external onlyOwner {
        require(newLimit > 0 && newLimit <= cap(), "Invalid limit");
        maxVolumePerBlock = newLimit;
        emit MaxVolumeLimitUpdated(newLimit);
    }
    /**
    * @notice Updates the blacklist status for a given address
    * @param account The account to update blacklist status for
    * @param blacklisted True to blacklist the account, false to remove from blacklist
    * @dev Only callable by owner
    */
   function setBlacklist(address account, bool blacklisted) external onlyOwner {
        _blacklisted[account] = blacklisted;
        emit BlacklistUpdated(account, blacklisted);
    }

    /**
     * @notice Pauses all token transfers.
     * @dev Can only be called by the contract owner.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses all token transfers.
     * @dev Can only be called by the contract owner.
     */
    function unpause() public onlyOwner {
        _unpause();
    }

      // ================================
      //      USER-ACCESSIBLE FUNCTIONS
     // ================================

     // Disable direct burn function
    function burn(uint256 /* amount */) public pure override {
    revert("Direct burn not allowed. Use burnForCrossChainSwap.");
}

    // Disable direct burnFrom function
    function burnFrom(address /* account */, uint256 /* amount */) public pure override {
    revert("Direct burnFrom not allowed. Use burnForCrossChainSwap.");
}
   
    /**
     * @notice Allows users to burn tokens for cross-chain swaps. NetbitX Wallet address for tokens to be sent to is not stored for privacy.
     * @dev The burn amount must meet the minimum requirements, and the caller must not be blacklisted.
     * @param amount Number of tokens to burn.
     */
    function burnForCrossChainSwap(uint256 amount) public nonReentrant {
        require(!emergencyStop, "Emergency stop is active");
        require(burningActive, "Burning is not active");
        require(amount >= minBurnAmount, "Burn amount too small");
        require(!isBlacklisted(msg.sender), "Blacklisted address");
        require(
            block.timestamp >=
                lastBurnRequestTime[msg.sender] + burnRequestCooldown,
            "Cooldown not elapsed"
        );

        // Log to confirm it passes checks
        emit AdminAction("Burning Function Accessed", msg.sender, block.timestamp);


        lastBurnRequestTime[msg.sender] = block.timestamp; // Enforce cooldown
        super.burn(amount); // Burn tokens

        uint256 newBlockchainAmount = (amount * burnMultiplier) / 100; // Calculate reward
        emit TokenBurnedForCrossChainSwap(
            msg.sender,
            amount,
            newBlockchainAmount
        );
    }

     /**
     * @notice Transfers tokens, including blacklist checks.
     * @param recipient The address to receive the tokens.
     * @param amount The amount of tokens to transfer.
     */
    function transfer(
        address recipient,
        uint256 amount
    ) public virtual override nonReentrant whenNotPaused onlyAfterTrading protectionChecks(msg.sender, recipient, amount) returns (bool) {
        require(volumePerBlock[block.number] + amount <= maxVolumePerBlock, "Exceeds block volume limit");
        require(!emergencyStop, "Emergency stop is active");
        require(!isBlacklisted(msg.sender), "Sender is blacklisted");
        require(!isBlacklisted(recipient), "Recipient is blacklisted");

        return super.transfer(recipient, amount); // Transfer remaining amount
    }

    /**
     * @notice Transfers tokens via an approved spender, including blacklist checks.
     * @param sender The address sending the tokens.
     * @param recipient The address receiving the tokens.
     * @param amount The amount of tokens to transfer.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override nonReentrant whenNotPaused onlyAfterTrading protectionChecks(sender, recipient, amount) returns (bool) {
        require(volumePerBlock[block.number] + amount <= maxVolumePerBlock, "Exceeds block volume limit");
        require(!emergencyStop, "Emergency stop is active");
        require(!isBlacklisted(sender), "Sender is blacklisted");
        require(!isBlacklisted(recipient), "Recipient is blacklisted");

        return super.transferFrom(sender, recipient, amount); // Transfer amount

    }

    // ================================
    // View Functions
    // ================================

    /**
     * @notice Checks if an address is blacklisted
     * @param account Address to check
     * @return isBlacklisted Boolean indicating whether the account is blacklisted
     */
    function isBlacklisted(address account) public view returns (bool) {
        return _blacklisted[account];
    }

     /**
     * @notice Override of renounceOwnership to prevent ownership renouncement
     */
    function renounceOwnership() public view override onlyOwner {
        revert("Renouncing ownership is disabled");
    }

 // ================================
    // Internal Functions
    // ================================

    /**
     * @dev Updates token balances
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param value Amount of tokens
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20, ERC20Capped) {
        super._update(from, to, value);
    }

    // ================================
    // Recovery Functions
    // ================================

    /**
     * @notice Recovers ERC20 tokens sent to this contract
     * @param tokenAddress Address of the token to recover
     * @param tokenAmount Amount of tokens to recover
     */
    function recoverERC20(
        address tokenAddress,
        uint256 tokenAmount
    ) external onlyOwner {
        require(tokenAddress != address(this), "Cannot recover native token");
        IERC20(tokenAddress).transfer(owner(), tokenAmount);
    }
}