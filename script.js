document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const table = document.querySelector('table');
    
    muatDataKeTabel();

    if (form) {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
        
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); 
                    
                    if (index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    } else {
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
            if (headers.includes('absen') && item.hasOwnProperty('status')) return true; 
            if (headers.includes('layanan') && item.hasOwnProperty('layanan')) return true; 
            if (headers.includes('nis') && item.hasOwnProperty('nis')) return true; 
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
                
                alert(`Laporan ${namaFileDinamis} berhasil diunduh. Data di web telah dikosongkan.`);
                muatDataKeTabel(); 
            };
        }
    };

    setupExport('export-siswa', 'nis', 'data_siswa');
    setupExport('export-jurnal', 'layanan', 'jurnal');
    setupExport('export-absensi', 'status', 'absensi');
});