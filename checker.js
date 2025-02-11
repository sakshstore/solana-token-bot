// check-packages-dynamic.js

const fs = require('fs');
const path = require('path');

// Get the file path from command line arguments.
// Usage: node check-packages-dynamic.js <file-to-scan>
const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node check-packages-dynamic.js <file-to-scan>');
    process.exit(1);
}

// Read the content of the provided file.
let code;
try {
    code = fs.readFileSync(filePath, 'utf-8');
} catch (err) {
    console.error(`Error reading file ${filePath}: ${err.message}`);
    process.exit(1);
}

// Regular expression to detect CommonJS require() calls.
// Matches patterns like: require('moduleName') or require("moduleName")
const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

// Regular expression to detect ES module import statements.
// Matches patterns like: import something from 'moduleName'; or import 'moduleName';
const importRegex = /import\s+(?:[\w*\s{},]+\s+from\s+)?['"]([^'"]+)['"]/g;

const packages = new Set();
let match;

// Process require() statements.
while ((match = requireRegex.exec(code)) !== null) {
    const moduleName = match[1];
    // Exclude relative paths (those starting with '.' or '/')
    if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
        packages.add(moduleName);
    }
}

// Process import statements.
while ((match = importRegex.exec(code)) !== null) {
    const moduleName = match[1];
    // Exclude relative paths
    if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
        packages.add(moduleName);
    }
}

if (packages.size === 0) {
    console.log('No external packages found in the file.');
    process.exit(0);
}

// Convert the set to an array and create the npm install command.
const packageList = Array.from(packages);
console.log('Detected external packages:');
console.log(packageList.join(', '));
console.log('\nTo install these packages, simply run the following command:\n');
console.log(`npm install ${packageList.join(' ')}`);
