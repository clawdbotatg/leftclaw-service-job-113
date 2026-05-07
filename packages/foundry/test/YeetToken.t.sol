// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";
import { YeetToken } from "../contracts/YeetToken.sol";

contract YeetTokenTest is Test {
    YeetToken internal yeet;

    address internal deployer = address(0xD3);
    address internal alice = address(0xA1);
    address internal bob = address(0xB0);
    address internal pair = address(0xBEEF);
    address internal taxRecipient = 0xB2ac59aE04d0f7310dC3519573BF70387b3b6E3a;

    function setUp() public {
        vm.prank(deployer);
        yeet = new YeetToken(deployer);
    }

    function test_InitialState() public {
        assertEq(yeet.name(), "YEET");
        assertEq(yeet.symbol(), "YEET");
        assertEq(yeet.decimals(), 18);
        assertEq(yeet.totalSupply(), 1_000_000 ether);
        assertEq(yeet.balanceOf(deployer), 1_000_000 ether);
        assertEq(yeet.taxRecipient(), taxRecipient);
        assertEq(yeet.deployer(), deployer);
        assertEq(yeet.pair(), address(0));
    }

    function test_SetPair_OnlyDeployer() public {
        vm.prank(alice);
        vm.expectRevert(bytes("not deployer"));
        yeet.setPair(pair);
    }

    function test_SetPair_RejectsZero() public {
        vm.prank(deployer);
        vm.expectRevert(bytes("zero pair"));
        yeet.setPair(address(0));
    }

    function test_SetPair_LocksAfterFirstSet() public {
        vm.prank(deployer);
        yeet.setPair(pair);
        assertEq(yeet.pair(), pair);

        vm.prank(deployer);
        vm.expectRevert(bytes("pair already set"));
        yeet.setPair(address(0xCAFE));
    }

    function test_NormalTransfer_NoTax() public {
        vm.prank(deployer);
        yeet.setPair(pair);

        vm.prank(deployer);
        yeet.transfer(alice, 1000 ether);

        assertEq(yeet.balanceOf(alice), 1000 ether);
        assertEq(yeet.balanceOf(taxRecipient), 0);

        vm.prank(alice);
        yeet.transfer(bob, 500 ether);

        assertEq(yeet.balanceOf(alice), 500 ether);
        assertEq(yeet.balanceOf(bob), 500 ether);
        assertEq(yeet.balanceOf(taxRecipient), 0);
    }

    function test_BuyAppliesTax() public {
        vm.prank(deployer);
        yeet.setPair(pair);

        // Seed the pair so it can "send" tokens to alice (simulating a swap-out).
        vm.prank(deployer);
        yeet.transfer(pair, 10_000 ether);
        // Setting up the pair doesn't trigger tax in this seed because it's deployer -> pair (sell from deployer).
        // For test isolation, snapshot tax recipient now.
        uint256 taxBefore = yeet.balanceOf(taxRecipient);

        // Buy: pair -> alice
        vm.prank(pair);
        yeet.transfer(alice, 1000 ether);

        uint256 expectedTax = 1000 ether / 100; // 1%
        assertEq(yeet.balanceOf(alice), 1000 ether - expectedTax);
        assertEq(yeet.balanceOf(taxRecipient) - taxBefore, expectedTax);
    }

    function test_SellAppliesTax() public {
        vm.prank(deployer);
        yeet.setPair(pair);

        // Give alice some tokens via a normal (non-pair) path.
        vm.prank(deployer);
        yeet.transfer(alice, 1000 ether);
        assertEq(yeet.balanceOf(taxRecipient), 0, "no tax on normal transfer");

        // Sell: alice -> pair
        vm.prank(alice);
        yeet.transfer(pair, 1000 ether);

        uint256 expectedTax = 1000 ether / 100;
        assertEq(yeet.balanceOf(pair), 1000 ether - expectedTax);
        assertEq(yeet.balanceOf(taxRecipient), expectedTax);
        assertEq(yeet.balanceOf(alice), 0);
    }

    function test_NoTaxBeforePairSet() public {
        // Even moving tokens to/from an arbitrary "pair" address is untaxed before setPair.
        vm.prank(deployer);
        yeet.transfer(pair, 1000 ether);
        assertEq(yeet.balanceOf(pair), 1000 ether);
        assertEq(yeet.balanceOf(taxRecipient), 0);
    }
}
