import bcrypt from 'bcryptjs';

async function generate() {
  const pass = 'Dushyant@1234';
  const hash = await bcrypt.hash(pass, 12);
  console.log('Password:', pass);
  console.log('Hash:', hash);
}

generate();
