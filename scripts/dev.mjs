import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const agent = spawn(process.execPath, ['agent/server.mjs'], { cwd: root, stdio: 'inherit' });
const web = spawn(
  process.execPath,
  ['node_modules/@angular/cli/bin/ng.js', 'serve', '--port', '4317', '--host', '127.0.0.1'],
  { cwd: root, stdio: 'inherit' },
);

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  agent.kill('SIGTERM');
  web.kill('SIGTERM');
  setTimeout(() => process.exit(code), 200);
}

agent.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`AG-UI agent exited (${code ?? 'signal'}).`);
    shutdown(code ?? 1);
  }
});
web.on('exit', (code) => {
  if (!shuttingDown) shutdown(code ?? 0);
});
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
