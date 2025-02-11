import { Keypair } from "@solana/web3.js";
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";

function generateWallets(mnemonic, count = 10) {
    const seed = mnemonicToSeedSync(mnemonic, ""); // Convert mnemonic to seed
    const wallets = [];

    for (let i = 0; i < count; i++) {
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

// Example Usage:
const MNEMONIC = "your mnemonic phrase here";
const generatedWallets = generateWallets(MNEMONIC, 10);
console.log(generatedWallets);
