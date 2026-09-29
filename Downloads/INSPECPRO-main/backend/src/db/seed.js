/**
 * Script de seed — cria o usuário administrador inicial.
 * Execução: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const ADMIN = {
  nome: 'Carlos Oliveira',
  email: 'carlos.oliveira@inspecpro.com.br',
  senhaPlana: 'Admin@123',
  tipo: 'administrador',
};

async function seed() {
  try {
    const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [
      ADMIN.email,
    ]);

    if (existentes.length > 0) {
      console.log('[seed] Usuário administrador já existe. Nenhuma ação necessária.');
      process.exit(0);
    }

    const senhaHash = await bcrypt.hash(ADMIN.senhaPlana, 10);

    await pool.query(
      'INSERT INTO usuarios (nome, email, senha, tipo, ativo) VALUES (?, ?, ?, ?, 1)',
      [ADMIN.nome, ADMIN.email, senhaHash, ADMIN.tipo]
    );

    console.log('[seed] Usuário administrador criado com sucesso:');
    console.log(`         e-mail: ${ADMIN.email}`);
    console.log(`         senha : ${ADMIN.senhaPlana}`);
    process.exit(0);
  } catch (err) {
    console.error('[seed] Erro ao criar usuário administrador:', err.message);
    process.exit(1);
  }
}

seed();
