// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    let { deployer } = await getNamedAccounts();
    deployer = await ethers.getSigner(deployer);

    const Deployments = await deployments.fixture(["all"]);
    const fundMeAddress = Deployments.FundMe.address;

    const fundMe = await ethers.getContractAt(
        "FundMe",
        fundMeAddress,
        deployer,
    );
    console.log(`Got contract FundMe at ${fundMe.address}`);

    console.log("Funding contract...");
    const transactionResponse = await fundMe.fund({
        value: ethers.utils.parseEther("1"),
    });
    await transactionResponse.wait();
    console.log("Funded!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
