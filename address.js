import { Keypair } from "@solana/web3.js";
import { mnemonicToSeedSync } from "bip39";
import nacl from "tweetnacl";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const MNEMONIC = process.env.MNEMONIC;

if (!MNEMONIC) {
    console.error("❌ Error: MNEMONIC is missing in .env file!");
    process.exit(1);
}

function generateWallets(mnemonic, count = 10) {
    const seed = mnemonicToSeedSync(mnemonic, ""); // Convert mnemonic to seed
    const wallets = [];

    for (let i = 0; i < count; i++) {
        const path = `m/44'/501'/${i}'/0'`; // Solana BIP44 derivation path
        const derivedSeed = seed.slice(0, 32); // First 32 bytes
        const keypair = Keypair.fromSeed(derivedSeed);

        wallets.push({
            index: i + 1,
            publicKey: keypair.publicKey.toBase58(),
            privateKey: Buffer.from(keypair.secretKey).toString("base64"),
        });
    }

    return wallets;
}

// Generate and print 10 addresses
const wallets = generateWallets(MNEMONIC, 10);
wallets.forEach(({ index, publicKey, privateKey }) => {
    console.log(`🔹 Wallet ${index}:`);
    console.log(`   Public Key: ${publicKey}`);
    console.log(`   Private Key (Base64): ${privateKey}\n`);
});
