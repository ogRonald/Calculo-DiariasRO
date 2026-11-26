Markdown
# SICADI - Sistema de Cálculo de Diárias (RO)

O **SICADI** é uma plataforma Full-Stack desenvolvida para automatizar, padronizar e auditar o cálculo, o fluxo de aprovação e a gestão de usuários de diárias de viagem para os servidores do Governo do Estado de Rondônia, garantindo conformidade com a legislação estadual vigente.

---

## Principais Funcionalidades

* **Motor de Cálculo Dinâmico:** Aplicação exata das regras legais para viagens Estaduais, Nacionais e Internacionais, incluindo cálculo proporcional de meias-diárias e redutores específicos (ex.: Acompanhante JOER, Cursos de longa duração, Hospedagem inclusa).
* **Solicitação Flexível (Emissão para Terceiros):** Permite que o servidor autenticado preencha o formulário e simule diárias para si mesmo ou para qualquer outro beneficiário, registrando separadamente quem operou o sistema e os dados do viajante (Nome, Matrícula e Órgão).
* **Controle de Acesso Baseado em Perfis (RBAC — 3 Níveis):**
  * **Operador:** Realiza simulações, gera demonstrativos, consulta seu histórico de solicitações e gerencia seu próprio perfil cadastral.
  * **Gestor:** Possui todas as atribuições do Operador mais acesso exclusivo à **Área do Gestor**, onde visualiza todas as solicitações, filtra pendências e realiza despachos de **Aprovação**, **Devolução para Correção** ou **Rejeição** mediante justificativa obrigatória.
  * **Administrador (`Admin`):** Possui acesso irrestrito ao sistema, incluindo o painel **Administração → Usuários e Permissões** para cadastrar novos servidores, promover/alterar perfis (`Operador`, `Gestor`, `Admin`) e forçar a redefinição de senhas.
* **Workflow Completo de Pendências e Aprovações:**
  * **Pendente (`0`):** Status inicial de toda simulação enviada para análise.
  * **Aprovado (`1`):** Validado pelo Gestor, registrando o ID da autoridade avaliadora e a data/hora do despacho.
  * **Devolvido (`2`):** Retornado ao solicitante com parecer técnico/motivo obrigatório para ajuste.
  * **Rejeitado (`3`):** Indeferido definitivamente com justificativa registrada.
* **Persistência de Histórico e Rastreabilidade:** Todos os cálculos salvos ficam armazenados no PostgreSQL com vínculo entre operador, beneficiário, memória de cálculo e parecer da gestão.
* **Geração de Relatório Oficial (PDF):** Exportação direta em PDF padronizado contendo identificação do beneficiário, origem da solicitação, tabela financeira, parecer da gestão e campo de assinatura para anexação ao SEI.
* **Segurança e Ciclo de Vida de Credenciais:**
  * Autenticação via **JWT (JSON Web Tokens)** e senhas protegidas com `PasswordHasher` (ASP.NET Core Identity).
  * **Reset Forçado de Senha:** O Administrador pode cadastrar usuários ou resetar credenciais para a senha temporária padrão (`SICADI@2026`). No próximo login, o usuário é bloqueado e redirecionado automaticamente para `/trocar-senha` até definir uma nova senha pessoal.

---

## Tecnologias Utilizadas

### Frontend
* **Next.js** (App Router / React)
* **TypeScript**
* **Tailwind CSS** (Interface responsiva com controle dinâmico de rotas e menus por perfil)

### Backend
* **.NET 10.0 / C#** (ASP.NET Core Web API)
* **Entity Framework Core** (ORM com auto-migração e inicialização automática de schema/seed)
* **Autenticação JWT Bearer & RBAC** (`[Authorize(Roles = "...")]`)
* **QuestPDF** (Motor de geração de relatórios oficiais em PDF)
* **Swashbuckle / Swagger** (Documentação interativa OAS 3.0)

### Infraestrutura e Banco de Dados
* **PostgreSQL 15** (`postgres:15-alpine`)
* **Docker & Docker Compose** (Orquestração completa da stack)

---

## Estrutura do Projeto

