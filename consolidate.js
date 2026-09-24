const fs = require('fs');
const path = require('path');

const skipDirs = new Set([
  'node_modules', 'venv', 'env', '.venv', '__pycache__', 
  '.git', '.next', 'dist', 'build', '.vercel', 'public', 'assets',
  'migrations', 'staticfiles', 'forex_data', 'trading_data', '.vscode',
  'out', '.turbo', 'coverage', '.cache'
]);

const skipFiles = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'full_project_code.txt', 
  '.DS_Store', 'consolidate_code.py', 'consolidate.js',
  '.gitignore', '.env', '.env.local', 'tsconfig.json', 'package.json',
  'postcss.config.js', 'tailwind.config.js', 'components.json',
  'eslint.config.js', 'vite.config.ts', 'tsconfig.app.json',
  'tsconfig.node.json', 'full_project_code.txt', 'next.config.js',
  'next.config.mjs', 'next-env.d.ts', '.eslintrc.json'
]);

const includeExtensions = new Set([
  '.py', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.prisma'
]);

function consolidateCode(rootDir, outputFile) {
  let fileCount = 0;
  const outStream = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  outStream.write("=".repeat(80) + "\n");
  outStream.write("LOIS SPICE PROJECT - SOURCE CODE CONSOLIDATION\n");
  outStream.write(`Generated: ${new Date().toISOString().replace('T', ' ').split('.')[0]}\n`);
  outStream.write("=".repeat(80) + "\n\n");

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (item.isDirectory()) {
        if (!skipDirs.has(item.name)) {
          walk(fullPath);
        }
      } else {
        if (skipFiles.has(item.name)) continue;
        const ext = path.extname(item.name).toLowerCase();
        if (!includeExtensions.has(ext)) continue;

        try {
          const stats = fs.statSync(fullPath);
          if (stats.size > 1000000) {
            console.log(`Skipped (too large): ${relativePath}`);
            continue;
          }

          const content = fs.readFileSync(fullPath, 'utf8');
          outStream.write("\n" + "=".repeat(80) + "\n");
          outStream.write(`LOCATION: ${relativePath}\n`);
          outStream.write("=".repeat(80) + "\n\n");
          outStream.write(content);
          outStream.write("\n\n");
          console.log(`Added: ${relativePath}`);
          fileCount++;
        } catch (err) {
          console.error(`Could not read ${relativePath}: ${err.message}`);
        }
      }
    }
  }

  walk(rootDir);

  outStream.write("\n" + "=".repeat(80) + "\n");
  outStream.write(`TOTAL FILES CONSOLIDATED: ${fileCount}\n`);
  outStream.write("=".repeat(80) + "\n");
  outStream.end();

  outStream.on('finish', () => {
    console.log(`\nDone! All source code consolidated into ${outputFile}`);
    const stats = fs.statSync(outputFile);
    console.log(`Output file size: ${(stats.size / 1024).toFixed(2)} KB`);
  });
}

const projectRoot = __dirname;
const outputFilename = "full_project_code.txt";
console.log(`Starting consolidation in {projectRoot}...`);
consolidateCode(projectRoot, outputFilename);
