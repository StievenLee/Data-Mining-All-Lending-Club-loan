# Laporan Knowledge Discovery
### Menemukan Pola Tersembunyi pada Data Pinjaman Lending Club (2007–2018)

**Mata kuliah:** Data Mining · Proyek KDD Domain Perbankan
**Dataset:** Lending Club Accepted & Rejected Loans, 2007–2018 Q4
**Metodologi:** KDD lima fase (Preprocessing → Clustering → Association Rule → Anomaly Detection → Visualisasi)

Laporan ini ditulis untuk pembaca non-teknis. Seluruh angka di dalamnya berasal langsung dari
hasil eksekusi notebook Fase 1 sampai Fase 4, bukan estimasi. Istilah teknis dijelaskan saat
pertama kali muncul.

---

## 1. Ringkasan Eksekutif

Kami menganalisis 2,26 juta pinjaman yang disetujui dan 27,6 juta pengajuan yang ditolak oleh
Lending Club sepanjang 2007–2018. Pertanyaan yang kami kejar bukan "berapa akurat model kami",
melainkan **apa yang tidak terlihat ketika data ini hanya dilihat lewat tabel dan rata-rata biasa.**

Kami menemukan lima hal. Yang paling penting:

> **Sinyal gagal bayar yang paling kuat tidak melekat pada siapa peminjamnya, melainkan pada
> bagaimana kontraknya disusun.** Tenor 60 bulan berfungsi sebagai saluran yang mengumpulkan
> pinjaman berbunga tinggi, berkualitas kredit rendah, dan bernominal besar di satu tempat,
> lalu kombinasi itu bermuara pada tingkat gagal bayar jauh di atas ekspektasi. Tenor dan
> plafon adalah dua variabel yang **dikendalikan sendiri oleh pemberi pinjaman**, berbeda dari
> pendapatan atau skor kredit yang melekat pada nasabah. Artinya temuan ini bisa langsung
> ditindaklanjuti lewat kebijakan produk.

Temuan kedua yang tidak kalah penting bersifat metodologis, dan kami memperolehnya dengan cara
yang tidak menyenangkan: **89% "temuan" pada versi pertama analisis kami ternyata bukan temuan
sama sekali.** Pola berkekuatan paling mengesankan yang sempat kami banggakan hanya memantulkan
kembali kebijakan penetapan harga Lending Club yang sudah kami masukkan sendiri ke dalam data.
Setelah kami buang, pola risiko yang sesungguhnya justru baru muncul ke permukaan.

---

## 2. Konteks dan Pertanyaan Sentral

Lending Club adalah platform pinjaman peer-to-peer. Setiap pengajuan dinilai, diberi peringkat
kredit (*grade* A sampai G), lalu ditentukan suku bunganya. Pengajuan yang lolos menjadi
pinjaman; yang tidak lolos tercatat di dataset terpisah.

Data ini sudah sangat sering dianalisis, dan sebagian besar analisisnya berhenti pada
kesimpulan yang sudah bisa ditebak: skor kredit rendah berarti bunga tinggi, bunga tinggi
berarti risiko gagal bayar lebih besar. Karena itu kami menetapkan standar yang lebih ketat
untuk diri sendiri, dan itulah pertanyaan sentral laporan ini:

> **Apa yang kami temukan yang tidak sudah terlihat dari data mentah?**

Sebuah temuan hanya kami hitung menjawab pertanyaan itu bila memenuhi tiga syarat: (a) tidak
bisa diperoleh dengan satu tabel pivot sederhana, (b) tidak sekadar mengulang aturan main yang
memang sudah tertanam di dalam data, dan (c) mengubah keputusan yang akan diambil.

---

## 3. Apa yang Sudah Terlihat Sebelum Kami Menambang

Supaya klaim "temuan baru" bisa diuji, kami perlu jujur tentang apa yang **sudah** kelihatan
tanpa teknik data mining apa pun. Tiga hal berikut cukup diperoleh dengan tabulasi biasa:

| Sudah jelas dari data mentah | Angka |
|---|---|
| Skor kredit rendah cenderung dikenai bunga lebih tinggi | 67% peminjam pada kelompok FICO terendah menerima bunga di atas median, dibanding hanya 21% pada kelompok FICO tertinggi |
| Bunga tinggi lebih sering gagal bayar | 35,9% pada kelompok bunga tertinggi vs 6,7% pada kelompok terendah |
| Sebagian besar pinjaman untuk melunasi utang lama | *debt consolidation* mendominasi seluruh kategori tujuan pinjaman |

