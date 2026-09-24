const express = require('express');
const authRoutes = require('./authRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const predioRoutes = require('./predioRoutes');
const ambienteRoutes = require('./ambienteRoutes');
const inspecaoRoutes = require('./inspecaoRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/predios', predioRoutes);
router.use('/ambientes', ambienteRoutes);
router.use('/inspecoes', inspecaoRoutes);

// As próximas fases vão registrar aqui:
// router.use('/anomalias', anomaliaRoutes);
// router.use('/manutencoes', manutencaoRoutes);
// router.use('/dashboard', dashboardRoutes);

module.exports = router;
