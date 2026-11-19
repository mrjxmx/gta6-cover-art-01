// Rebuilds the dossier from a clean copy of app/ and screenshots/ and compares
// it byte for byte with the dossier main.ts wrote into an output directory.
// Usage: node verify-dossier.ts <output-dir>
import { cpSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.argv[2];
if (!outDir) throw new Error('usage: node verify-dossier.ts <output-dir>');

const fresh = mkdtempSync(join(tmpdir(), 'neon-panels-verify-'));
cpSync(join(here, 'app'), join(fresh, 'app'), { recursive: true });
cpSync(join(here, 'screenshots'), join(fresh, 'screenshots'), { recursive: true });

const rebuilt = buildDossier(fresh, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
const handedIn = readFileSync(join(outDir, 'dossier.json'));
console.log('rebuilt bytes:', rebuilt.length, '| handed-in bytes:', handedIn.length);
console.log(Buffer.from(rebuilt).equals(handedIn) ? 'DOSSIER MATCHES byte for byte' : 'DOSSIER DIFFERS');