Ketiganya benar, tetapi tidak satu pun mengubah keputusan siapa pun. Semuanya adalah
konfirmasi atas hal yang memang sudah diasumsikan. Lima temuan di Bagian 4 adalah yang
menurut kami melampaui titik ini.

---

## 4. Lima Temuan

### Temuan 1 — Risiko gagal bayar terkuat melekat pada struktur kontrak, bukan pada peminjam

**Apa yang kami temukan.** Tenor 60 bulan bukan sekadar pilihan nasabah yang ingin cicilan
lebih ringan. Ia berperilaku seperti corong: menarik tiga jenis risiko yang berbeda ke satu
tempat, lalu tempat itu memiliki tingkat gagal bayar di atas ekspektasi.

**Buktinya.** Dari analisis aturan asosiasi (Fase 3), yang mengukur seberapa jauh dua hal muncul
bersama melebihi kebetulan. Angka *lift* 2,7 berarti "2,7 kali lebih sering dari yang diperkirakan
kalau keduanya tidak berhubungan":

| Pola | Muncul pada | Kekuatan (lift) |
|---|---|---|
| Bunga di atas 20% → tenor 60 bulan | 66% kasus | 2,73× |
| Grade E → tenor 60 bulan | 61% kasus | 2,54× |
| Tenor 60 bulan → pinjaman besar (20–35 ribu USD) yang **gagal bayar** | 13% kasus | **2,66×** |
| Tenor 60 bulan → pinjaman menengah (10–20 ribu USD) yang **gagal bayar** | 17% kasus | 2,15× |
| Pinjaman gagal bayar → penyewa rumah bertenor 60 bulan | 16% kasus | 2,03× |

**Mengapa ini tidak terlihat dari data mentah.** Bila kolom tenor dilihat sendirian, ia hanya
menunjukkan dua nilai (36 atau 60 bulan) tanpa sesuatu yang mencolok. Bila kolom bunga dilihat
sendirian, hubungannya dengan gagal bayar memang sudah diketahui. Yang tidak terlihat adalah
bahwa **tenor menjadi titik pertemuan** dari bunga tinggi, grade rendah, dan nominal besar
sekaligus. Tidak ada satu tabel pivot yang menampilkan hal itu; ia hanya muncul ketika seluruh
kombinasi atribut ditelusuri secara sistematis.

**Artinya untuk bisnis.** Ini temuan yang paling bisa ditindaklanjuti di seluruh proyek, karena
tenor dan plafon adalah variabel yang ditentukan oleh **pemberi pinjaman**, bukan oleh nasabah.
Berbeda dari pendapatan atau skor kredit yang hanya bisa disaring, struktur kontrak bisa
langsung diubah.

**Batasan yang perlu dijaga.** *Confidence* pola gagal bayar ini rendah (13–17%), artinya
mayoritas pinjaman bertenor 60 bulan **tetap lunas**. Pola ini karena itu **tidak boleh** dipakai
untuk menolak satu pengajuan. Nilainya ada di tingkat portofolio: sebagai dasar pembatasan
eksposur agregat, bukan aturan tolak per orang. Kami menekankan pembedaan ini karena keliru
menerapkannya akan merugikan ribuan nasabah yang sebenarnya membayar penuh.

---

### Temuan 2 — Ada 5.274 pinjaman yang "wajar" menurut semua ukuran umum, tetapi janggal begitu konteksnya diperhitungkan

**Apa yang kami temukan.** Bunga 15% adalah hal biasa bagi peminjam berskor kredit rendah,
tetapi menjadi janggal bila diberikan kepada peminjam berskor kredit sangat tinggi. Penyaringan
biasa tidak bisa menangkap kejanggalan semacam ini, karena 15% tidak ekstrem menurut ukuran
populasi mana pun. Kejanggalannya baru muncul **relatif terhadap kelompok skor kreditnya sendiri.**

**Buktinya.** Kami membagi seluruh peminjam ke dalam lima kelompok skor kredit, lalu menilai
ulang kewajaran bunga **di dalam** tiap kelompok, bukan terhadap seluruh populasi.

| | Jumlah | Tingkat gagal bayar |
|---|---|---|
| Seluruh populasi | 1.348.099 | 19,98% |
| Bunga janggal dalam konteks skor kreditnya | 14.385 (1,07%) | — |
| **Di antaranya: lolos seluruh penyaringan biasa** | **5.274** | **40,37%** |

