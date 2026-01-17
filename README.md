
## Cara Menjalankan Backend

### Prerequisites

- Node.js 18+ dan npm

### Setup

1. Install dependencies:

```bash
npm install
```

2. Jalankan dalam mode development dengan auto-reload:

```bash
npm run dev
```

3. Server akan berjalan di `http://localhost:3001`.


## API Endpoints

### Health Check

- `GET /health` - Status endpoint

### Task Management

- `GET /tasks` - Dapatkan semua tasks
- `GET /tasks/:id` - Dapatkan task spesifik
- `POST /tasks` - Buat task baru (body: `{ title: string }`)
- `DELETE /tasks/:id` - Hapus task
- `PUT /tasks/:id/status` - Update status task (body: `{ status: TaskStatus, actor: string }`)

### Audit Log

- `GET /tasks/:id/audit-logs` - Dapatkan audit logs untuk task tertentu


## Penjelasan Singkat Arsitektur

### Layer-based Architecture

Project ini mengikuti prinsip separation of concerns dengan struktur:

```
src/
├── domain/           # Business entities & rules
│   ├── task.ts       # Task entity + status transitions
│   └── auditLog.ts   # AuditLog entity
├── services/         # Business logic layer
│   └── task.service.ts
├── repositories/     # Data persistence layer
│   ├── task.repository.ts
│   └── auditLog.repository.ts
├── routes/           # HTTP request handlers
│   ├── task.routes.ts
│   └── auditLog.routes.ts
├── errors/           # Domain errors
│   └── domainErrors.ts
└── index.ts          # Express app setup
```

### Alur Eksekusi

1. **HTTP Request** → Routes layer
2. **Request Handling** → Validation & parameter extraction
3. **Business Logic** → Service layer
4. **Domain Rules** → Status transition validation, audit log creation
5. **Persistence** → Repository layer (in-memory storage)
6. **HTTP Response** → JSON response

### Fitur Utama

- **Strict Status Transitions**: Task hanya bisa berpindah status secara linear (TODO → PENDING → IN_PROGRESS → DONE)
- **Idempotent Updates**: Update dengan status yang sama tidak menghasilkan perubahan
- **Append-Only Audit Log**: Semua perubahan dicatat dan tidak bisa dimodifikasi
- **Error Handling**: Custom error classes untuk domain-specific errors


## Asumsi yang Diambil

1. **In-Memory Storage**: Data disimpan di memory (bukan database). Cocok untuk testing/demo, tapi akan hilang saat restart.

2. **Single Server Instance**: Tidak ada clustering/replication. Jika ada multiple instances, data tidak akan konsisten antar instance.

3. **No Authentication/Authorization**: Semua endpoint dapat diakses siapa saja. Dalam production, perlu tambah auth layer.

4. **Synchronous Operations**: Semua operasi synchronous tanpa queue/message broker.

5. **UUID untuk ID**: Task dan audit log menggunakan `crypto.randomUUID()` yang sudah built-in di Node.js.

6. **ISO 8601 Timestamps**: Semua waktu disimpan dalam format ISO 8601 string.

7. **No Pagination**: Semua tasks dikembalikan sekaligus (cocok untuk small dataset).

8. **No Input Sanitization**: Tidak ada SQL injection concern karena in-memory, tapi title tidak di-sanitize.


## Trade-off yang Dibuat

**Data Storage**: In-Memory
Alasan: Simplicity, fast development
Trade-off: Data hilang saat restart

