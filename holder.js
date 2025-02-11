import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import dotenv from "dotenv";

dotenv.config();

// Load Token Mint Address from .env
const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;

if (!TOKEN_MINT_ADDRESS) {
    console.error("❌ ERROR: TOKEN_MINT_ADDRESS is missing in .env file!");
    process.exit(1);
}

// Solana Token Program ID (Fixed for all SPL tokens)
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// Solana Connection (using Devnet, change to Mainnet if needed)
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

async function getTokenHolders() {
    try {
        console.log(`🔍 Fetching Token Holders for: ${TOKEN_MINT_ADDRESS}`);

        // Query all token accounts holding this SPL token
        const tokenAccounts = await connection.getProgramAccounts(
            TOKEN_PROGRAM_ID, // Token program ID
            {
                filters: [
                    {
                        dataSize: 165, // Token account size
                    },
                    {
                        memcmp: {
                            offset: 0, // Offset for mint address
                            bytes: TOKEN_MINT_ADDRESS, // Your token mint address
                        },
                    },
                ],
            }
        );

        if (tokenAccounts.length === 0) {
            console.log("❌ No token holders found.");
            return;
        }

        console.log(`✅ Found ${tokenAccounts.length} Token Holders:`);
        tokenAccounts.forEach((account, index) => {
            console.log(`${index + 1}. ${account.pubkey.toBase58()}`);
        });

    } catch (error) {
        console.error("❌ Error fetching token holders:", error);
    }
}

// Run the function
getTokenHolders();
