import { Connection, Keypair, clusterApiUrl, PublicKey, Transaction } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer, getTokenAccountsByOwner } from "@solana/spl-token";
import { mnemonicToSeedSync } from "bip39";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const secretKey = bs58.decode(process.env.SECRET_KEY);
const sender = Keypair.fromSecretKey(secretKey);

const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS ? new PublicKey(process.env.TOKEN_MINT_ADDRESS) : null;
const MNEMONIC = process.env.MNEMONIC;

if (!MNEMONIC) {
    console.error("❌ ERROR: Mnemonic not found in .env file!");
    process.exit(1);
}

// Function to generate 10 unique wallet addresses from mnemonic
function generateWallets(mnemonic, count = 10) {
    const seed = mnemonicToSeedSync(mnemonic, "");
    const wallets = [];

    for (let i = 0; i < count; i++) {
        const derivedSeed = seed.slice(i * 32, (i + 1) * 32); // Ensures unique keypairs
        const keypair = Keypair.fromSeed(derivedSeed);
        wallets.push(keypair.publicKey.toBase58());
    }

    return wallets;
}

async function createToken() {
    if (TOKEN_MINT_ADDRESS) {
        console.log(`✅ Token already exists: ${TOKEN_MINT_ADDRESS.toBase58()}`);
        return TOKEN_MINT_ADDRESS;
    }

    console.log("🚀 Creating SPL Token on Solana...");
    const mint = await createMint(
        connection,
        sender,
        sender.publicKey,
        null,
        6
    );

    const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, sender, mint, sender.publicKey);
    const amountToMint = BigInt(100_000_000_000) * BigInt(10 ** 6); // 100 Billion Tokens

    await mintTo(connection, sender, mint, tokenAccount.address, sender.publicKey, amountToMint);
    console.log(`🎉 Minted 100 Billion tokens to ${tokenAccount.address.toBase58()}`);

    return mint;
}

async function distributeTokens(mintAddress) {
    const recipients = generateWallets(MNEMONIC, 10);
    console.log("🚀 Sending SPL Tokens to multiple recipients...");

    for (const recipientAddress of recipients) {
        try {
            const recipient = new PublicKey(recipientAddress);
            const tokenAmount = BigInt(Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000) * BigInt(10 ** 6);

            const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(connection, sender, mintAddress, recipient);
            const senderTokenAccount = await getOrCreateAssociatedTokenAccount(connection, sender, mintAddress, sender.publicKey);

            console.log(`🔄 Sending ${tokenAmount / BigInt(10 ** 6)} tokens to ${recipientAddress}`);
            await transfer(connection, sender, senderTokenAccount.address, recipientTokenAccount.address, sender.publicKey, tokenAmount);
            console.log(`✅ Sent tokens to ${recipientAddress}`);

            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute before next transaction
        } catch (error) {
            console.error(`❌ Error sending tokens to ${recipientAddress}:`, error);
        }
    }
}

async function fetchTokenHolders(mintAddress) {
    console.log(`🔍 Fetching Token Holders for: ${mintAddress.toBase58()}`);
    const accounts = await connection.getTokenAccountsByMint(mintAddress);

    const holders = accounts.value.map(account => new PublicKey(account.pubkey).toBase58());
    console.log(`✅ Found ${holders.length} Token Holders:\n`, holders);
}

// Main Execution
(async () => {
    const mintAddress = await createToken();
    await distributeTokens(mintAddress);
    await fetchTokenHolders(mintAddress);
})();
