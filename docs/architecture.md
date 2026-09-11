# DEVLINK Architecture & Domain Design

## 1. ENTITY ARCHITECTURE
Desain arsitektur entitas DEVLINK terdiri dari 7 entitas utama untuk mengakomodasi alur bisnis, negosiasi yang persisten, dan penyelesaian project.

1. **User**: Menyimpan data pengguna, otentikasi, dan peran (Client/Freelancer).
2. **Job**: Permintaan pekerjaan yang dibuat oleh Client.
3. **Proposal**: Penawaran yang diajukan oleh Freelancer ke suatu Job.
4. **ProposalOffer (Counter-Offer)**: Menyimpan histori negosiasi harga dan durasi antara Client dan Freelancer secara persisten.
5. **Project**: Terbentuk otomatis saat sebuah Proposal/Offer diterima.
6. **Message**: Obrolan / Chat untuk konteks proposal tertentu (Real-time).
7. **Review**: Ulasan dan rating yang diberikan setelah Project selesai.

---

## 2. USER & AUTHENTICATION
**Fields:**
- `name` (String, Not Null)
- `email` (String, Unique, Not Null)
- `password` (String, Not Null)
- `role` (Enum: `CLIENT`, `FREELANCER`, Not Null)
- `bio` (Text)
- `skills` (String / List of Strings)
- `avatarUrl` (String)

**Roles:**
- `CLIENT`
- `FREELANCER`

**Authentication Protocol:**
DEVLINK menggunakan otentikasi berbasis **JWT** dengan **Spring Security** sebagai layer sekuriti. Tidak menyimpan password dalam plaintext dan tidak menaruh secret key di GitHub.

- **REGISTER (`POST /api/auth/register`)**: 
  - Password di-hash menggunakan **BCrypt**.
  - User di-persist ke database.
- **LOGIN (`POST /api/auth/login`)**: 
  - Credentials diverifikasi.
  - Jika valid, JWT di-generate dan dikembalikan.
- **Protected API**: 
  - Klien mengirim header `Authorization: Bearer <JWT>`.
  - Spring Security memvalidasi token.
  - Authenticated user tersedia untuk application logic.

**Rules:**
- `email` harus unik.
- User hanya dapat mengubah profile miliknya sendiri.

---

## 3. JOB
**Fields:**
- `client` (User)
- `title` (String, Not Null)
- `description` (Text, Not Null)
- `budget` (BigDecimal / NUMERIC, Not Null)
- `deadline` (Date, Not Null)
- `requiredSkills` (String / List of Strings)
- `status` (Enum: `OPEN`, `IN_PROGRESS`, `CLOSED`, Not Null)

**Job Lifecycle:**
- `OPEN` -> `IN_PROGRESS`: Terjadi ketika `ProposalOffer` final `ACCEPTED` dan `Project` terbentuk.
- `IN_PROGRESS` -> `CLOSED`: Terjadi ketika `Project` menjadi `COMPLETED`. Ini adalah final state.
- `CLOSED`: Job tidak dapat menerima proposal baru dan tidak boleh kembali ke `OPEN`.

**Rules:**
- Hanya `CLIENT` yang dapat membuat Job.
- Client hanya dapat mengubah Job miliknya.
- Job dengan status `IN_PROGRESS` atau `CLOSED` tidak boleh diedit sembarangan.
- Freelancer dapat melihat semua Job yang berstatus `OPEN`.
- Satu Job HANYA boleh memiliki satu `Project` aktif.
- Proses pencarian (search case-insensitive) dan pengurutan (sorting) dilakukan di backend.

---

## 4. PROPOSAL
**Fields:**
- `job` (Job)
- `freelancer` (User)
- `price` (BigDecimal / NUMERIC, Not Null) - *Harga awal*
- `durationDays` (Integer, Not Null) - *Durasi awal*
- `coverLetter` (Text, Not Null)
- `status` (Enum: `PENDING`, `NEGOTIATING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, Not Null)

**Proposal Lifecycle:**
- **CREATE**: 
  - Proposal status = `PENDING`.
  - Initial `ProposalOffer` is created transactionally dengan status `PENDING`, ditawarkan oleh Freelancer, dan memuat initial price/duration/cover letter.
- **NEGOTIATION**: 
  - Ketika sebuah counter-offer diinisiasi, Proposal status menjadi `NEGOTIATING`.
  - Proposal tetap `NEGOTIATING` selama negosiasi berlanjut.
- **ACCEPTANCE**: 
  - Ketika offer disetujui, Proposal status menjadi `ACCEPTED`.
- **WITHDRAW**: 
  - Freelancer dapat melakukan withdraw pada proposal miliknya selama masih eligible. Status menjadi `WITHDRAWN`.
- **REJECTION**: 
  - Proposal aktif (status `PENDING` atau `NEGOTIATING`) otomatis menjadi `REJECTED` ketika proposal lain untuk Job yang sama disetujui.

---

## 5. PROPOSALOFFER / COUNTER-OFFER (NEGOTIATION)
**Fields:**
- `proposal` (Proposal)
- `offeredBy` (User)
- `price` (BigDecimal / NUMERIC, Not Null)
- `durationDays` (Integer, Not Null)
- `message` (Text)
- `status` (Enum: `PENDING`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`, Not Null)