Angka terakhir itulah intinya. Lima ribu pinjaman ini **tidak tertangkap oleh satu pun metode
penyaringan standar**, namun tingkat gagal bayarnya **dua kali lipat rata-rata populasi.**

**Mengapa ini tidak terlihat dari data mentah.** Menyaring kolom bunga secara global akan
melewatkan seluruh 5.274 pinjaman ini, karena nilainya memang tidak ekstrem. Mereka hanya
terlihat setelah pertanyaannya diubah dari "apakah bunga ini tinggi?" menjadi "apakah bunga ini
tinggi **untuk orang seperti dia**?"

**Artinya untuk bisnis.** Ketidaksesuaian antara harga dan risiko seperti ini adalah kandidat
kuat untuk dua hal: kesalahan penetapan harga (*mispricing*) atau kesalahan input data. Keduanya
merugikan dan keduanya bisa diperbaiki. Karena jumlahnya hanya lima ribuan dari 1,35 juta, daftar
ini realistis untuk ditinjau manual oleh tim risiko.

---

### Temuan 3 — Menyimpang di dua tingkat sekaligus jauh lebih berbahaya daripada menyimpang di satu tingkat

**Apa yang kami temukan.** Ada dua cara sebuah pinjaman bisa dianggap berisiko: karena ia
anggota **segmen** berisiko, atau karena ia **individu** yang menyimpang. Kami menguji apa yang
terjadi bila keduanya bertemu.

**Buktinya.** Segmentasi Fase 2 membagi peminjam ke tiga kelompok alami. Deteksi anomali Fase 4
menandai individu yang menyimpang. Irisan keduanya:

| Kelompok | Jumlah | Tingkat gagal bayar |
|---|---|---|
| Seluruh populasi | 1.348.099 | 19,98% |
| Segmen High-Risk (hasil segmentasi) | 347.489 (25,8%) | 33,37% |
| **Segmen High-Risk yang JUGA menyimpang secara individual** | **42.440 (3,2%)** | **36,55%** |

Perlu dicatat bahwa segmentasi ini dibentuk **tanpa pernah melihat status gagal bayar.**
Algoritma hanya melihat ciri pengajuan. Bahwa ketiga segmen ternyata memiliki tingkat gagal
bayar yang berjenjang rapi (11,65% → 19,19% → 33,37%) adalah konfirmasi independen bahwa
segmentasinya menangkap sesuatu yang nyata, bukan pengelompokan acak.

**Mengapa ini tidak terlihat dari data mentah.** Baik "segmen" maupun "individu menyimpang"
tidak ada sebagai kolom di data asli. Keduanya harus dibentuk lebih dulu, dan barulah irisannya
bisa ditanyakan.

**Artinya untuk bisnis.** Ini memberi tim risiko urutan prioritas yang jelas. Meninjau seluruh
347 ribu anggota segmen High-Risk tidak realistis. Meninjau 42 ribu yang menyimpang di dua
tingkat sekaligus jauh lebih mungkin, dan kelompok itu memang lebih berisiko.

---

### Temuan 4 — Komposisi risiko platform bergeser diam-diam, dan angka tahun terakhir menipu

**Apa yang kami temukan.** Lending Club tumbuh sangat cepat, tetapi pertumbuhan itu disertai
pergeseran komposisi peminjam ke arah yang lebih berisiko. Pergeserannya bertahap sehingga
tidak terlihat dari satu potret tahun mana pun.

**Buktinya.**

| Periode | Proporsi segmen High-Risk | Tingkat gagal bayar keseluruhan |
|---|---|---|
| 2009 (titik terendah) | 11,1% | 13,7–14,0% |
| 2013–2018 | 24–29% | — |
| 2016 (puncak) | — | 23,29% |
| 2018 | — | 15,76% |

Proporsi peminjam berisiko tinggi **naik lebih dari dua kali lipat** dari titik terendahnya.

**Peringatan penting tentang angka 2018.** Penurunan tajam tingkat gagal bayar pada 2018
(dari 23,29% ke 15,76%) **hampir pasti bukan perbaikan kualitas kredit.** Pinjaman yang
diterbitkan pada 2018 belum memiliki cukup waktu untuk gagal bayar saat data diambil. Ini
disebut *right-censoring*. Membaca angka itu sebagai kabar baik adalah kesalahan interpretasi
yang serius, dan kami menyebutkannya secara eksplisit justru karena angkanya terlihat
meyakinkan.

