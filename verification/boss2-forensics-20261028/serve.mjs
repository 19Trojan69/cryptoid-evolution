// Optional local physical-device lab. Synthetic account, no production API.
// Do not expose this loopback-only server publicly or use real credentials.
import { createLabServer } from './labServer.mjs';
const lab = await createLabServer({ mode: 'direct', port: 4179, cacheDir: '/tmp/cryptoid-boss-lab-vite',
  note: (kind, details) => console.log(JSON.stringify({ kind, ...details })) });
console.log('ISOLATED LAB: ' + lab.origin + '/game');
console.log('Resume opens Boss 2. The reactor is opened by a disclosed test hook. No real Pi authentication or native-cause proof.');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await lab.server.close(); process.exit(); });
