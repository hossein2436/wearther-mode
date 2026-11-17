/**
 * Small admin commands, run inside the api container:
 *   docker compose exec api node dist/admin.js users
 *   docker compose exec api node dist/admin.js grant someone@example.com 365   # free subscription days
 *   docker compose exec api node dist/admin.js revoke someone@example.com
 */
import { join } from 'node:path';
import { openDb } from './db';
import { publicUser, type UserRow } from './billing';

const db = openDb(join(process.env.DATA_DIR ?? '/data', 'wearther.db'));
const [cmd, email, days] = process.argv.slice(2);

if (cmd === 'users') {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at').all() as unknown as UserRow[];
  for (const u of rows) console.log(JSON.stringify(publicUser(u)));
  console.log(`${rows.length} users`);
} else if ((cmd === 'grant' || cmd === 'revoke') && email) {
  const until = cmd === 'grant' ? new Date(Date.now() + Number(days || 30) * 86_400_000).toISOString() : null;
  const r = db.prepare('UPDATE users SET subscribed_until = ? WHERE email = ?').run(until, email.toLowerCase());
  console.log(r.changes ? `${email}: ${until ? `subscribed until ${until.slice(0, 10)}` : 'subscription removed'}` : `No user with email ${email}`);
} else {
  console.log('Usage: admin.js users | grant <email> [days] | revoke <email>');
  process.exit(1);
}