**Artinya untuk bisnis.** Kebijakan penjaminan (*underwriting*) tidak boleh ditetapkan sekali di
awal lalu dibiarkan. Komposisi risiko portofolio terbukti bergeser seiring skala bisnis membesar,
sehingga peninjauan berkala diperlukan. Satu hal yang menenangkan: urutan risiko antar segmen
tetap konsisten **di setiap tahun tanpa kecuali**, sehingga kerangka segmentasinya sendiri tetap
bisa diandalkan meski komposisinya berubah.

---

### Temuan 5 — Pola paling mengesankan secara angka justru yang paling tidak bernilai

Temuan ini bersifat metodologis, dan kami memasukkannya karena inilah pelajaran terbesar proyek
ini. Kami juga memasukkannya karena ini adalah koreksi atas kesalahan kami sendiri.

**Apa yang terjadi.** Versi pertama analisis aturan asosiasi kami menghasilkan pola-pola yang
tampak luar biasa:

> "Bunga sangat rendah (di bawah 8%) menandai pinjaman Grade A" — muncul pada **99,9% kasus**,
> **5,7 kali** lebih sering dari kebetulan.

Angka nyaris sempurna. Kami sempat menjadikannya temuan utama. **Itu keliru.**

Lending Club menetapkan suku bunga **berdasarkan** grade sebagai bagian dari kebijakan kreditnya.
Bunga bukan atribut independen yang kebetulan berhubungan dengan grade; bunga adalah **hasil
perhitungan dari** grade. Menemukan bahwa keduanya selalu muncul bersama sama saja dengan
"menemukan" bahwa harga di label sesuai dengan harga di kasir. Algoritma hanya memantulkan
kembali aturan yang kami sendiri masukkan ke dalam data.

**Seberapa besar dampaknya.** Setelah kami perlakukan pola ini sebagai tautologi dan membuangnya
secara konsisten:

| | Ambang awal (5%) | Ambang final (3%) |
|---|---|---|
| Pola awal (sebelum pembersihan) | 928 | 4.102 |
| Dibuang karena **tautologi penetapan harga** | **824 (88,8%)** | **3.206 (78,2%)** |
| Dibuang karena relasi definisi grade/sub-grade | 88 | 808 |
| Dibuang karena memakai informasi masa depan | 0 | 1 |
| **Tersisa benar-benar non-trivial** | **16 (1,7%)** | **87 (2,1%)** |
| Setelah perapian pola bersarang | 5 | **25** |

Di kedua ambang, lebih dari 97% pola gugur sebagai bukan-temuan.

Kami memulai dengan ambang kemunculan 5%, tetapi di situ hanya tersisa 5 pola — di bawah
syarat minimal 10 yang ditetapkan tugas. Karena ruang pola yang benar-benar non-trivial jauh
lebih tipis daripada yang terlihat semula, ambang kemunculan diturunkan ke 3% (masih setara
±40.000 pinjaman per pola). Kami hanya melonggarkan satu dimensi: ambang kekuatan tetap
dipertahankan di 2×, tidak ikut diturunkan.

**Konsekuensi yang mengubah kesimpulan, bukan sekadar mengurangi jumlah.** Pada versi pertama,
kategori pola "berisiko" kami **kosong sama sekali**, dan kami menyimpulkan bahwa risiko ekstrem
tidak memiliki pola massal. **Kesimpulan itu salah.** Kategori tersebut kosong bukan karena
polanya tidak ada, melainkan karena 824 pola tautologis berkekuatan jauh lebih tinggi (5,7×)
menenggelamkan pola risiko yang sesungguhnya (2,0–2,7×) di bawah ambang penyaringan. Setelah
tautologi dibuang, pola gagal bayar yang nyata — termasuk seluruh Temuan 1 — baru muncul.

**Artinya secara umum.** Ukuran kekuatan statistik seperti *lift* tidak pernah cukup berdiri
sendiri. Ia harus selalu dipasangkan dengan pemahaman tentang **bagaimana data itu terbentuk.**
Tanpa itu, sebuah sistem bisa dengan sangat percaya diri melaporkan kebijakannya sendiri kembali
kepada pembuatnya, dan menyebutnya penemuan.

---

## 5. Jawaban Langsung atas Pertanyaan Sentral

