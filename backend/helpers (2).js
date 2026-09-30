const express = require('express');
const authRoutes = require('./authRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const predioRoutes = require('./predioRoutes');
const ambienteRoutes = require('./ambienteRoutes');
const inspecaoRoutes = require('./inspecaoRoutes');
const anomaliaRoutes = require('./anomaliaRoutes');
const manutencaoRoutes = require('./manutencaoRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const relatorioRoutes = require('./relatorioRoutes');
const notificacaoRoutes = require('./notificacaoRoutes');
const configuracaoRoutes = require('./configuracaoRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/predios', predioRoutes);
router.use('/ambientes', ambienteRoutes);
router.use('/inspecoes', inspecaoRoutes);
router.use('/anomalias', anomaliaRoutes);
router.use('/manutencoes', manutencaoRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/relatorios', relatorioRoutes);
router.use('/notificacoes', notificacaoRoutes);
router.use('/configuracoes', configuracaoRoutes);

module.exports = router;
