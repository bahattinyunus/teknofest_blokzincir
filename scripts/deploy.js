async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying BlockArchitectCore with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const Core = await ethers.getContractFactory("BlockArchitectCore");
    const core = await Core.deploy();

    await core.deployed();

    console.log("BlockArchitectCore deployed to:", core.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
