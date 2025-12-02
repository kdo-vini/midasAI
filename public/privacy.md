# Política de Privacidade - Midas AI

**Última atualização:** 02 de Dezembro de 2025

A sua privacidade é fundamental para nós. Esta Política de Privacidade descreve como o **Midas AI** ("nós", "nosso" ou "aplicativo") coleta, usa, armazena e protege as informações pessoais e financeiras que você ("usuário") nos fornece.

Ao utilizar o Midas AI, você concorda com a coleta e uso de informações de acordo com esta política.

## 1. Dados que Coletamos

Para fornecer nossos serviços de gestão financeira inteligente, coletamos os seguintes tipos de dados:

### 1.1. Dados Pessoais
- **Informações de Conta:** Endereço de e-mail e ID de usuário (fornecidos via autenticação).

### 1.2. Dados Financeiros
- **Transações:** Descrições, valores, datas, categorias e tipos (receita/despesa) das transações que você insere.
- **Metas e Orçamentos:** Definições de orçamento por categoria.
- **Entradas de Texto/Voz:** O texto natural ou transcrição de voz que você envia para processamento pela IA.

## 2. Como Usamos Seus Dados

Utilizamos seus dados exclusivamente para:
- **Processamento:** Categorizar e organizar suas transações automaticamente.
- **Análise:** Gerar insights financeiros personalizados e gráficos de desempenho.
- **Armazenamento:** Manter seu histórico financeiro seguro e acessível em seus dispositivos.
- **Melhoria do Serviço:** Aprimorar a precisão do reconhecimento de transações (de forma anônima e agregada).

**Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.**

## 3. Processamento por Terceiros (Subprocessadores)

Para o funcionamento do aplicativo, utilizamos serviços de terceiros confiáveis:

- **Supabase (Banco de Dados e Autenticação):**
  - Seus dados são armazenados de forma segura nos servidores do Supabase.
  - Utilizamos *Row Level Security (RLS)* para garantir que **apenas você** tenha acesso aos seus dados financeiros. Nem mesmo outros usuários autenticados podem ler seus registros.

- **OpenAI (Inteligência Artificial):**
  - Quando você envia um texto ou comando de voz (ex: "Gastei 50 no almoço"), o conteúdo é enviado para a API da OpenAI para interpretação.
  - A OpenAI processa o texto para extrair os dados da transação.
  - De acordo com a política da OpenAI, os dados enviados via API **não são usados para treinar os modelos deles** por padrão.

## 4. Segurança dos Dados

Levamos a segurança a sério e implementamos medidas robustas:
- **Criptografia:** Dados sensíveis são transmitidos via HTTPS (TLS/SSL).
- **Controle de Acesso:** Implementação rigorosa de RLS (Row Level Security) no banco de dados.
- **Autenticação Segura:** Gerenciamento de sessão seguro via Supabase Auth.

## 5. Seus Direitos (LGPD/GDPR)

Você tem total controle sobre seus dados:
- **Acesso:** Você pode visualizar todos os seus dados diretamente no painel do aplicativo.
- **Correção:** Você pode editar qualquer transação ou categoria incorreta.
- **Exclusão:** Você pode excluir transações individuais ou solicitar a exclusão completa da sua conta e de todos os dados associados através da opção "Deletar Conta" nas configurações.

## 6. Alterações nesta Política

Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações publicando a nova política nesta página.

## 7. Contato

Se tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco:
- **E-mail:** techne.br@gmail.com
- **Telefone/WhatsApp:** (14) 99153-7503
