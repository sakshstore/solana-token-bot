import { Connection, Keypair, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

// Load wallet from private key
if (!process.env.SECRET_KEY) {
    throw new Error("❌ SECRET_KEY is missing in .env file");
}

const secretKey = bs58.decode(process.env.SECRET_KEY.trim()); // Decode Base58 private key
const wallet = Keypair.fromSecretKey(secretKey);
const publicAddress = wallet.publicKey.toBase58(); // Extract public address

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Load token mint address from .env
const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;
if (!TOKEN_MINT_ADDRESS) {
    throw new Error("❌ TOKEN_MINT_ADDRESS is missing in .env file");
}

async function checkBalances() {
    try {
        // Fetch SOL balance
        const balance = await connection.getBalance(wallet.publicKey);
        console.log(`🔹 Public Address: ${publicAddress}`);
        console.log(`💰 SOL Balance: ${balance / 10 ** 9} SOL`);

        // Fetch SPL Token balance
        const mintAddress = new PublicKey(TOKEN_MINT_ADDRESS);
        const tokenAccount = await getAssociatedTokenAddress(mintAddress, wallet.publicKey);

        try {
            const tokenAccountInfo = await getAccount(connection, tokenAccount);
            const tokenBalance = Number(tokenAccountInfo.amount) / 10 ** 6; // Convert from smallest unit
            console.log(`🔹 SPL Token Balance: ${tokenBalance} tokens`);
        } catch (error) {
            console.log(`❌ No associated token account found for ${TOKEN_MINT_ADDRESS}.`);
            console.log("This means the wallet has **zero balance** or hasn't interacted with the token yet.");
        }
    } catch (error) {
        console.error("❌ Error fetching balances:", error);
    }
}

checkBalances();