**Price Responsibility:**
- `Proposal.price` & `durationDays`: Representasi penawaran awal.
- `ProposalOffer.price` & `durationDays`: Representasi harga dan durasi dari setiap offer/counter-offer dalam histori.

**ProposalOffer Negotiation Rules:**
- Histori negosiasi HARUS dipertahankan. Dilarang me-overwrite atau menghapus offer lama.
- Hanya boleh ada **SATU** `ProposalOffer` berstatus `PENDING` pada suatu `Proposal` di waktu yang sama.
- Selama ada offer `PENDING`: **HANYA penerima (recipient)** dari offer terakhir tersebut yang boleh merespons (counter-offer, accept, reject).
- Jika offer `PENDING` di-`REJECTED` (dan tidak ada offer pending lagi): **KEDUA participant** boleh menginisiasi offer baru.
- Setelah offer baru `PENDING` terbentuk: Aturan *recipient-only* berlaku kembali.

---

## 6. ACCEPT PROPOSAL / PROJECT CREATION (TRANSACTIONAL)
Proses penerimaan tawaran **HARUS** bersifat transaksional.

**Acceptance Transaction Rules:**
- Hanya valid `PENDING` offer yang bisa di-`ACCEPTED`.
- Hanya penerima (recipient) dari offer `PENDING` terakhir yang bisa menerima offer tersebut.
- Ketika sebuah offer diterima, transaksi berikut berjalan:
  1. `ProposalOffer` -> `ACCEPTED`
  2. `Proposal` -> `ACCEPTED`
  3. Create exactly **ONE** `Project` dari accepted offer tersebut.
     - `Project.agreedPrice` = accepted offer price.
     - `Project.agreedDurationDays` = accepted offer duration.
  4. `Job` -> `IN_PROGRESS`
  5. Reject ALL OTHER active proposals (`PENDING` atau `NEGOTIATING`) untuk Job yang sama. (`WITHDRAWN` atau `REJECTED` tidak diubah).

---

## 7. PROJECT
**Fields:**
- `proposal` (Proposal)
- `agreedPrice` (BigDecimal / NUMERIC, Not Null)
- `agreedDurationDays` (Integer, Not Null)
- `title` (String, Not Null)
- `deadline` (Timestamp, Not Null)
- `status` (Enum: `IN_PROGRESS`, `SUBMITTED`, `REVISION`, `COMPLETED`, Not Null)
- `startedAt` (Timestamp)
- `completedAt` (Timestamp, Nullable)

**Project Uniqueness:**
- Project BUKAN dibuat melalui endpoint normal `POST /api/projects`. Project HANYA dibuat secara otomatis melalui proses Acceptance Transaction dari ProposalOffer.
- Satu Proposal : Satu Project.
- Satu Job HANYA boleh memiliki satu active Project.
- Hanya partisipan (Client dan Freelancer) yang dapat mengakses detail Project.

**Project Lifecycle:**
Lifecycle harus secara eksplisit:
`IN_PROGRESS` -> `SUBMITTED` -> `COMPLETED`
ATAU
`IN_PROGRESS` -> `SUBMITTED` -> `REVISION` -> `SUBMITTED` -> `COMPLETED`

**Rules:**
- **Freelancer**:
  - Dapat *submit work* ketika Project `IN_PROGRESS`.
  - Dapat *resubmit* ketika Project `REVISION`.
- **Client**:
  - Dapat *request REVISION* ketika Project `SUBMITTED`.
  - Dapat *complete the Project* ketika Project `SUBMITTED`.
- **COMPLETED** adalah final state. Ketika Project `COMPLETED`:
  - `Job` menjadi `CLOSED`.
  - `completedAt` di-record.

---

## 8. REVIEW
**Fields:**
- `project` (Project)
- `reviewer` (User)
- `reviewee` (User)
- `rating` (Integer 1-5, Not Null)
- `comment` (Text)

