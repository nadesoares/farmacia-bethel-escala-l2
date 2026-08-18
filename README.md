# 🏥 Farmácia Bethel - Sistema de Escala de Horários

Sistema moderno para gestão e geração automatizada de escalas mensais de funcionários da Farmácia Bethel, com suporte a regras de turnos (1º, 2º e 3º turnos), folgas de sexta-feira (Sexta Verde), plantões de fim de semana e sincronização na nuvem via Supabase.

---

## ⚡ 1. Criar Banco de Dados no Supabase (Gratuito)

Para habilitar a sincronização em nuvem e permitir que múltiplos usuários acessem a mesma escala:

1. Cadastre-se em [supabase.com](https://supabase.com) e crie um novo projeto.
2. Vá no menu **SQL Editor** do Supabase, crie uma **New Query**, cole o script abaixo e clique em **Run**:

```sql
-- TABELA DE FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Balconista',
    pref_shift TEXT DEFAULT 'NONE',
    color TEXT DEFAULT '#0284c7',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA DE ESCALAS MENSAIS
CREATE TABLE IF NOT EXISTS public.schedules (
    year_month TEXT PRIMARY KEY,
    schedule_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LIBERAR ACESSO LEITURA E ESCRITA ANÔNIMA (Row Level Security)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total Funcionarios" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Escalas" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
```

3. Em **Project Settings > API**, copie:
   - **Project URL** (ex: `https://xyzxyz.supabase.co`)
   - **anon key (public)** (ex: `eyJhYmdj...`)

4. No sistema, clique no botão **☁️ Nuvem** no topo da página e cole estas duas chaves.

---

## 🚀 2. Como Subir no GitHub

1. Acesse [github.com/new](https://github.com/new) e crie um novo repositório chamado `farmacia-bethel-escala`.
2. No seu computador (ou via upload direto no site do GitHub):
   - Abra a pasta do projeto e faça upload de todos os arquivos (`index.html`, pasta `js/`, `css/`, `vercel.json`, `README.md`, etc.).

---

## 🌐 3. Publicar e Gerar Link no Vercel (Gratuito)

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **"Add New..." > "Project"**.
3. Selecione o repositório **farmacia-bethel-escala**.
4. Clique em **Deploy**.
5. Em poucos segundos, seu link público estará no ar (ex: `https://farmacia-bethel-escala.vercel.app`).

---

## ⚙️ Funcionalidades Principais
- 📅 **Calendário Dinâmico**: Visualização completa do mês com turnos e funcionários.
- 🎨 **Cores de Turno/Fim de Semana**: Destaque automático para folgas e plantões.
- 🖨️ **Exportação Profissional**: Baixar em PDF, Imagem PNG ou Imprimir em formato A4.
- 🔐 **Modo Administrador**: PIN de segurança para alterar horários ou cadastros.
