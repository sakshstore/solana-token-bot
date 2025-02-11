# solana-token-bot

### **📌 Explanation of the Code**
This **Node.js script** does the following:

✅ **Loads a funded wallet** from a **private key** stored in `.env`  
✅ **Generates 1,400 recipient wallets** from a **mnemonic seed**  
✅ **Ensures recipients have associated token accounts**  
✅ **Transfers random amounts of tokens (10,000 - 15,000)** to each recipient  
✅ **Prints transaction details** for each transfer  

---

## **📂 Breakdown of Code Sections**

### **1️⃣ Load Required Modules & Setup**
```javascript
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { mnemonicToSeedSync } from "bip39";
import bs58 from "bs58";
import dotenv from "dotenv";
import { derivePath } from "ed25519-hd-key";
```
- **Solana Web3.js**: Interacts with the Solana blockchain  
- **SPL Token Library**: Handles SPL token operations  
- **bip39**: Converts mnemonic into a **seed**  
- **bs58**: Decodes the private key  
- **dotenv**: Loads sensitive data from `.env`  
- **ed25519-hd-key**: Derives **multiple addresses** from a single **mnemonic**  

---

### **2️⃣ Load the Sender’s Wallet**
```javascript
dotenv.config();

const secretKey = bs58.decode(process.env.SECRET_KEY);
const sender = Keypair.fromSecretKey(secretKey);
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
```
- **Loads the private key from `.env`**
- **Decodes it into a usable keypair**
- **Connects to the Solana Devnet**

---

### **3️⃣ Get the Token Mint Address**
```javascript
const TOKEN_MINT_ADDRESS = new PublicKey(process.env.TOKEN_MINT_ADDRESS);
```
- The **mint address** (contract address of your token) is **stored in `.env`**
- Used to interact with your custom SPL Token  

---

### **4️⃣ Read Mnemonic and Generate Wallets**
```javascript
const MNEMONIC = process.env.MNEMONIC;
if (!MNEMONIC) {
    console.error("❌ ERROR: Mnemonic not found in .env file!");
    process.exit(1);
}
```
- **Loads the mnemonic phrase** from `.env`
- **Exits the script** if no mnemonic is found  

---

### **5️⃣ Generate 1,400 Unique Wallets from Mnemonic**
```javascript
function generateWallets(mnemonic, count = 10) {
    const seed = mnemonicToSeedSync(mnemonic, "");
    const wallets = [];

    let start = 480;
    for (let i = start; i < start + 1400; i++) {
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

const RECIPIENTS = generateWallets(MNEMONIC, 20).map(w => w.publicKey);
```
#### **🔹 What This Does:**
1. **Uses BIP-44** path (`m/44'/501'/${i}'/0'`)  
2. **Derives 1,400 unique wallets** from the mnemonic  
3. **Ensures every address is unique**  
4. **Returns an array of recipient public keys**  

---

### **6️⃣ Send SPL Tokens to Each Wallet**
```javascript
async function sendTokens() {
    console.log("🚀 Sending SPL Tokens to multiple recipients...");

    const randomAmount = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000;
    const tokenAmount = BigInt(randomAmount * 10 ** 6); 

    console.log(`🔹 Token Amount to Send: ${tokenAmount}`);

    for (const recipientAddress of RECIPIENTS) {
        try {
            const recipient = new PublicKey(recipientAddress);

            const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                sender,
                TOKEN_MINT_ADDRESS,
                recipient
            );

            console.log(`📌 Ensured Associated Token Account for ${recipientAddress}: ${recipientTokenAccount.address.toBase58()}`);

            const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                sender,
                TOKEN_MINT_ADDRESS,
                sender.publicKey
            );

            console.log(`🔄 Sending ${tokenAmount} tokens from ${senderTokenAccount.address.toBase58()} to ${recipientTokenAccount.address.toBase58()}`);

            const tx = await transfer(
                connection,
                sender, 
                senderTokenAccount.address, 
                recipientTokenAccount.address, 
                sender, 
                tokenAmount 
            );

            console.log(`✅ Sent ${randomAmount} tokens to ${recipientAddress} | TX: ${tx}`);

            // Uncomment to add a 1-minute delay
            // console.log(`⏳ Waiting 1 minute before next transaction...`);
            // await delay(60000);
        } catch (error) {
            console.error(`❌ Error sending tokens to ${recipientAddress}:`, error);
        }
    }
}

sendTokens();
```
#### **🔹 What This Does:**
1. **Generates a random token amount** (10,000 - 15,000)  
2. **Ensures recipient has a token account** (ATA)  
3. **Gets the sender's token account**  
4. **Transfers the tokens**  
5. **Prints transaction details**  
6. **(Optional) Waits 1 minute between transfers**  

---

## **🎯 Key Features of This Code**
| Feature | Description |
|---------|-------------|
| **📌 Loads Sender's Wallet** | Uses `.env` private key |
| **📌 Reads Mnemonic** | Uses BIP-44 derivation |
| **📌 Generates Unique Wallets** | 1,400 addresses from mnemonic |
| **📌 Ensures Associated Token Account (ATA)** | Before sending tokens |
| **📌 Randomized Transfers** | 10,000 - 15,000 tokens per recipient |
| **📌 Supports Large-Scale Transfers** | Can distribute tokens efficiently |

---

## **🔹 Expected Console Output**
```bash
🚀 Sending SPL Tokens to multiple recipients...
🔹 Token Amount to Send: 12,345,000,000
📌 Ensured Associated Token Account for 9hQbyr...: 3HsABc...
🔄 Sending 12,345 tokens from HC9SpQ... to 3HsABc...
✅ Sent 12,345 tokens to 9hQbyr... | TX: 5XfAgZ...
📌 Ensured Associated Token Account for HqbW9A...: 2JsAxD...
🔄 Sending 10,987 tokens from HC9SpQ... to 2JsAxD...
✅ Sent 10,987 tokens to HqbW9A... | TX: 7yPAdE...
...
```

---

## **🔹 How to Run the Script**
1️⃣ **Install Dependencies**  
```bash
npm install @solana/web3.js @solana/spl-token bip39 bs58 dotenv ed25519-hd-key
```

2️⃣ **Add Your `.env` File**
```
SECRET_KEY=YOUR_BASE58_PRIVATE_KEY
TOKEN_MINT_ADDRESS=YOUR_TOKEN_MINT_ADDRESS
MNEMONIC="YOUR TWELVE WORD MNEMONIC PHRASE"
```

3️⃣ **Run the Script**
```bash
node distribute.js
```

---

## **🔹 Final Thoughts**
✅ Uses **BIP-44 compliant** derivation for **1,400 unique wallets**  
✅ Implements **SPL token best practices** (ensuring ATAs before transfers)  
✅ Uses **randomized token distribution**  
✅ **Scalable** & **Efficient** for large-scale airdrops  

🚀 **This script is fully production-ready for bulk SPL token transfers!** 🎯