**Review Database Integrity & Rules:**
- Review HANYA dapat dibuat ketika Project berstatus `COMPLETED`.
- `reviewer` dan `reviewee` harus partisipan dari Project tersebut.
- **Satu reviewer hanya boleh memberikan SATU review kepada SATU reviewee untuk SATU Project.**
  - Recommended DB Constraint: `UNIQUE(project_id, reviewer_id, reviewee_id)`
  - Backend wajib memvalidasi dan mengembalikan `409 Conflict` jika terjadi duplicate review.

---

## 9. MESSAGE / CHAT
**Fields:**
- `proposal` (Proposal)
- `sender` (User)
- `content` (Text, Not Null)

**Rules:**
- Lingkup chat berada pada `Proposal`. 
- Hanya Client pemilik Job dan Freelancer pemilik Proposal yang dapat membaca/mengirim pesan.

---

## 10. AUTHORIZATION MATRIX
| Action | CLIENT | FREELANCER | Rule Kepemilikan (Ownership) |
| :--- | :--- | :--- | :--- |
| register | Yes | Yes | Public |
| login | Yes | Yes | Public |
| profile | Yes | Yes | Edit hanya miliknya sendiri |
| create job | Yes | No | - |
| edit job | Yes | No | Hanya Job miliknya (yg belum IN_PROGRESS/CLOSED) |
| delete job | Yes | No | Hanya Job miliknya (tanpa proposal aktif/project) |
| view job | Yes | Yes | Bebas melihat Job berstatus OPEN |
| search job | Yes | Yes | Backend proses berdasarkan keyword |
| create proposal | No | Yes | Job harus OPEN. 1 proposal aktif per freelancer per Job |
| view proposal | Yes | Yes | Client: hanya di Job miliknya. Freelancer: miliknya |
| withdraw proposal| No | Yes | Hanya Proposal miliknya |
| create counter-offer | Yes | Yes | Hanya partisipan (aturan Recipient-Only) |
| accept offer | Yes | Yes | Hanya penerima offer `PENDING` terakhir |
| reject offer | Yes | Yes | Hanya penerima offer `PENDING` terakhir |
| view project | Yes | Yes | Hanya partisipan Project |
| project -> SUBMITTED| No | Yes | Freelancer participant |
| project -> REVISION | Yes | No | Client participant |
| project -> COMPLETED| Yes | No | Client participant |
| send message | Yes | Yes | Partisipan Proposal (Client & Freelancer terkait) |
| read message | Yes | Yes | Partisipan Proposal (Client & Freelancer terkait) |
| create review | Yes | Yes | Project harus COMPLETED, partisipan ke partisipan lain |

*Backend wajib memverifikasi JWT dan ownership via database query.*

---

## 11. API CONTRACT CONSISTENCY
Endpoint backend tidak boleh bertentangan dengan business rules.

**AUTH:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

**JOBS:**
- `GET /api/jobs`
- `GET /api/jobs/{id}`
- `POST /api/jobs`
- `PUT /api/jobs/{id}`
- `DELETE /api/jobs/{id}`

**PROPOSALS:**
- `POST /api/jobs/{jobId}/proposals` (Transactional: Membuat `Proposal` + initial `ProposalOffer` status PENDING)
- `GET /api/jobs/{jobId}/proposals`
- `GET /api/proposals/me`
- `GET /api/proposals/{id}`
- `POST /api/proposals/{id}/withdraw`

**OFFERS:**
- `POST /api/proposals/{proposalId}/offers`
- `GET /api/proposals/{proposalId}/offers`
- `POST /api/proposals/{proposalId}/offers/{offerId}/accept` (Transactional)
- `POST /api/proposals/{proposalId}/offers/{offerId}/reject` (Proposal tetap NEGOTIATING)

**PROJECTS:**
- `GET /api/projects`
- `GET /api/projects/{id}`
- `POST /api/projects/{id}/status` *(Menggunakan target status: `SUBMITTED`, `REVISION`, `COMPLETED`. Jangan gunakan aksi ambigu seperti SUBMIT)*
*(TIDAK ADA endpoint create project manual)*

**REVIEWS:**
- `POST /api/projects/{projectId}/reviews` (Returns 409 Conflict if duplicate)
- `GET /api/projects/{projectId}/reviews`
- `GET /api/users/{userId}/reviews`
- `GET /api/users/{userId}/profile`

**MESSAGES:**
- `GET /api/proposals/{proposalId}/messages`
- `POST /api/proposals/{proposalId}/messages`
- `WS /ws` (Destination: `/topic/proposals/{proposalId}`, STOMP broker)

---

## 12. SEARCH AND SORT
Pencarian dan pengurutan WAJIB dilakukan oleh backend.

