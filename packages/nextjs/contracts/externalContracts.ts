import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const externalContracts = {
  8453: {
    UniswapV2Router: {
      address: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
      abi: [
        {
          name: "swapExactETHForTokensSupportingFeeOnTransferTokens",
          type: "function",
          stateMutability: "payable",
          inputs: [
            { name: "amountOutMin", type: "uint256" },
            { name: "path", type: "address[]" },
            { name: "to", type: "address" },
            { name: "deadline", type: "uint256" },
          ],
          outputs: [],
        },
        {
          name: "swapExactTokensForETHSupportingFeeOnTransferTokens",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "amountIn", type: "uint256" },
            { name: "amountOutMin", type: "uint256" },
            { name: "path", type: "address[]" },
            { name: "to", type: "address" },
            { name: "deadline", type: "uint256" },
          ],
          outputs: [],
        },
        {
          name: "getAmountsOut",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "amountIn", type: "uint256" },
            { name: "path", type: "address[]" },
          ],
          outputs: [{ name: "amounts", type: "uint256[]" }],
        },
      ],
    },
    YeetPair: {
      address: "0x16048B16Aace160Cdb7dF4De2E20b4d28b5227FA",
      abi: [
        {
          name: "getReserves",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [
            { name: "reserve0", type: "uint112" },
            { name: "reserve1", type: "uint112" },
            { name: "blockTimestampLast", type: "uint32" },
          ],
        },
        {
          name: "token0",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "address" }],
        },
        {
          name: "token1",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "address" }],
        },
        {
          name: "Transfer",
          type: "event",
          inputs: [
            { name: "from", type: "address", indexed: true },
            { name: "to", type: "address", indexed: true },
            { name: "value", type: "uint256", indexed: false },
          ],
        },
      ],
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