```text
SICADI/
├── docker-compose.yml              # Orquestração dos serviços (db, api, frontend)
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── DiariasRO.Domain/       # Entidades de domínio e regras puras de cálculo
│       └── DiariasRO.api/
│           ├── Controllers/        # Auth, Diarias, Historico, Gestao, Perfil, Relatorio, Admin
│           ├── Data/               # DiariasDbContext (EF Core)
│           ├── Dtos/               # Contratos de entrada e saída da API
│           ├── Models/             # Usuario, NivelAcesso, HistoricoCalculo, StatusDiaria
│           ├── Services/           # TokenService (JWT) e serviços auxiliares
│           └── Program.cs          # Configuração de pipeline, CORS, JWT e DatabaseInitializer
└── frontend/
    ├── Dockerfile
    ├── app/
    │   ├── page.tsx                # Nova Simulação de Diárias
    │   ├── demonstrativo/          # Visualização detalhada e download do PDF
    │   ├── historico/              # Histórico de cálculos e status de aprovação
    │   ├── gestao/                 # Caixa de entrada e despacho do Gestor
    │   ├── admin/usuarios/         # Painel de gestão de usuários, permissões e reset de senha
    │   ├── perfil/                 # Cadastro e edição de dados funcionais do servidor
    │   ├── login/                  # Autenticação institucional
    │   └── trocar-senha/           # Fluxo obrigatório após reset de senha
    ├── components/                 # Sidebar dinâmica (RBAC) e ClientProvider
    ├── contexts/                   # DiariasContext (Estado global de sessão e cálculos)
    ├── public/                     # Assets visuais (SICADI-03.png, background_login.jpg)
    └── services/api.ts             # Cliente HTTP centralizado com injeção automática de Bearer Token
Como Executar o Projeto (Ambiente Local)
Com o Docker, todo o ambiente (PostgreSQL, API .NET e Frontend Next.js) é inicializado com um único comando.

Pré-requisitos
Docker Desktop instalado e em execução.

Passos para iniciar
Clone o repositório e abra o terminal na pasta raiz (onde está o docker-compose.yml).

Construa e suba os contêineres:

Bash
docker compose up -d --build
Acesse os serviços no navegador:

Frontend (Aplicação): http://localhost:3000

Backend (Swagger API): http://localhost:5211/swagger

PostgreSQL (Porta externa): localhost:5433 (mapeada para 5432 interna do contêiner para evitar conflito com instalações locais)

Inicialização Automática: Na primeira subida, o DatabaseInitializer cria automaticamente toda a estrutura de tabelas e colunas no PostgreSQL e popula o sistema com contas padrão para teste.

Credenciais Padrão (Ambiente de Desenvolvimento)
Todas as contas iniciais criadas pelo Seed utilizam a senha 123456:

Matrícula	Senha	Órgão / Instituição	Perfil (NivelAcesso)
0000001	123456	IPERON	Admin
0000002	123456	Governadoria do Estado	Gestor
0000003	123456	SEFIN	Gestor
0000004	123456	IPERON	Operador
0000005	123456	SESAU	Operador
0000006	123456	SEDUC	Operador
Estrutura da Base de Dados
Tabela Usuarios
Identificação: Id (uuid), Matricula, NomeCompleto, Orgao, Funcao, Email, Celular.

Segurança e RBAC: SenhaHash, NivelAcesso (0 = Operador, 1 = Gestor, 2 = Admin), DeveTrocarSenha (boolean).

Tabela Historicos
Rastreabilidade: Id (uuid), UsuarioId (Solicitante/Operador), NomeBeneficiario, MatriculaBeneficiario, OrgaoBeneficiario, CriadoEm.

Dados da Viagem e Cálculo: Destino, DataHoraInicio, DataHoraFim, TotalDias, ValorUnitarioBrl, ValorTotalBrl.

Workflow de Aprovação: Status (0 = Pendente, 1 = Aprovado, 2 = Devolvido, 3 = Rejeitado), GestorAprovadorId, DataAprovacao, MotivoDevolucao.

Endpoints Principais da API
Autenticação e Perfil
POST /api/v1/auth/login — Autentica o servidor e retorna o Token JWT e os dados de perfil.

POST /api/v1/auth/trocar-senha-obrigatoria — Atualiza a senha pessoal após redefinição administrativa (DeveTrocarSenha).

GET /api/v1/perfil/{id} — Consulta os dados cadastrais do servidor.

PUT /api/v1/perfil/{id} — Atualiza os dados funcionais mediante confirmação da senha atual.

Cálculos, Histórico e Relatórios
POST /api/v1/Diarias/calcular-previa — Executa o motor de regras para simulação do valor das diárias.

POST /api/v1/historico — Salva a simulação no histórico com status inicial Pendente.

GET /api/v1/historico/{usuarioId} — Lista o histórico de solicitações vinculadas ao usuário.

GET /api/v1/relatorio/{id} — Gera e retorna o arquivo binário (application/pdf) do demonstrativo oficial.

Gestão e Aprovações (Roles = "Gestor,Admin")
GET /api/v1/Gestao/todas — Lista todas as solicitações do sistema (Pendentes, Aprovadas, Devolvidas e Rejeitadas).

GET /api/v1/Gestao/pendentes — Filtra apenas as solicitações aguardando análise.

GET /api/v1/Gestao/{id} — Retorna os detalhes completos de uma solicitação específica.

PUT /api/v1/Gestao/{id}/aprovar — Aprova a solicitação e registra o Gestor e a data do despacho.

PUT /api/v1/Gestao/{id}/devolver — Devolve a solicitação exigindo justificativa para correção.

PUT /api/v1/Gestao/{id}/rejeitar — Recusa a solicitação registrando o parecer do Gestor.

Administração de Usuários (Roles = "Admin")
GET /api/v1/admin/usuarios — Lista todos os servidores cadastrados e seus respectivos níveis de acesso.

POST /api/v1/admin/usuarios — Cadastra um novo servidor com senha temporária padrão (SICADI@2026).

PUT /api/v1/admin/usuarios/{id}/nivel-acesso — Altera o perfil de acesso (Operador, Gestor ou Admin).

PUT /api/v1/admin/usuarios/{id}/resetar-senha — Redefine a senha do servidor para SICADI@2026 e ativa a troca obrigatória no próximo login.