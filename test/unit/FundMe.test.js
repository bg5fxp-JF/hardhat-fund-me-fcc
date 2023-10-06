const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe, deployer, mockV3aggregator, MockV3AggregatorAddress;
          const sendValue = ethers.utils.parseEther("1"); //1 ether
          beforeEach(async function () {
              // deploying fund me contract
              // using hard hat deploy
              // const accounts = await ethers.getSigners();
              // const accountZero = accounts[0];
              deployer = (await getNamedAccounts()).deployer;
              deployer = await ethers.getSigner(deployer);
              const Deployments = await deployments.fixture(["all"]);
              const fundMeAddress = Deployments.FundMe.address;
              MockV3AggregatorAddress = Deployments.MockV3Aggregator.address;
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  fundMeAddress,
                  deployer,
              );
              // mockV3aggregator = await ethers.getContractAt(
              //     "MockV3Aggregator",

              //     deployer,
              // );
          });

          describe("constructor", async function () {
              it("sets aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, MockV3AggregatorAddress);
              });
          });

          describe("fund", async function () {
              it("fails if not enough eth is sent", async function () {
                  await expect(fundMe.fund()).to.be.rejectedWith(
                      "You need to spend more ETH!",
                  );
              });

              it("should correctly map the person to how much they funded", async function () {
                  await fundMe.fund({ value: sendValue });

                  const response = await fundMe.getAddressToAmountFunded(
                      deployer.address,
                  );

                  assert.equal(response.toString(), sendValue.toString());
              });
              it("should correctly correct add funder to array", async function () {
                  await fundMe.fund({ value: sendValue });

                  const response = await fundMe.getFunder(0);

                  assert.equal(
                      response.toString(),
                      deployer.address.toString(),
                  );
              });
          });

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("should allow the owner to withdraw", async function () {
                  //arrange
                  const statringFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const statringdeployerBalance =
                      await fundMe.provider.getBalance(deployer.address);

                  //act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReciept = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReciept;

                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address,
                  );
                  const endingdeployerBalance =
                      await fundMe.provider.getBalance(deployer.address);
                  //assert
                  let checkBal = statringFundMeBalance.add(
                      statringdeployerBalance,
                  );
                  assert.equal(
                      checkBal.toString(),
                      endingdeployerBalance.add(gasCost).toString(),
                  );
                  assert.equal(endingFundMeBalance, 0);
              });
              it("should allow to withdraw from multiple fuders funding", async function () {
                  //arrange
                  const accounts = await ethers.getSigners();

                  for (let i = 0; i < 6; i++) {
                      const funcdMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      );

                      await funcdMeConnectedContract.fund({ value: sendValue });
                  }
                  const statringFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const statringdeployerBalance =
                      await fundMe.provider.getBalance(deployer.address);

                  //act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReciept = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReciept;

                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address,
                  );
                  const endingdeployerBalance =
                      await fundMe.provider.getBalance(deployer.address);
                  //assert
                  let checkBal = statringFundMeBalance.add(
                      statringdeployerBalance,
                  );
                  assert.equal(
                      checkBal.toString(),
                      endingdeployerBalance.add(gasCost).toString(),
                  );
                  assert.equal(endingFundMeBalance, 0);

                  // make sure Funder array is reset
                  assert.equal(await fundMe.getFundersLength(), 0);

                  for (i = 0; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      );
                  }
              });
              it("should only allow owner to withdraw", async function () {
                  // arrange
                  const accounts = await ethers.getSigners();

                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1],
                  );

                  //act
                  // const transactionResponse = await fundMeConnectedContract.withdraw();

                  await expect(
                      fundMeConnectedContract.withdraw(),
                  ).to.be.rejectedWith("FundMe__NotOwner");
              });

              it("cheaper withdraw testign", async function () {
                  //arrange
                  const accounts = await ethers.getSigners();

                  for (let i = 0; i < 6; i++) {
                      const funcdMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      );

                      await funcdMeConnectedContract.fund({ value: sendValue });
                  }
                  const statringFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const statringdeployerBalance =
                      await fundMe.provider.getBalance(deployer.address);

                  //act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReciept = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReciept;

                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address,
                  );
                  const endingdeployerBalance =
                      await fundMe.provider.getBalance(deployer.address);
                  //assert
                  let checkBal = statringFundMeBalance.add(
                      statringdeployerBalance,
                  );
                  assert.equal(
                      checkBal.toString(),
                      endingdeployerBalance.add(gasCost).toString(),
                  );
                  assert.equal(endingFundMeBalance, 0);

                  // make sure s_funders array is reset
                  assert.equal(await fundMe.getFundersLength(), 0);

                  for (i = 0; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      );
                  }
              });
          });
      });
