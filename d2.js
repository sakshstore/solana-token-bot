import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { mnemonicToSeedSync } from "bip39";
import bs58 from "bs58";
import dotenv from "dotenv";
import {derivePath} from "ed25519-hd-key";

dotenv.config();

// Load sender wallet (funded wallet)
const secretKey = bs58.decode(process.env.SECRET_KEY);
const sender = Keypair.fromSecretKey(secretKey);
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// SPL Token Mint Address
const TOKEN_MINT_ADDRESS = new PublicKey(process.env.TOKEN_MINT_ADDRESS);

// Read Mnemonic from .env
const MNEMONIC = process.env.MNEMONIC;
if (!MNEMONIC) {
    console.error("❌ ERROR: Mnemonic not found in .env file!");
    process.exit(1);
}




function generateWallets(mnemonic, count = 10) {
    const seed = mnemonicToSeedSync(mnemonic, ""); // Convert mnemonic to seed
    const wallets = [];

    let start=480;
    for (let i = start; i < start+1400; i++) {
        // Use proper derivation path for each address
        const derivationPath = `m/44'/501'/${i}'/0'`;
        const derivedSeed = derivePath(derivationPath, seed.toString("hex")).key;

        const keypair = Keypair.fromSeed(derivedSeed);

        wallets.push({
            index: i + 1,
            publicKey: keypair.publicKey.toBase58()
        });
    }

    return wallets;
}


// Generate wallet addresses
const RECIPIENTS = generateWallets(MNEMONIC, 20).map(w => w.publicKey);



// Function to delay execution for the given time in milliseconds
//const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendTokens() {
    console.log("🚀 Sending SPL Tokens to multiple recipients...");

    // Define static token amount (1,000 tokens with 6 decimals)


    // Generate a random token amount between 10,000 and 15,000 (considering 6 decimal places)
    const randomAmount = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000;
    const tokenAmount = BigInt(randomAmount * 10 ** 6); // Convert to correct format


    //const tokenAmount = BigInt(1000 * 10 ** 6);
    console.log(`🔹 Token Amount to Send: ${tokenAmount}`);

    for (const recipientAddress of RECIPIENTS) {
        try {
            const recipient = new PublicKey(recipientAddress);

            // Ensure recipient has an associated token account
            const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                sender, // Sender creates the ATA if needed
                TOKEN_MINT_ADDRESS,
                recipient
            );

            console.log(`📌 Ensured Associated Token Account for ${recipientAddress}: ${recipientTokenAccount.address.toBase58()}`);

            // Get sender's associated token account
            const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                sender,
                TOKEN_MINT_ADDRESS,
                sender.publicKey
            );

            console.log(`🔄 Sending ${tokenAmount} tokens from ${senderTokenAccount.address.toBase58()} to ${recipientTokenAccount.address.toBase58()}`);

            // Transfer SPL tokens
            const tx = await transfer(
                connection,
                sender, // Signer
                senderTokenAccount.address, // Source: Sender's token account
                recipientTokenAccount.address, // Destination: Recipient's token account
                sender, // Authority (Signer)
                tokenAmount // ✅ Correctly formatted as BigInt
            );

            console.log(`✅ Sent 1,000 tokens to ${recipientAddress} | TX: ${tx}`);

            // Wait 1 minute before processing the next transaction
          //  console.log(`⏳ Waiting 1 minute before next transaction...`);
            //await delay(10000); // 60 seconds (60000 ms)
        } catch (error) {
            console.error(`❌ Error sending tokens to ${recipientAddress}:`, error);
        }
    }
}

 sendTokens();
