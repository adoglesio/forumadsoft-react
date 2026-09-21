// Ponto de entrada da Vercel Serverless Function.
// A Vercel trata qualquer arquivo dentro de /api como uma função — aqui só
// reexportamos o app Express, que já sabe rotear /api/usuarios, /api/erros etc.
module.exports = require('../src/server');