> **Apa yang kami temukan yang tidak sudah terlihat dari data mentah?**

**Kami menemukan bahwa risiko terkonsentrasi di tempat yang tidak dilihat orang: pada struktur
kontrak, pada konteks, dan pada irisan.**

Data mentah menunjukkan siapa yang berisiko — peminjam berskor kredit rendah, berbunga tinggi.
Itu sudah diketahui. Yang tidak terlihat adalah **di mana** risiko itu menumpuk:

1. **Pada struktur kontrak.** Tenor 60 bulan mempertemukan bunga tinggi, grade rendah, dan
   nominal besar, lalu pertemuan itu berujung gagal bayar 2,7 kali lebih sering dari ekspektasi.
   Tidak satu pun dari ketiga atribut itu tampak berbahaya bila dilihat sendiri-sendiri.

2. **Pada konteks.** 5.274 pinjaman berbunga yang sepenuhnya wajar menurut ukuran populasi
   ternyata janggal untuk kelas skor kreditnya sendiri, dan gagal bayar 40,37% — dua kali lipat
   rata-rata. Mereka tidak akan pernah tertangkap oleh penyaringan kolom mana pun.

3. **Pada irisan.** 42.440 pinjaman yang menyimpang sekaligus di tingkat segmen dan tingkat
   individu memiliki gagal bayar 36,55%, di atas rata-rata segmen berisiko itu sendiri.

Ketiganya punya satu kesamaan: **tidak ada satu pun yang berupa kolom di data asli.** Struktur
kontrak, konteks, dan irisan semuanya harus dibentuk lebih dulu sebelum bisa ditanyakan. Itulah
tepatnya yang membedakan penambangan data dari pelaporan data.

Dan sebagai catatan penutup yang sama pentingnya: kami juga menemukan **apa yang bukan
temuan.** Delapan puluh sembilan persen pola pertama kami hanyalah kebijakan platform yang
membaca dirinya sendiri. Menyingkirkannya menurunkan angka-angka kami secara drastis, tetapi
itulah yang membuat sisanya layak dipercaya.

---

## 6. Rekomendasi

| # | Rekomendasi | Dasar |
|---|---|---|
| 1 | Perlakukan **tenor sebagai variabel risiko tersendiri** dalam kebijakan produk, bukan sekadar preferensi cicilan nasabah. Batasi kombinasi tenor 60 bulan + nominal besar untuk peminjam berbunga tinggi. | Temuan 1 |
| 2 | Terapkan sebagai **batas eksposur portofolio, bukan aturan tolak individual.** Mayoritas pinjaman bertenor panjang tetap lunas; menolak per pengajuan akan merugikan nasabah baik. | Temuan 1 (batasan) |
| 3 | Jalankan **pemeriksaan kewajaran bunga di dalam tiap kelas skor kredit**, bukan hanya terhadap populasi. Tinjau manual 5.274 kasus yang teridentifikasi sebagai prioritas *mispricing*. | Temuan 2 |
| 4 | Prioritaskan tinjauan manual pada **42.440 kasus irisan** (segmen berisiko + menyimpang individual), bukan pada seluruh 347 ribu anggota segmen. | Temuan 3 |
| 5 | Jadwalkan **peninjauan kebijakan penjaminan secara berkala.** Komposisi risiko terbukti bergeser dua kali lipat sepanjang periode data. | Temuan 4 |
| 6 | Jangan membaca membaiknya angka gagal bayar tahun terakhir sebagai keberhasilan sebelum pinjaman tersebut cukup matang. | Temuan 4 |
| 7 | Dalam analisis lanjutan, **selalu uji apakah sebuah pola hanya memantulkan kembali kebijakan internal** sebelum melaporkannya sebagai temuan. | Temuan 5 |

---

## 7. Keterbatasan

Kami mencantumkan bagian ini karena temuan yang batasannya tidak dinyatakan lebih berbahaya
daripada temuan yang lebih sedikit.

1. **Aturan asosiasi mengukur kemunculan bersama, bukan sebab-akibat.** Tidak ada satu pun
   temuan di laporan ini yang membuktikan bahwa memperpendek tenor akan menurunkan gagal bayar.
   Yang terbukti hanyalah bahwa keduanya menumpuk di tempat yang sama.

