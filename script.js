document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const table = document.querySelector('table');
    
    // Sinkronisasi: Munculkan data terakhir saat halaman dibuka/kembali
    muatDataKeTabel();

    // --- 1. NAVIGASI ENTER & SIMPAN OTOMATIS ---
    if (form) {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
        
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Mencegah form refresh
                    
                    if (index < inputs.length - 1) {
                        // Fokus ke kolom berikutnya
                        inputs[index + 1].focus();
                    } else {
                        // Sudah di kolom terakhir, langsung simpan
                        prosesSimpan();
                    }
                }
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            prosesSimpan();
        });
    }

    function prosesSimpan() {
        const formData = new FormData(form);
        const dataBaru = {};
        
        formData.forEach((value, key) => {
            dataBaru[key] = value; 
        });

        // Simpan ke penyimpanan lokal browser
        let db = JSON.parse(localStorage.getItem('database_bk')) || [];
        db.push(dataBaru);
        localStorage.setItem('database_bk', JSON.stringify(db));

        // Update tampilan tabel di layar
        muatDataKeTabel();
        
        // Reset form tanpa muncul popup
        form.reset();
        
        // Kembalikan kursor ke kotak pertama
        const firstInput = form.querySelectorAll('input, select, textarea')[0];
        if (firstInput) firstInput.focus();
    }

    // --- 2. FUNGSI MUAT DATA (AGAR TIDAK HILANG) ---
    function muatDataKeTabel() {
        if (!table) return;
        const db = JSON.parse(localStorage.getItem('database_bk')) || [];
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.toLowerCase());

        // Bersihkan isi tabel sementara (sisakan header)
        while (table.rows.length > 1) { table.deleteRow(1); }

        // Filter data agar hanya menampilkan data milik kategori halaman tersebut
        const dataHalamanIni = db.filter(item => {
            if (headers.includes('absen') && item.hasOwnProperty('status')) return true; // Halaman Absensi
            if (headers.includes('layanan') && item.hasOwnProperty('layanan')) return true; // Halaman Jurnal
            if (headers.includes('nis') && item.hasOwnProperty('nis')) return true; // Halaman Data Siswa
            return false;
        }).slice(-1); // Hanya tampilkan 1 baris terakhir di tabel input

        dataHalamanIni.forEach(item => {
            const newRow = table.insertRow();
            Object.values(item).forEach(val => {
                const cell = newRow.insertCell();
                cell.textContent = val;
            });
        });
    }

    // --- 3. LOGIKA EXPORT + AUTO CLEAR + NAMA FILE: KATEGORI_(KELAS)_ ---
    const setupExport = (id, keyIdentitas, prefixNama) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                let db = JSON.parse(localStorage.getItem('database_bk')) || [];
                
                // Pisahkan data yang akan diekspor dan yang tetap tinggal
                const dataDiExport = db.filter(item => item.hasOwnProperty(keyIdentitas));
                const dataTetapTinggal = db.filter(item => !item.hasOwnProperty(keyIdentitas));
                
                if (dataDiExport.length === 0) {
                    alert('Tidak ada data untuk kategori ini!');
                    return;
                }

                // Ambil info kelas dari data pertama untuk penamaan file
                const infoKelas = dataDiExport[0].kelas ? dataDiExport[0].kelas.replace(/\s+/g, '_') : 'Semua';
                // Format Nama: kategori_(kelas)_
                const namaFileDinamis = `${prefixNama}_(${infoKelas})_`;

                // Proses unduh file Excel
                const ws = XLSX.utils.json_to_sheet(dataDiExport);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Laporan");
                XLSX.writeFile(wb, `${namaFileDinamis}.xlsx`);

                // --- PENGOSONGAN DATA (Auto-Clear) ---
                localStorage.setItem('database_bk', JSON.stringify(dataTetapTinggal));
                
                alert(`Laporan ${namaFileDinamis} berhasil diunduh. Data di web telah dikosongkan.`);
                muatDataKeTabel(); // Update tabel agar bersih kembali
            };
        }
    };

    // Konfigurasi ID tombol di halaman laporan.html
    setupExport('export-siswa', 'nis', 'data_siswa');
    setupExport('export-jurnal', 'layanan', 'jurnal');
    setupExport('export-absensi', 'status', 'absensi');
});
