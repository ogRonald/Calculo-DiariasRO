SICADI - Sistema de Cálculo de Diárias (RO)

O SICADI é um sistema Full-Stack desenvolvido para automatizar, padronizar e auditar o cálculo de diárias de viagem para os servidores do Governo do Estado de Rondônia, garantindo conformidade com a legislação estadual vigente.

Principais Funcionalidades e Atualizações Recentes

Motor de Cálculo Dinâmico: Aplicação exata das regras legais para viagens Estaduais, Nacionais e Internacionais, incluindo redutores específicos (ex: Acompanhante JOER, Cursos de longa duração, Hospedagem inclusa).

Solicitação Flexível (Emissão para Terceiros): O sistema permite que o utilizador autenticado (operador/assistente) preencha o formulário e calcule as diárias para qualquer outro servidor (beneficiário), inserindo o seu Nome, Matrícula e Órgão.

Motor de Aprovações e Controle de Acesso (Novo): Sistema de gestão com perfis distintos (Operador vs. Gestor) utilizando Controle de Acesso Baseado em Perfis (RBAC). Gestores possuem uma "Caixa de Entrada" exclusiva onde podem aprovar processos pendentes ou devolvê-los para correção mediante justificação obrigatória.

Persistência de Histórico de Consultas: Todos os cálculos simulados podem ser guardados. A base de dados regista tanto a identidade de quem operou o sistema quanto os dados do viajante, facilitando a auditoria e rastreabilidade da aprovação.

Geração de Relatório Oficial (PDF): Integração direta com motor de PDF para exportar o demonstrativo de cálculo num formato oficial e padronizado, pronto a ser descarregado e anexado aos processos no SEI.

Segurança e Autenticação (Novo): Sistema robusto de login com hash de palavras-passe, protegido por JWT (JSON Web Tokens) e bloqueio de rotas não autorizadas.

Tecnologias Utilizadas

O projeto foi construído com uma arquitetura moderna e contentorizada:

Frontend

Next.js (React)

TypeScript

Tailwind CSS (Estilização responsiva)

Backend

.NET 10.0 / C# (Web API)

Entity Framework Core (ORM via Fluent API)

Autenticação via JWT Bearer

QuestPDF (Geração de documentos PDF)

Swashbuckle / Swagger (Documentação e Testes OAS 3.0)

Infraestrutura e Base de Dados

PostgreSQL 15 (Base de dados relacional)

Docker & Docker Compose (Orquestração de contentores)

Como Executar o Projeto (Ambiente Local)

Graças à contentorização com Docker, todo o ambiente (Base de dados, API C# e Interface Next.js) pode ser levantado com um único comando, sem a necessidade de instalar as linguagens localmente.

Pré-requisitos

Docker Desktop instalado e a correr.

Passos para iniciar

Clone o repositório para a sua máquina local.

Abra o terminal na pasta raiz do projeto (onde se encontra o ficheiro docker-compose.yml).

Execute o seguinte comando para construir e levantar todos os serviços:

docker compose up -d --build


Aceda ao sistema através do navegador:

Frontend (Aplicação): http://localhost:3000

Backend (Swagger API Docs): http://localhost:5211/swagger (porta configurada no ambiente)

(Nota: Na primeira execução, o Entity Framework Core irá detetar a ausência das tabelas e criará a estrutura completa da base de dados PostgreSQL de forma automática).

Estrutura da Base de Dados (Atualizada)

A tabela de Historicos foi expandida para suportar a separação entre papéis e o novo Workflow de Aprovação:

Dados do Operador/Viajante: UsuarioId (Operador logado), NomeBeneficiario, MatriculaBeneficiario, OrgaoBeneficiario.

Dados da Viagem: Destino, TotalDias, ValorTotalBrl, DataHoraInicio, DataHoraFim.

Workflow (Novos Campos): Status (Pendente, Aprovado, Devolvido), GestorAprovadorId (Quem aprovou/rejeitou), DataAprovacao, e MotivoDevolucao (Justificação em caso de devolução).

Endpoints Principais da API

Autenticação e Cálculos

POST /api/v1/auth/login - Autenticação do utilizador (Gera o Token JWT).

POST /api/v1/diarias/simular - Motor de regras para cálculo do valor das diárias.

POST /api/v1/historico - Guarda o demonstrativo associando operador e beneficiário.

GET /api/v1/relatorio/{id} - Devolve o ficheiro binário (application/pdf) do demonstrativo oficial.

Gestão e Aprovações (Exige Token JWT de 'Gestor')

GET /api/v1/Gestao/pendentes - Retorna a lista de diárias aguardando aprovação.

PUT /api/v1/Gestao/{id}/aprovar - Muda o status da diária para Aprovado e regista o Gestor.

PUT /api/v1/Gestao/{id}/devolver - Rejeita a diária exigindo um motivo de correção.