 UnusedVariables
    1) "before each" hook for "should deploy properly"


  0 passing (2s)
  1 failing

  1) UnusedVariables
       "before each" hook for "should deploy properly":
     TypeError: contract.deployed is not a function
      at Context.<anonymous> (test/unused_variables-test.js:11:20)/* @Labeled: [8] */
pragma solidity ^0.4.25;

contract TypoOneCommand {
    uint numberOne = 1;

    function alwaysOne() public {
        numberOne =+ 1;
    }
}
