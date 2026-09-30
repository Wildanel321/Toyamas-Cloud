#!/usr/bin/env node

const path = require("path");

// Register ts-node or run bundled/compiled CLI
try {
  require("typescript");
  const tsNode = require("ts-node");
  tsNode.register({
    transpileOnly: true,
    compilerOptions: {
      module: "commonjs",
    },
  });
  const { program } = require("../cli/index.ts");
  program.parse(process.argv);
} catch {
  // If ts-node not available, execute via Node module or bundle
  const { program } = require("../cli/index.ts");
  program.parse(process.argv);
}
