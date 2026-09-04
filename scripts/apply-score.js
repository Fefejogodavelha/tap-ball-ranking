// scripts/apply-score.js — aplica uma pontuação ao ranking.json
// Regra: manter a MELHOR pontuação por nome. Nova substitui antiga APENAS se nova >= antiga.
// Uso: node scripts/apply-score.js "<nome>" "<pontos>" "<iso-timestamp>"
const fs = require('fs');
const nameRaw = String(process.argv[2] || '');
const score = Number(process.argv[3]);
const ts = process.argv[4] || new Date().toISOString();

// sanear nome: trim, limite 16 chars, sem quebras de linha
const name = nameRaw.trim().slice(0, 16).replace(/[\r\n]/g, ' ');
if (!name) {
  console.error('ERRO: nome vazio');
  process.exit(2);
}
const pts = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;

let list = [];
try { list = JSON.parse(fs.readFileSync('ranking.json', 'utf8')); } catch (_) {}
if (!Array.isArray(list)) list = [];

let key = null;
for (let i = 0; i < list.length; i++) {
  if (list[i] && list[i].nome === name) { key = i; break; }
}
if (key !== null) {
  const old = Number(list[key].pontos) || 0;
  if (pts >= old) {
    list[key].pontos = pts;
    list[key].data = ts;
  }
  // pts < old => mantém a antiga (não sobrescreve)
} else {
  list.push({ nome: name, pontos: pts, data: ts });
}

// ordena: pontos desc, empate => mais recente primeiro
list.sort((a, b) => {
  const ba = Number(b.pontos) || 0;
  const aa = Number(a.pontos) || 0;
  if (ba !== aa) return ba - aa;
  return String(b.data || '').localeCompare(String(a.data || ''));
});

// mantém top 200 (a UI exibe top 10)
list = list.slice(0, 200);
fs.writeFileSync('ranking.json', JSON.stringify(list, null, 2) + '\n');
console.log('salvo', name, pts, '| entradas total:', list.length);