**Audit Log Strategy**: Append-Only Pattern
Alasan: Immutability, compliance
Trade-off: Tidak bisa delete logs, storage tumbuh (it's relevant for this very case because we store it in-memory)

**Status Transitions**: Linear-only
Alasan: Data integrity, prevent invalid states
Trade-off: Less flexibility, tidak bisa skip status

**Error Handling**: Custom exceptions
Alasan: Type safety, specific error handling
Trade-off: Perlu try-catch di routes

**API Structure**: RESTful + nested resources
Alasan: Convention, intuitive
Trade-off: Terbatas untuk query yang kompleks

**CORS Configuration**: Hardcoded origins
Alasan: Security untuk task ini
Trade-off: Tidak fleksibel untuk multiple frontend kedepannya.


## Jika Ada Waktu Lebih, Apa yang Akan Diperbaiki

### High Priority (Bugs/Security)

1. **Add Input Validation** - Validate & sanitize title (length, special chars)
2. **Add Request Logging** - Middleware untuk log semua requests
3. **Fix Memory Leak Risk** - Implement cache invalidation strategy
4. **Add Rate Limiting** - Prevent abuse dengan rate limiter middleware

### Medium Priority (Features)

5. **Add Pagination** - cth: `/tasks?page=1&limit=10`
6. **Add Filtering/Search** - cth: `/tasks?status=pending&search=keyword`
7. **Add Sorting** - cth: `/tasks?sort=createdAt:desc`
8. **Add Transaction Support** - Rollback jika audit log append gagal
9. **Add Soft Delete** - Delete flag daripada hard delete
10. **Add Timestamps** - `updatedAt` field pada Task

### Performance (Scaling)

11. **Add Database** - Replace in-memory dengan PostgreSQL/MongoDB
12. **Add Caching Layer** - Redis untuk frequently accessed tasks
13. **Add Indexing** - Database indexes untuk taskId, createdAt
14. **Add Connection Pooling** - Untuk database queries

### Code Quality

15. **Add Unit Tests** - Service & repository tests dengan Jest
16. **Add Integration Tests** - API endpoint tests
17. **Add API Documentation** - Swagger/OpenAPI specification


## Security & Design Questions

### 1. Bagaimana Kamu Memastikan Audit Log Tidak Ter-Modifikasi?


Audit log diimplementasikan dengan **Append-Only Pattern**:

```typescript
// AuditLogRepository hanya punya method append() dan read
export const AuditLogRepository = {
	append(log: AuditLog): void {
		auditLogs.push(log); // Hanya push, tidak ada update/delete
	},

	findByTaskId(taskId: string): AuditLog[] {
		return auditLogs.filter((log) => log.taskId === taskId); // Read-only
	},
};
```

**Strategi Keamanan:**

- ✅ **Immutable by Design**: Audit log tidak boleh dimodifikasi setelah dibuat
- ✅ **No DELETE Permission**: Repository tidak expose delete audit log
- ✅ **Sequential ID**: Setiap log punya unique ID
- ✅ **Timestamp Immutable**: Timestamp dibuat saat event terjadi

**Limitasi (Production):**

- ❌ **In-Memory Risk**: Masih bisa dimodifikasi via code injection
- ❌ **No Cryptographic Hash**: Tidak ada integrity check
- ❌ **No Digital Signature**: Tidak bisa verify authenticity


### 2. Bagian Mana dari Solusi Ini yang Paling Berisiko Jika Digunakan oleh Banyak User?

**Jawaban: In-Memory Storage**


**Risiko Utama:**

1. **Data Loss** (Highest Risk)
   - Saat server restart, semua data hilang
   - No persistence = no backup
   - Tidak cocok untuk production

2. **Memory Leak & Crash**
   - Array `tasks` dan `auditLogs` terus bertambah
   - Jika 1 juta tasks, memory usage membengkak
   - No garbage collection mechanism
   - Server akan out-of-memory dan crash

3. **No Backup** (Medium Risk)
   - Jika terjadi bug yang corrupt data structure
   - Tidak ada way untuk recover



### 3. Jika Task Ini Berkembang Menjadi Sistem Besar, Bagian Mana yang Akan Kamu Refactor Terlebih Dahulu dan Kenapa?

**Repository Layer (In-Memory → Database)**

1. **Current Bottleneck**: In-memory storage adalah blocker terbesar untuk scaling
2. **Architecture Ready**: Repository pattern sudah ada, mudah di-swap
3. **High ROI**: Satu perubahan ini fix most of production issues

**Rencana Refactor:**

```typescript
// BEFORE: In-Memory
const TaskRepository = {
	findAll(): Task[] {
		return tasks; 
	},
};

// AFTER: PostgreSQL
const TaskRepository = {
	async findAll(): Promise<Task[]> {
		const result = await db.query('SELECT * FROM tasks');
		return result.rows;
	},
};
```

**Urutan Refactor Berikutnya (setelah Repository):**

2. **Service Layer** → Add business logic for soft deletes, archiving
3. **Validation Layer** → Centralized input validation & sanitization
4. **Error Handling** → Better error codes & messages
5. **Authentication** → Add user context tracking
6. **API Versioning** → `/v1/tasks`, `/v2/tasks` untuk backwards compatibility


### 4. Jika Kamu Menggunakan AI, Jelaskan Bagian Mana yang Dibantu AI dan Bagaimana Kamu Memvalidasinya

*
Saya menggunakan GitHub Copilot + ChatGPT 5.2 untuk membantu development:

**Bagian yang Dibantu AI:**

1. **Intent Extraction**: AI digunakan untuk melakukan separation of concern dari fitur yang must-have hingga nice-to-have.
2. **Code Completion**: Auto-complete untuk React hooks, fetch calls, dan Tailwind classes.
3. **Refactoring Suggestions**: Struktur diambil menggunakan perintah "tree" lalu disesuaikan dengan common practice dengan limitation yang ada.
4. **Error Handling**: AI membantu generate error mapping logic.
5. **Penulisan README.md**: AI dipergunakan untuk review project serta building relevant information dari project.

**Bagaimana Validasi:**

1. **Manual Review**: Semua code dan structure yang di-generate ditinjau manual untuk correctness dan security serta kesesuaian dengan konsep penulis.
2. **Testing**: Jalankan aplikasi dan test semua features (create, update, delete tasks, view logs). itulah sebabnya mungkin ada beberapa function yang sengaja dibiarkan ada untuk proof bahwa testing dilakukan.
3. **Linting**: Gunakan ESLint untuk membantu melihat adanya potential issues.
4. **Type Checking**: TypeScript compiler memastikan type safety (concern terhadap types dipisah dalam folder \types untuk memudahkan checking terhadap types yang digenerate).
5. **Runtime Testing**: Test edge cases seperti network errors, invalid inputs.
6. **Code/README.md Review**: Memastikan kembali kesesuaian requirement dengan resource yang disediakan.