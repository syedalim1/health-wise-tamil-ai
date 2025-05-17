import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { time, token } = req.body;
  const dbPath = path.resolve('notifications.json');

  const list = fs.existsSync(dbPath)
    ? JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    : [];

  list.push({ time, token });
  fs.writeFileSync(dbPath, JSON.stringify(list, null, 2));

  res.json({ message: 'Notification scheduled successfully!' });
}
