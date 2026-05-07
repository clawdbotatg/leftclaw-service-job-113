// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title YeetToken
 * @notice Minimal ERC20 with a 1% tax on Uniswap V2 buys/sells.
 * @dev No owner mint, no pause, no blacklist — minimal surface area for a test token.
 *      Tax is taken on transfers where `from == pair` (buy) or `to == pair` (sell)
 *      and forwarded to a fixed `taxRecipient`. Internal-to-internal transfers (the
 *      tax forward itself, treasury moves, etc.) pass through untaxed because neither
 *      side is the pair, so there's no recursion.
 */
contract YeetToken is ERC20 {
    /// @notice Fixed tax recipient.
    address public immutable taxRecipient = 0xB2ac59aE04d0f7310dC3519573BF70387b3b6E3a;

    /// @notice Deployer — only address allowed to call setPair.
    address public immutable deployer;

    /// @notice Uniswap V2 pair address. Settable exactly once.
    address public pair;

    event PairSet(address indexed pair);

    constructor(address initialOwner) ERC20("YEET", "YEET") {
        deployer = initialOwner;
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    /**
     * @notice Set the V2 pair address. Callable exactly once by the deployer.
     */
    function setPair(address _pair) external {
        require(msg.sender == deployer, "not deployer");
        require(pair == address(0), "pair already set");
        require(_pair != address(0), "zero pair");
        pair = _pair;
        emit PairSet(_pair);
    }

    /**
     * @dev OZ 5.x ERC20 transfer hook. Apply 1% tax on buys/sells via the pair.
     */
    function _update(address from, address to, uint256 value) internal override {
        address _pair = pair;
        if (_pair != address(0) && (from == _pair || to == _pair) && from != address(0) && to != address(0)) {
            uint256 taxAmount = value / 100;
            if (taxAmount > 0) {
                super._update(from, taxRecipient, taxAmount);
                super._update(from, to, value - taxAmount);
                return;
            }
        }
        super._update(from, to, value);
    }
}