2. **Deteksi outlier berbasis kepadatan (DBSCAN) dijalankan pada sampel 5.000 baris**, bukan
   seluruh 1,35 juta populasi, karena keterbatasan komputasi. Konsekuensinya, lapisan bukti
   tertinggi pada deteksi anomali (44 kasus paling meyakinkan) mewarisi keterbatasan sampel
   tersebut. Temuan 2 dan 3 tidak terpengaruh, karena keduanya dihitung pada populasi penuh.

3. **Hanya pinjaman yang sudah selesai yang dianalisis.** Pinjaman yang masih berjalan (38,9%
   dari data asli) dibuang karena hasil akhirnya belum diketahui. Proporsi pelunasan dalam
   laporan ini karena itu lebih tinggi dibanding bila seluruh pinjaman ikut dihitung.

4. **Dataset pengajuan yang ditolak sangat terbatas**, hanya memuat tiga atribut (jumlah yang
   diminta, rasio utang, lama bekerja). Pola yang bisa ditemukan di sana lemah (kekuatan 1,3–1,4×
   dibanding 2,0–3,0× pada pinjaman diterima). Kelemahan itu sendiri informatif: keputusan
   penolakan tampaknya tidak ditentukan oleh kombinasi sederhana dari ketiga atribut tersebut.

5. **Segmentasi menghasilkan kelompok yang saling tumpang tindih**, bukan terpisah tegas
   (*silhouette score* 0,125). Ini mencerminkan sifat perilaku kredit yang bersifat gradual,
   bukan kegagalan metode. Kami memilih jumlah segmen berdasarkan kemampuannya memisahkan
   tingkat gagal bayar nyata, bukan berdasarkan skor internal, dan menyatakan hal itu terbuka.

6. **Sebagian pola tenor kemungkinan mencerminkan kebijakan produk**, yang membatasi tenor 60
   bulan untuk nominal di atas ambang tertentu. Berbeda dari tautologi harga yang kami buang
   (yang deterministik, 99,9%), hubungan ini masih menyisakan variasi nyata (63,9%), sehingga
   kami laporkan dengan catatan ini alih-alih menyembunyikannya.

---

## 8. Lampiran: Angka Kunci per Fase

**Fase 1 — Preprocessing**
- Data awal: 2,26 juta pinjaman × 151 kolom (diterima); 27,6 juta × 9 kolom (ditolak)
- Data akhir: 1.348.099 baris × 14 fitur + 1 target
- Kolom bocor (*leakage*) yang dibuang: skor kredit terkini dan seluruh arus kas pasca-pinjaman,
  karena baru tersedia setelah keputusan kredit diambil
- Distribusi hasil akhir: 80% lunas, 20% gagal bayar

**Fase 2 — Segmentasi**
- Tiga segmen, dipilih berdasarkan validasi eksternal, bukan skor internal

| Segmen | Jumlah | Porsi | Gagal bayar |
|---|---|---|---|
| Prime / Low-Risk | 512.208 | 38,0% | 11,65% |
| Moderate-Risk | 488.402 | 36,2% | 19,19% |
| High-Risk | 347.489 | 25,8% | 33,37% |

**Fase 3 — Aturan Asosiasi** (setelah koreksi tautologi)
- Ambang: kemunculan minimal 3% populasi (≈40.000 pinjaman), kekuatan minimal 2×
- 25 pola non-trivial terdokumentasi, dikelompokkan ke tiga tema
- Pola terkuat pada pinjaman ditolak jauh lebih lemah (1,3–1,4×), dan itu sendiri temuan

**Fase 4 — Deteksi Anomali**

| Tingkat keyakinan | Jumlah |
|---|---|
| Lemah (1 metode) | 106.153 |
| Sedang (2 metode) | 48.025 |
| Kuat (3 metode) | 22.833 |
| Sangat Kuat (+ DBSCAN) | 15 |
| **Kritis (DBSCAN + 3 metode)** | **44** |

- Tipologi: 137.360 kasus langka yang sah · 39.361 sinyal risiko · 349 dugaan kesalahan data
- Seluruh 349 dugaan kesalahan data **diverifikasi ulang** terhadap nilai aslinya, dan ternyata
  bukan kesalahan input melainkan perilaku pembukaan banyak akun kredit yang nyata dan berisiko

---

*Seluruh angka dalam laporan ini dapat ditelusuri ke notebook Fase 1–4 di repositori proyek.
Dashboard interaktif tersedia pada Fase 5 untuk menjelajahi temuan per rentang tahun.*
