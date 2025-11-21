# Certificado Service

Microserviço de certificados em Node.js/TypeScript.

## Funcionalidades

- Emissão de certificados
- Validação de certificados (público)
- Listagem de certificados por usuário
- Busca de certificado por ID

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente (crie `.env`):
```env
PORT=8081
DB_HOST=localhost
DB_PORT=8371
DB_NAME=eventos_db
DB_USER=eventos_user
DB_PASSWORD=secret
JWT_SECRET=mySecretKeyForJWTTokenGenerationThatShouldBeAtLeast256BitsLong
SERVER_ADDRESS=localhost
```

3. Execute o serviço:
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## Endpoints

### Públicos
- `GET /certificados/validar/:codigo` - Validar certificado pelo código único

### Protegidos (requerem JWT)
- `GET /certificados/:id` - Buscar certificado por ID
- `POST /certificados` - Emitir meu certificado
- `POST /certificados/terceiro` - Emitir certificado para terceiro
- `GET /certificados/me` - Listar meus certificados
- `GET /certificados/usuario/:usuarioId` - Listar certificados de um usuário

## Autenticação

O serviço usa JWT com o mesmo secret do serviço Java. O token deve ser enviado no header:
```
Authorization: Bearer <token>
```





