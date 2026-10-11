const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { sub: 'test-admin', email: 'admin@aec.ac.in', role: 'ADMIN' },
  'attendance-secret-key-2026',
  { expiresIn: '1h' }
);

async function test() {
  const res = await fetch('http://localhost:3001/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(data);
}
test();
