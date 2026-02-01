document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const table = document.querySelector('table');
    
    muatDataKeTabel();

    if (form) {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
        
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const isTextArea = e.target.tagName.toLowerCase() === 'textarea';
                    if (!isTextArea) {
                        e.preventDefault();
                        if (index < inputs.length - 1) {
                            inputs[index + 1].focus();
                        } else {
                            prosesSimpan();
                        }
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
        if (!form) return;
        const formData = new FormData(form);
        const dataBaru = {};
        let adaData = false;
        
        formData.forEach((value, key) => {
            if (value.trim() !== "") {
                dataBaru[key] = value;
                adaData = true;
            }
        });

        if (!adaData) {
            alert("Mohon isi data terlebih dahulu!");
            return;
        }

        let db = JSON.parse(localStorage.getItem('database_bk')) || [];
        db.push(dataBaru);
        localStorage.setItem('database_bk', JSON.stringify(db));

        muatDataKeTabel();
        form.reset();
        
        const firstInput = form.querySelectorAll('input, select, textarea')[0];
        if (firstInput) firstInput.focus();
    }

    function muatDataKeTabel() {
        if (!table) return;
        const db = JSON.parse(localStorage.getItem('database_bk')) || [];
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.toLowerCase());

        while (table.rows.length > 1) { table.deleteRow(1); }

        const dataHalamanIni = db.filter(item => {
            const keys = Object.keys(item);
            if (headers.some(h => h.includes('absen')) && keys.includes('status')) return true;
            if (headers.some(h => h.includes('layanan')) && keys.includes('layanan')) return true;
            if (headers.some(h => h.includes('nis')) && keys.includes('nis')) return true;
            return false;
        }).slice(-1); 

        dataHalamanIni.forEach(item => {
            const newRow = table.insertRow();
            Object.values(item).forEach(val => {
                const cell = newRow.insertCell();
                cell.textContent = val;
            });
        });
    }

    const setupExport = (id, keyIdentitas, prefixNama) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                if (typeof XLSX === 'undefined') {
                    alert('Library Excel belum dimuat! Pastikan ada koneksi internet.');
                    return;
                }

                let db = JSON.parse(localStorage.getItem('database_bk')) || [];
                const dataDiExport = db.filter(item => item.hasOwnProperty(keyIdentitas));
                const dataTetapTinggal = db.filter(item => !item.hasOwnProperty(keyIdentitas));
                
                if (dataDiExport.length === 0) {
                    alert('Tidak ada data untuk kategori ini!');
                    return;
                }

                const infoKelas = dataDiExport[0].kelas ? dataDiExport[0].kelas.replace(/\s+/g, '_') : 'Semua';
                const namaFileDinamis = `${prefixNama}_(${infoKelas})_`;

                const ws = XLSX.utils.json_to_sheet(dataDiExport);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Laporan");
                XLSX.writeFile(wb, `${namaFileDinamis}.xlsx`);

                localStorage.setItem('database_bk', JSON.stringify(dataTetapTinggal));
                alert(`Laporan berhasil diunduh. Data telah dikosongkan.`);
                muatDataKeTabel(); 
            };
        }
    };

    setupExport('export-siswa', 'nis', 'data_siswa');
    setupExport('export-jurnal', 'layanan', 'jurnal');
    setupExport('export-absensi', 'status', 'absensi');
});
