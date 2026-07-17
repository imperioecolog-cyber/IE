# Guia de Operações SQL do Netlify Postgres

Este documento reúne todas as operações e comandos nativos para interagir com o banco de dados do Netlify Postgres usando a sintaxe nativa (`@netlify/database`).

Mesmo que o projeto utilize primariamente o **Drizzle ORM** para as operações de banco, a biblioteca nativa do Netlify oferece flexibilidade total para executar SQL bruto de forma segura e avançada quando necessário.

---

## 1. Conexão Básica e Inicialização
Para usar o cliente nativo:
```typescript
import { getDatabase } from "@netlify/database";

const db = getDatabase();
```
*(Se estiver usando o driver `pg` padrão, utilize `getConnectionString()`)*

---

## 2. Operações de CRUD Seguras
O Netlify trata a injeção de SQL de forma automática quando você utiliza a tag `db.sql`.

```typescript
// Select com condicional (WHERE)
const activeUsers = await db.sql`SELECT * FROM users WHERE active = ${true}`;

// Insert simples
await db.sql`INSERT INTO users (name, email) VALUES (${"Ada"}, ${"ada@example.com"})`;

// Update
await db.sql`UPDATE users SET name = ${"Ada Lovelace"} WHERE id = ${1}`;

// Delete
await db.sql`DELETE FROM users WHERE id = ${1}`;
```

---

## 3. Tipagem com TypeScript
Você pode tipar o retorno das consultas nativas passando o tipo genérico para a função `sql`:
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const users = await db.sql<User>`SELECT * FROM users`;
```

---

## 4. Inserção em Massa (Bulk Inserts)
Para cadastrar múltiplas linhas de uma só vez, utilize o `db.sql.values`:
```typescript
const data = db.sql.values([
  ["Ada", "ada@example.com"],
  ["Bob", "bob@example.com"],
]);
await db.sql`INSERT INTO users (name, email) VALUES ${data}`;
```

---

## 5. Streaming e Chunking (Lotes)
Essencial para ler grandes volumes de dados sem estourar o limite de memória da Netlify Function:

**Linha por linha (Stream):**
```typescript
for await (const row of db.sql`SELECT * FROM users`.stream()) {
  console.log(row);
}
```

**Por lotes (Chunks):**
```typescript
for await (const chunk of db.sql`SELECT * FROM users`.chunked(100)) {
  console.log(`Processing ${chunk.length} rows`);
}
```

---

## 6. Recursos Avançados do SQL

### db.sql.identifier
Injeta nomes de tabelas ou colunas de forma dinâmica, evitando falhas de injeção de SQL.
```typescript
const table = db.sql.identifier({ table: "users" });
const rows = await db.sql`SELECT * FROM ${table}`;
```

### db.sql.raw
Usado para injetar palavras-chave do SQL nativo de forma direta (como ASC, DESC, etc).
```typescript
const order = db.sql.raw("DESC");
const users = await db.sql`SELECT * FROM users ORDER BY name ${order}`;
```

### db.sql.default
Injeta o valor padrão (`DEFAULT`) definido pelo esquema do banco de dados na hora da inserção.
```typescript
await db.sql`INSERT INTO users (name, created_at) VALUES (${"Ada"}, ${db.sql.default})`;
```
