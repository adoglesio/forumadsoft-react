const path  = require('path');
const fs    = require('fs');
const crypto = require('crypto');

// ── configuração ─────────────────────────────────────────────────────────
const JSON_PATH = path.join(__dirname, 'database.json');
const DB_PATH   = path.join(__dirname, 'backend', 'data', 'forum.db');   // ajuste se necessário
const DRY_RUN   = process.argv.includes('--dry-run');

if (!fs.existsSync(JSON_PATH)) {
  console.error('❌  database.json não encontrado em:', JSON_PATH);
  process.exit(1);
}

const Database = require('better-sqlite3');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// ── utilitários ───────────────────────────────────────────────────────────

/** Retorna true se a senha já está no formato salt:hash */
function jaNestFormat(senha) {
  return typeof senha === 'string' && /^[a-f0-9]{32}:[a-f0-9]{64}$/.test(senha);
}

/** Gera hash idêntico ao hashSenha() do seu database.js */
function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + senha).digest('hex');
  return `${salt}:${hash}`;
}

/** Converte string ISO / timestamp para formato SQLite "YYYY-MM-DD HH:MM:SS" */
function toSQLiteDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

function log(msg) {
  if (DRY_RUN) {
    console.log('[DRY-RUN]', msg);
  } else {
    console.log(msg);
  }
}

// ── leitura do JSON ───────────────────────────────────────────────────────

const raw       = fs.readFileSync(JSON_PATH, 'utf-8');
const database  = JSON.parse(raw);
const usuarios  = database.usuarios  || [];
const erros     = database.erros     || [];

console.log(`\n📦 database.json carregado`);
console.log(`   ${usuarios.length} usuários | ${erros.length} erros | ${erros.reduce((n, e) => n + (e.comentarios?.length || 0), 0)} comentários\n`);

// ── statements preparados 

const stmtInsertUsuario = db.prepare(`
  INSERT OR IGNORE INTO usuarios
    (id, email, nome, bio, senha, avatar, isAdmin, criado_em)
  VALUES
    (@id, @email, @nome, @bio, @senha, @avatar, @isAdmin, @criado_em)
`);

const stmtInsertErro = db.prepare(`
  INSERT OR IGNORE INTO erros
    (id, titulo, descricao, solucao, imagem, criador_email, criador_nome, created_at)
  VALUES
    (@id, @titulo, @descricao, @solucao, @imagem, @criador_email, @criador_nome, @created_at)
`);

const stmtInsertComentario = db.prepare(`
  INSERT OR IGNORE INTO comentarios
    (id, erro_id, usuario, usuario_email, conteudo, data)
  VALUES
    (@id, @erro_id, @usuario, @usuario_email, @conteudo, @data)
`);

// ── migração 

const migrar = db.transaction(() => {

  // ── 1. Usuários 
  console.log('👤  Inserindo usuários...');
  let usersOk = 0, usersSkip = 0;

  for (const u of usuarios) {
    const senha = jaNestFormat(u.senha)
      ? u.senha                // já está hasheada (Guilherme, Gustavo)
      : hashSenha(u.senha);    // texto plano → gera hash agora

    const row = {
      id:        Number(u.id),
      email:     u.email?.trim(),
      nome:      u.nome?.trim(),
      bio:       u.bio  ?? '',
      senha,
      avatar:    u.avatar  ?? null,
      isAdmin:   u.isAdmin ? 1 : 0,
      criado_em: toSQLiteDate(u.criado_em),
    };

    if (DRY_RUN) {
      log(`  usuario #${row.id} ${row.email}`);
      usersOk++;
      continue;
    }

    const result = stmtInsertUsuario.run(row);
    result.changes > 0 ? usersOk++ : usersSkip++;
  }

  console.log(`   ✅ ${usersOk} inseridos  |  ⏭️  ${usersSkip} já existiam\n`);

  // ── 2. Erros 
  console.log('🔴  Inserindo erros...');
  let errosOk = 0, errosSkip = 0;

  for (const e of erros) {
    const row = {
      id:            Number(e.id),
      titulo:        e.titulo?.trim(),
      descricao:     e.descricao ?? '',
      solucao:       e.solucao  ?? '',
      imagem:        e.imagem   ?? null,
      criador_email: e.criador_email?.trim(),
      criador_nome:  e.criador_nome?.trim(),
      created_at:    toSQLiteDate(e.created_at),
    };

    if (DRY_RUN) {
      log(`  erro #${row.id} "${row.titulo?.slice(0, 60)}"`);
      errosOk++;
      continue;
    }

    const result = stmtInsertErro.run(row);
    result.changes > 0 ? errosOk++ : errosSkip++;
  }

  console.log(`   ✅ ${errosOk} inseridos  |  ⏭️  ${errosSkip} já existiam\n`);

  // ── 3. Comentários 
  console.log('💬  Inserindo comentários...');
  let comsOk = 0, comsSkip = 0, comsErro = 0;

  for (const e of erros) {
    for (const c of (e.comentarios || [])) {
      const row = {
        id:            Number(c.id),
        erro_id:       Number(e.id),
        usuario:       c.usuario?.trim(),
        usuario_email: c.usuario_email?.trim(),
        conteudo:      c.conteudo,
        data:          toSQLiteDate(c.data),
      };

      if (DRY_RUN) {
        log(`  comentario #${row.id} no erro #${row.erro_id} por ${row.usuario}`);
        comsOk++;
        continue;
      }

      try {
        const result = stmtInsertComentario.run(row);
        result.changes > 0 ? comsOk++ : comsSkip++;
      } catch (err) {
        console.warn(`   ⚠️  Comentário #${row.id} ignorado: ${err.message}`);
        comsErro++;
      }
    }
  }

  console.log(`   ✅ ${comsOk} inseridos  |  ⏭️  ${comsSkip} já existiam  |  ❌ ${comsErro} erros\n`);
});

// ── executar 

if (DRY_RUN) {
  console.log('⚠️   MODO DRY-RUN — nenhuma alteração será feita no banco\n');
  migrar(); // transação ainda roda mas nenhum statement executa de verdade
  console.log('\n✔️   Dry-run concluído. Rode sem --dry-run para aplicar.\n');
} else {
  try {
    migrar();
    console.log('🎉  Migração concluída com sucesso!\n');

    // relatório final
    const counts = {
      usuarios:    db.prepare('SELECT COUNT(*) as n FROM usuarios').get().n,
      erros:       db.prepare('SELECT COUNT(*) as n FROM erros').get().n,
      comentarios: db.prepare('SELECT COUNT(*) as n FROM comentarios').get().n,
    };
    console.log('📊  Estado atual do banco:');
    console.log(`    👤 Usuários:    ${counts.usuarios}`);
    console.log(`    🔴 Erros:       ${counts.erros}`);
    console.log(`    💬 Comentários: ${counts.comentarios}\n`);
  } catch (err) {
    console.error('❌  Erro durante a migração:', err.message);
    process.exit(1);
  }
}