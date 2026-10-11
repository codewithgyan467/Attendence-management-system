import * as bcrypt from 'bcrypt';
async function main() {
  const hash = '$2b$10$Aw/JEPqDsgIfH5F7JtSI1eF8xP4hd5DgXOdv8.8WHpo8ZoT.ey7hO';
  const isMatch = await bcrypt.compare('Faculty@123', hash);
  console.log('Match?', isMatch);
}
main();
