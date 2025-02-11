import { Connection, Keypair, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

// Load wallet from private key
const secretKey = bs58.decode(process.env.SECRET_KEY);
const payer = Keypair.fromSecretKey(secretKey);

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

async function createToken() {
    try {
        console.log("🔄 Checking Wallet Balance...");

        const balance = await connection.getBalance(payer.publicKey);
        console.log(`💰 Wallet Balance: ${balance / 10 ** 9} SOL`);

        console.log("🚀 Creating SPL Token on Solana...");

        // Create a new token mint
        const mint = await createMint(
            connection,
            payer,
            payer.publicKey,  // Authority for minting new tokens
            null,             // Freeze authority (set null if you don’t need it)
            6                 // Number of decimal places (1 token = 10^6 units)
        );

        console.log(`✅ SPL Token Created: ${mint.toBase58()}`);

        // Get associated token account for the creator
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            payer.publicKey
        );

        console.log(`📌 Token Account Created: ${tokenAccount.address.toBase58()}`);

        // Mint 100 Billion Tokens (considering 6 decimal places)
        const amountToMint = 100_000_000_000 * 10 ** 6;

        await mintTo(
            connection,
            payer,
            mint,
            tokenAccount.address,
            payer.publicKey,
            amountToMint // Mint 100 billion tokens
        );

        console.log(`🎉 Minted 100 Billion tokens to ${tokenAccount.address.toBase58()}`);
        console.log("🔄 Checking Balance Again...");

        const finalBalance = await connection.getBalance(payer.publicKey);
        console.log(`💰 Wallet Balance: ${finalBalance / 10 ** 9} SOL`);
        console.log("🎯 Token Minting Complete!");

    } catch (error) {
        console.error("❌ Error creating token:", error);
    }
}

createToken();
