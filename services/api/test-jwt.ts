import * as jwt from 'jsonwebtoken';

const token = jwt.sign(
  { sub: 'test-admin', email: 'admin@aec.ac.in', role: 'ADMIN' },
  'attendance-secret-key-2026',
  { expiresIn: '1h' }
);
console.log(token);
