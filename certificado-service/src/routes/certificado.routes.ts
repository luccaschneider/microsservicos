import { Router } from 'express';
import { CertificadoController } from '../controllers/certificado.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const controller = new CertificadoController();

// Público
router.get('/validar/:codigo', controller.validarCertificado.bind(controller));

// Protegido - rotas específicas devem vir ANTES de rotas com parâmetros dinâmicos
router.get('/me', authMiddleware, controller.buscarMeusCertificados.bind(controller));
router.get('/usuario/:usuarioId', authMiddleware, controller.buscarPorUsuario.bind(controller));
router.post('/', authMiddleware, controller.emitirMeuCertificado.bind(controller));
router.post('/terceiro', authMiddleware, controller.emitirCertificadoTerceiro.bind(controller));
// Rota com parâmetro dinâmico deve vir por último
router.get('/:id', authMiddleware, controller.buscarPorId.bind(controller));

export default router;


