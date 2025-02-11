import { Connection, PublicKey, clusterApiUrl, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { createCreateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

// Load wallet from private key
const secretKey = bs58.decode(process.env.SECRET_KEY);
const payer = Keypair.fromSecretKey(secretKey);
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Existing Token Mint Address
const MINT_ADDRESS = new PublicKey(process.env.TOKEN_MINT_ADDRESS);

// Metadata Program ID
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

async function setTokenMetadata() {
    const metadataPDA = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            METADATA_PROGRAM_ID.toBuffer(),
            MINT_ADDRESS.toBuffer(),
        ],
        METADATA_PROGRAM_ID
    )[0];

    const metadata = {
        name: "MyToken", // 🔥 Change this to your desired token name
        symbol: "MTK", // 🔥 Set your token symbol
        uri: "https://example.com/metadata.json", // 🔥 Upload metadata JSON file & set its link here
        sellerFeeBasisPoints: 0, // No royalty fee
        creators: null,
        collection: null,
        uses: null
    };

    const transaction = new Transaction().add(
        createCreateMetadataAccountV2Instruction(
            {
                metadata: metadataPDA,
                mint: MINT_ADDRESS,
                mintAuthority: payer.publicKey,
                payer: payer.publicKey,
                updateAuthority: payer.publicKey,
            },
            {
                data: metadata,
                isMutable: true // Allows future updates
            }
        )
    );

    await sendAndConfirmTransaction(connection, transaction, [payer]);

    console.log(`✅ Token Metadata Set! Name: ${metadata.name}, Symbol: ${metadata.symbol}`);
}

setTokenMetadata().catch(console.error);