**Endpoint:**
`GET /api/jobs?search={keyword}&sortBy={field}&direction={asc|desc}`

**Requirements:**
- `search`: Minimal mencari substring case-insensitive di `title` atau `description`.
- `sortBy`: Minimal `budget`, `deadline`, `createdAt`.
- `direction`: `asc`, `desc`.

---

## 13. ERROR HANDLING
Standard JSON error response (Spring `@ControllerAdvice`):

```json
{
  "timestamp": "2026-09-04T02:00:00Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Budget must be greater than 0",
  "path": "/api/jobs"
}
```

**Minimal Status HTTP:**
- `400 Bad Request` (Validasi input gagal)
- `401 Unauthorized` (Belum login/token invalid)
- `403 Forbidden` (Tidak berhak mengakses/mengubah resource)
- `404 Not Found` (Resource tidak ditemukan)
- `409 Conflict` (Duplikasi resource, misal duplikasi review)
- `500 Internal Server Error`

---

## 14. DATABASE RELATIONSHIPS
Relasi Konseptual (RDBMS):
- **User (1) <-> (N) Job**: Satu User(Client) punya banyak Job.
- **User (1) <-> (N) Proposal**: Satu User(Freelancer) mengirim banyak Proposal.
- **Job (1) <-> (N) Proposal**: Satu Job menampung banyak Proposal.
- **Proposal (1) <-> (N) ProposalOffer**: Satu Proposal bisa memiliki banyak histori penawaran.
- **Proposal (1) <-> (1) Project**: Satu Proposal (yang Accepted) menjadi satu Project.
- **Proposal (1) <-> (N) Message**: Chatting terjadi dalam konteks satu Proposal.
- **Project (1) <-> (N) Review**: Satu Project ditinjau oleh Client/Freelancer.
- **User (1) <-> (N) Review (Reviewer)**
- **User (1) <-> (N) Review (Reviewee)**

---

## 15. JAVA / OOP MAPPING
Untuk memenuhi rubrik penilaian UAS, implementasi akan memanfaatkan OOP secara eksplisit:
- **Class / Object**: Semua Entity dan DTO adalah Class.
- **Private Attributes & Encapsulation**: Atribut dideklarasikan private dan diakses melalui **Getters/Setters**.
- **Constructors & `this`**: Constructor digunakan untuk inisialisasi object, menggunakan keyword `this`.
- **Inheritance, `extends`, & Abstract Class**:
  - `BaseEntity` merupakan **Abstract Class** yang `extends` oleh semua entitas utama.
  - Memiliki atribut auditing (`id`, `createdAt`, `updatedAt`).
- **Interfaces & Implementation Class**:
  - Service pattern menggunakan **Interface** (contoh: `JobService`) dan **Implementation Class** (`JobServiceImpl`).
  - Penggunaan `JpaRepository` sebagai interface bawaan JPA. (Catatan: wajib membuat custom service interface/impl).
- **`@Override`**: Digunakan secara eksplisit pada implementasi interface.
- **Method Overloading**: Pembuatan fungsi helper/service dengan parameter yang bervariasi.
- **List / ArrayList**: Mapping entitas One-To-Many.
- **Map / HashMap**: Berguna dalam response dinamis atau utility data structure.

---

## 16. UAS REQUIREMENT MAPPING
Arsitektur DEVLINK memastikan implementasi UAS Requirements berikut terpenuhi:
- **React, Vite, pnpm, JavaScript**: Stack utama frontend.
- **Tailwind/CSS**: Styling framework yang digunakan.
- **Java, Spring Boot, Spring Web, Spring Data JPA**: Stack backend utama.
- **Maven**: Dependency management (atau setara).
- **PostgreSQL**: RDBMS utama.
- **REST API, MVC/Separation**: Arsitektur klien-server.
- **CRUD**: Lengkap pada entitas inti.
- **Validation**: `@Valid` dan constraint Hibernate.
- **Exception Handling**: Mengembalikan response berformat error terpadu.
- **CORS**: Dikustomisasi di backend untuk akses frontend.
- **Search, Sorting, Backend Query Parameters**: Memenuhi syarat filter sisi backend.
- **Postman Collection**: Untuk validasi API.
- **Fetch API**: Menggunakan native JavaScript `fetch` API.
- **`useState`, `useEffect`**: Hooks frontend.
- **Loading State, Error State, Empty State**: UX requirements.
- **Responsive Frontend**: UI menyesuaikan device.
- **GitHub, README, .env.example, No Secrets**: Repositori yang aman dan terstruktur.
- **Bonus**: Real-time WebSocket/STOMP feature dipertahankan.
