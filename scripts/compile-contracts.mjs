import fs from "node:fs";
import path from "node:path";
import solc from "solc";
const files = ["MockB20.sol", "EquityKey.sol"];
const sources = Object.fromEntries(files.map((file) => [file, { content: fs.readFileSync(path.join("contracts", file), "utf8") }]));
const input = { language: "Solidity", sources, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } };
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors || []).filter((entry) => entry.severity === "error");
if (errors.length) { console.error(errors.map((entry) => entry.formattedMessage).join("\n")); process.exit(1); }
fs.mkdirSync("artifacts", { recursive: true });
for (const [source, contracts] of Object.entries(output.contracts)) for (const [name, artifact] of Object.entries(contracts)) fs.writeFileSync(path.join("artifacts", `${name}.json`), JSON.stringify({ contractName: name, sourceName: source, abi: artifact.abi, bytecode: `0x${artifact.evm.bytecode.object}` }, null, 2));
console.log("Compiled EquityKey and MockB20");
