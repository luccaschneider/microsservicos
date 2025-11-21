import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import certificadoRoutes from './routes/certificado.routes';
import { loggingMiddleware } from './middleware/logging';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

// Configurar CORS para permitir requisições do frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Middleware de logging (deve vir antes das rotas)
app.use(loggingMiddleware);

// Health check - endpoint público para verificação de status
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'certificado-service',
    timestamp: new Date().toISOString()
  });
});

// Preflight para health check
app.options('/health', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}), (req, res) => {
  res.status(200).end();
});

// Rotas
app.use('/certificados', certificadoRoutes);

app.listen(PORT, () => {
  console.log(`Certificado Service rodando na porta ${PORT}`);
});


