# InspecPro — Sistema de Gestão de Inspeções, Anomalias e Manutenção Predial

Sistema web para registrar inspeções prediais e acompanhar cada problema desde a
identificação até a resolução:

```
Inspeção → Anomalia → Prioridade → Responsável → Prazo → Manutenção → Verificação → Resolvido
```

## Status: FASES 1 a 6 concluídas

**Fase 1** — Estrutura do projeto, schema MySQL completo, autenticação JWT e layout base.

**Fase 2** — CRUD de usuários, prédios e ambientes (Prédio → Bloco → Andar → Ambiente).

**Fase 3** — CRUD de inspeções (listagem com filtros e detalhe).

**Fase 4** — Anomalias.
- ✅ CRUD de anomalias com prioridade, status, responsável e prazo
- ✅ Upload/remoção de fotos (Multer, JPG/PNG/WEBP até 5 MB) servidas em `/uploads`
- ✅ Histórico de todas as mudanças (status, prioridade, responsável, prazo, fotos)
- ✅ Tela global de Anomalias (filtros + busca), detalhe da anomalia e seção de anomalias no detalhe da inspeção

**Fase 5** — Manutenções e verificação.
- ✅ Agendar, iniciar, concluir, editar e excluir manutenções
- ✅ O status da anomalia acompanha as manutenções automaticamente
  (agendada/em andamento → *Em manutenção*; concluída → *Aguardando verificação*)
- ✅ Verificação: aprovar (→ *Resolvido*) ou reprovar com motivo (→ *Pendente*)
- ✅ Perfil `manutencao` inicia/conclui apenas as manutenções sob sua responsabilidade

**Fase 6** — Dashboard e relatórios.
- ✅ Dashboard com KPIs, evolução mensal, prioridade, status, prédios com mais pendências, itens que requerem atenção e próximas manutenções (filtro por prédio)
- ✅ Relatórios de anomalias e manutenções com filtros, exportação CSV (Excel) e impressão/PDF

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
    middleware/   # autenticação (JWT), upload de fotos (Multer) e tratamento de erros
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

### Fase 4 — Anomalias
| Método | Rota | Descrição | Perfis permitidos |
|--------|------|-----------|--------------------|
| GET    | `/api/anomalias` | Lista (filtros: `inspecao_id`, `predio_id`, `ambiente_id`, `status`, `prioridade`, `responsavel_id`, `busca`, `abertas`, `vencidas`) | qualquer autenticado |
| GET    | `/api/anomalias/responsaveis` | Usuários ativos para o campo responsável | qualquer autenticado |
| GET    | `/api/anomalias/:id` | Detalhe + fotos + histórico + manutenções | qualquer autenticado |
| POST   | `/api/anomalias` | Registra anomalia | administrador, gestor, engenheiro |
| PUT    | `/api/anomalias/:id` | Atualiza dados (mudanças vão ao histórico) | administrador, gestor, engenheiro |
| PATCH  | `/api/anomalias/:id/status` | Ajuste manual de status (não aceita `resolvido`) | administrador, gestor, engenheiro |
| POST   | `/api/anomalias/:id/verificar` | Aprova/reprova (`{ aprovada, observacao }`) | administrador, gestor, engenheiro |
| POST   | `/api/anomalias/:id/fotos` | Upload (`multipart`, campo `fotos`, até 6) | administrador, gestor, engenheiro, manutencao |
| DELETE | `/api/anomalias/:id/fotos/:fotoId` | Remove foto | administrador, gestor, engenheiro |
| DELETE | `/api/anomalias/:id` | Remove anomalia (e arquivos de fotos) | administrador, gestor |

### Fase 5 — Manutenções
| Método | Rota | Descrição | Perfis permitidos |
|--------|------|-----------|--------------------|
| GET    | `/api/manutencoes` | Lista (filtros: `anomalia_id`, `predio_id`, `responsavel_id`, `status`, `data_inicio`, `data_fim`, `minhas`) | qualquer autenticado |
| GET    | `/api/manutencoes/:id` | Detalhe | qualquer autenticado |
| POST   | `/api/manutencoes` | Agenda manutenção | administrador, gestor, engenheiro |
| PUT    | `/api/manutencoes/:id` | Atualiza | administrador, gestor, engenheiro |
| PATCH  | `/api/manutencoes/:id/status` | Inicia/conclui | administrador, gestor, engenheiro, manutencao (só as próprias) |
| DELETE | `/api/manutencoes/:id` | Remove | administrador, gestor |

### Fase 6 — Dashboard e relatórios
| Método | Rota | Descrição | Perfis permitidos |
|--------|------|-----------|--------------------|
| GET    | `/api/dashboard` | KPIs e séries (filtro opcional `predio_id`) | qualquer autenticado |
| GET    | `/api/relatorios/anomalias` | Relatório de anomalias (`formato=csv` para exportar) | qualquer autenticado |
| GET    | `/api/relatorios/manutencoes` | Relatório de manutenções (`formato=csv` para exportar) | qualquer autenticado |

### Fluxo de status da anomalia
```
identificado → pendente → em_manutencao → aguardando_verificacao → resolvido
```
- Ao atribuir um responsável, `identificado` passa a `pendente`.
- Manutenções movem a anomalia para `em_manutencao` e, ao concluir, para `aguardando_verificacao`.
- Só a verificação aprovada leva a `resolvido`; uma anomalia resolvida pode ser reaberta.

> As fotos ficam em `backend/uploads/anomalias/` (ignorada pelo Git).
