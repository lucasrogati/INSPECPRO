# InspecPro — Sistema de Gestão de Inspeções, Anomalias e Manutenção Predial

Sistema web para registrar inspeções prediais e acompanhar cada problema desde a
identificação até a resolução:

```
Inspeção → Anomalia → Prioridade → Responsável → Prazo → Manutenção → Verificação → Resolvido
```

## Status: FASE 1 e FASE 2 concluídas

**Fase 1** — Estrutura do projeto, banco de dados (schema completo) e autenticação JWT.
- ✅ Estrutura `frontend/` + `backend/` separados
- ✅ Schema MySQL completo (todas as tabelas, com FKs e índices)
- ✅ Autenticação JWT (login + validação de sessão)
- ✅ Layout base (Sidebar, rotas protegidas) fiel ao protótipo Figma

**Fase 2** — CRUD de usuários, prédios e ambientes.
- ✅ CRUD de usuários (restrito a administradores; inativação em vez de exclusão)
- ✅ CRUD de prédios (com estatísticas agregadas: ambientes, inspeções, pendências)
- ✅ CRUD de ambientes com hierarquia Prédio → Bloco → Andar → Ambiente
- ✅ Tela de Prédios (cards com resumo) e tela de Detalhes do Prédio (gestão de ambientes)
- ✅ Tela de Usuários (cards por perfil + tabela de gestão)
- ⏳ Inspeções, anomalias, manutenções e dashboard: fases seguintes

## Stack
- **Frontend:** React 18 + Vite, Tailwind CSS v4, React Router, Axios, lucide-react
- **Backend:** Node.js + Express, MySQL (mysql2), JWT, bcryptjs
- **Banco:** MySQL 8+

---

## Como rodar

### 1. Banco de dados
```bash
mysql -u root -p < backend/src/config/schema.sql
```
Isso cria o banco `inspecpro` e todas as tabelas.

### 2. Backend
```bash
cd backend
cp .env.example .env
# edite .env com as credenciais do seu MySQL
npm install
npm run seed   # cria o usuário administrador inicial
npm run dev    # inicia em http://localhost:4000
```

Usuário criado pelo seed:
- **E-mail:** carlos.oliveira@inspecpro.com.br
- **Senha:** Admin@123

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev    # inicia em http://localhost:5173
```

Acesse `http://localhost:5173`, faça login com as credenciais do seed e você
será redirecionado ao dashboard.

---

## Estrutura de pastas

```
backend/
  src/
    config/       # conexão MySQL + schema.sql
    db/           # scripts de seed
    middleware/   # autenticação (JWT) e tratamento de erros
    controllers/   # lógica de negócio das rotas
    routes/       # definição dos endpoints REST
    utils/        # helpers (geração de token, async handler)
    app.js        # configuração do Express
    server.js     # ponto de entrada

frontend/
  src/
    components/   # Sidebar, AppLayout, ProtectedRoute
    context/      # AuthContext (sessão do usuário)
    pages/        # telas da aplicação
    services/     # cliente Axios + authService
    App.jsx       # definição de rotas
    main.jsx      # ponto de entrada
    index.css     # design system (cores, componentes utilitários)
```

## Endpoints

### Fase 1 — Autenticação
| Método | Rota              | Descrição                          | Autenticação |
|--------|-------------------|-------------------------------------|--------------|
| POST   | `/api/auth/login` | Autentica e retorna token JWT       | Não          |
| GET    | `/api/auth/me`    | Retorna dados do usuário logado     | Sim (Bearer) |
| GET    | `/api/health`     | Healthcheck da API                  | Não          |

### Fase 2 — Usuários, Prédios e Ambientes
| Método | Rota                  | Descrição                                    | Perfis permitidos |
|--------|-----------------------|-----------------------------------------------|--------------------|
| GET    | `/api/usuarios`       | Lista usuários (filtros: `tipo`, `ativo`, `busca`) | administrador |
| POST   | `/api/usuarios`       | Cria usuário                                   | administrador |
| PUT    | `/api/usuarios/:id`   | Atualiza usuário                               | administrador |
| DELETE | `/api/usuarios/:id`   | Inativa usuário (soft delete)                  | administrador |
| GET    | `/api/predios`        | Lista prédios com estatísticas agregadas       | qualquer autenticado |
| GET    | `/api/predios/:id`    | Detalhe do prédio + ambientes                  | qualquer autenticado |
| POST   | `/api/predios`        | Cria prédio                                    | administrador, gestor |
| PUT    | `/api/predios/:id`    | Atualiza prédio                                | administrador, gestor |
| DELETE | `/api/predios/:id`    | Remove prédio                                  | administrador |
| GET    | `/api/ambientes?predio_id=` | Lista ambientes de um prédio             | qualquer autenticado |
| POST   | `/api/ambientes`      | Cria ambiente (Bloco/Andar/Nome)               | administrador, gestor |
| PUT    | `/api/ambientes/:id`  | Atualiza ambiente                              | administrador, gestor |
| DELETE | `/api/ambientes/:id`  | Remove ambiente                                | administrador, gestor |

## Próximas fases
- **Fase 3:** CRUD de inspeções
- **Fase 4:** CRUD de anomalias, prioridades, status e responsáveis
- **Fase 5:** Sistema de manutenção e histórico
- **Fase 6:** Dashboard e estatísticas
