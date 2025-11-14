// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./libraries/Library.sol";
import "./stakes/Stakes.sol";

contract Main is Library, Stakes {
    // All functionality is inherited from Library and Stakes
    // This contract combines both into a single deployable contract
}
