# DEVLINK Java / OOP UAS Requirement Mapping

Dokumen ini memetakan implementasi *Java Dasar* dan *Object-Oriented Programming* yang ada pada proyek DEVLINK untuk keperluan evaluasi UAS.

| Requirement UAS | Class / File | Method / Field | Penjelasan Fungsi |
|---|---|---|---|
| **Class / Object** | Semua Entity & DTO, misal: `Job`, `JobDto` | `public class JobDto` | Representasi struktur data domain dan transfer object sebagai Class nyata. |
| **Access Modifier & Encapsulation** | `JobDto`, Entitas JPA | `private String title`, `getTitle()` | Field dilindungi dari mutasi tak terduga dengan `private` dan diakses via method `public`. |
| **Constructor** | `JobDto`, Entitas | `public JobDto(UUID id, ...)` | Constructor untuk inisialisasi awal properti sebuah *object*. |
| **Keyword `this`** | `JobDto`, `JobServiceImpl` | `this.title = title;` | Digunakan untuk merujuk pada member variabel instans *object* ketika tertutup oleh parameter. |
| **Abstract Class** | `BaseEntity` | `public abstract class BaseEntity` | Bertindak sebagai template entitas database agar tidak diinstansiasi secara mandiri, tetapi diturunkan. |
| **Inheritance (`extends`)** | `User`, `Job`, dll | `public class Job extends BaseEntity` | Mewarisi properti `id`, `createdAt`, dan `updatedAt` dari `BaseEntity`. |
| **Interface** | `JobService` | `public interface JobService` | Mendefinisikan kontrak *service* tanpa mengetahui detail implementasinya (Abstraction). |
| **Implementation Class** | `JobServiceImpl` | `class JobServiceImpl implements JobService` | Mengimplementasikan logika nyata dari kontrak *interface* di atas. |
| **Method Overloading** | `JobService`, `JobServiceImpl` | `searchJobs()` dan `searchJobs(String keyword)` | Memiliki nama method yang sama tetapi signature (parameter) berbeda, untuk kemudahan filtering opsi kosong/ada input. |
| **List & ArrayList** | `JobServiceImpl` | `List<JobDto> result = new ArrayList<>();` | Menampung kumpulan *object* secara dinamis, baik dari database maping maupun hasil loop. |
| **Map & HashMap** | `JobServiceImpl` | `Map<String, Long> stats = new HashMap<>();` | Mengagregasi (mengumpulkan dan menghitung) *metadata* pekerjaan (seperti jumlah Job berstatus OPEN vs CLOSED). |
| **Tipe Data & Variable** | `JobServiceImpl` | `String lowerKeyword`, `boolean titleMatch` | Deklarasi data primitif dan referensi untuk menampung *state* selama flow logika. |
| **Operator** | `JobServiceImpl` | `!= null`, `||`, `+ 1L` | Memanfaatkan perbandingan logika dan operator aritmatika. |
| **If / Else** | `JobServiceImpl` | `if (keyword == null ...) { ... } else { ... }` | Control flow untuk cabang pengambilan keputusan berdasarkan nilai _keyword_ / _status_. |
| **Looping (`for`)** | `JobServiceImpl` | `for (Job job : allJobs)` dan `for (int i=0;...)` | Memproses agregasi berulang setiap elemen di dalam koleksi `List`. |
| **Method (Param & Return)** | `JobServiceImpl` | `private JobDto convertToDto(Job job)` | Mengambil input argumen (Parameter) dan mengembalikan tipe spesifik (Return) setelah pemrosesan. |
| **Input / Output JSON (REST)** | `JobController` | `@GetMapping public ResponseEntity...` | Endpoint API yang memproses Request HTTP (input parameter `search`) dan mengembalikan `ResponseEntity` sebagai format output JSON. |

*Catatan: Semua implementasi tidak di-mocking, melainkan diintegrasikan ke dalam `JobService` yang memang relevan dengan Arsitektur dan Skema DEVLINK.*
