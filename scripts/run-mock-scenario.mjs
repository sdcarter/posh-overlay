import { spawn } from 'node:child_process';

const scenario = process.argv[2] ?? 'default';
const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  throw new Error('npm_execpath is not available. Run this script through npm.');
}

const child = spawn(process.execPath, [npmExecPath, 'run', 'start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    POSHDASH_USE_MOCK: 'true',
    POSHDASH_MOCK_SCENARIO: scenario,
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
