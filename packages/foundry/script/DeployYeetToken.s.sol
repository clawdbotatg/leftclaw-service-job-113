// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { YeetToken } from "../contracts/YeetToken.sol";

interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface IUniswapV2Router02 {
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity);
}

/**
 * @notice Atomic deploy + LP setup for YeetToken on Base.
 * @dev Requires msg.value (the broadcast call) to fund initial ETH side of LP (e.g. 0.002-0.005 ETH).
 *
 * Example:
 *   yarn deploy --file DeployYeetToken.s.sol --network base --value 0.003ether
 */
contract DeployYeetToken is ScaffoldETHDeploy {
    address constant V2_FACTORY = 0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6;
    address constant V2_ROUTER = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;
    address constant WETH = 0x4200000000000000000000000000000000000006;
    /// @notice Client wallet — receives LP tokens (owns the liquidity).
    address constant CLIENT = 0x34aA3F359A9D614239015126635CE7732c18fDF3;

    function run() external ScaffoldEthDeployerRunner {
        uint256 ethAmount = address(this).balance;
        // When run via forge script with --value, the script contract receives the ETH.
        // Fall back to msg.value semantics if that's how it's invoked.
        if (ethAmount == 0) {
            ethAmount = msg.value;
        }

        // 1. Deploy YeetToken (deployer holds 1,000,000 YEET).
        YeetToken yeet = new YeetToken(deployer);
        deployments.push(Deployment({ name: "YeetToken", addr: address(yeet) }));

        // 2. Create the V2 pair against WETH.
        address pairAddress = IUniswapV2Factory(V2_FACTORY).createPair(address(yeet), WETH);

        // 3. Lock the pair on the token.
        yeet.setPair(pairAddress);

        // 4. Approve the V2 router to spend the deployer's full YEET balance.
        uint256 tokenAmount = yeet.balanceOf(deployer);
        yeet.approve(V2_ROUTER, tokenAmount);

        // 5. Add ETH liquidity. LP tokens go to client (they own the liquidity).
        IUniswapV2Router02(V2_ROUTER).addLiquidityETH{ value: ethAmount }(
            address(yeet), tokenAmount, 0, 0, CLIENT, block.timestamp + 1200
        );
    }

    receive() external payable { }
}
