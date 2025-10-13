// scripts.js - Frontend Dashboard untuk Menampilkan Saldo dan Pendaftaran Wajah

// Ambil URL Ngrok atau localhost:3000
// ⚠️ GANTI DENGAN URL NGrok AKTIF TERBARU DARI TERMINAL 3 (JIKA SUDAH BERUBAH)
const API_BASE_URL = 'https://12e7f5acfe39.ngrok-free.app'; 

// ID pengguna dummy yang sedang login (HARUS SAMA dengan ID di database)
const CURRENT_USER_ID = 'nasabah_001'; 

// --- FUNGSI PEMBANTU ---

/**
 * Memformat angka menjadi string Rupiah (tanpa desimal).
 */
const formatRupiah = (amount) => (amount || 0).toLocaleString('id-ID', {
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
});


// --- FUNGSI UTAMA ---

/**
 * Mengambil dan menampilkan data saldo dan nama user dari backend.
 */
async function fetchDashboardData() {
    const dashboardURL = `${API_BASE_URL}/api/user/details/${CURRENT_USER_ID}`;
    
    // Ambil elemen HTML
    const nameDisplay = document.getElementById('user_name'); 
    const balanceDisplay = document.getElementById('current_balance'); 
    
    // 💡 Hapus referensi Inflow/Outflow dari sini, ini tugas fetchTransactionSummary
    
    // Tampilkan status loading awal
    if (nameDisplay) nameDisplay.textContent = 'Memuat...';
    if (balanceDisplay) balanceDisplay.textContent = 'Loading...';
    // 💡 Di sini kita hanya menampilkan status untuk elemen yang akan diisi oleh fungsi ini.
    
    try {
        const response = await fetch(dashboardURL);
        
        if (!response.ok) {
            // Membuang error ke catch block
            throw new Error(`Status: ${response.status}`);
        }
        
        const result = await response.json(); 
        const user = result.user; 

        // 1. Update Nama
        if (nameDisplay) {
            nameDisplay.textContent = user.nama || 'Nama N/A'; 
        }
        
        // 2. Update Saldo
        if (balanceDisplay) {
            const rawBalance = user.saldo || 0; 
            balanceDisplay.dataset.rawBalance = rawBalance; 
            // Tetapkan tampilan awal sebagai '*****'
            balanceDisplay.textContent = '*****'; 
        }
        
    } catch (error) {
        console.error("Kesalahan saat memuat dashboard. Detail:", error);
        
        // Tampilkan error hanya pada elemen yang menjadi tanggung jawab fungsi ini
        if (nameDisplay) nameDisplay.textContent = 'Error Koneksi';
        if (balanceDisplay) balanceDisplay.textContent = 'Gagal Muat';
        
        // 💡 Perbarui pesan alert agar lebih jelas
        alert(`❌ Gagal mengambil data user (Nama/Saldo).\nURL Gagal: ${dashboardURL}\nPastikan Node.js dan Ngrok berjalan. Error: ${error.message}`);
    }
}

/**
 * Mengambil ringkasan transaksi (Inflow/Outflow) dari backend.
 */
async function fetchTransactionSummary() {
    const transactionsURL = `${API_BASE_URL}/api/user/transactions/${CURRENT_USER_ID}`;
    
    const inflowDisplay = document.getElementById('total_inflow');
    const outflowDisplay = document.getElementById('total_outflow');

    // 💡 Status loading dipindahkan ke awal fungsi ini
    if (inflowDisplay) inflowDisplay.textContent = 'Memuat...'; 
    if (outflowDisplay) outflowDisplay.textContent = 'Memuat...';

    try {
        const response = await fetch(transactionsURL);
        
        if (!response.ok) {
            throw new Error(`Gagal ambil transaksi. Status: ${response.status}`);
        }
        
        const result = await response.json(); 
        const { totalInflow, totalOutflow } = result; 
        
        // Update Inflow
        if (inflowDisplay) {
            inflowDisplay.textContent = formatRupiah(totalInflow);
        }

        // Update Outflow
        if (outflowDisplay) {
            outflowDisplay.textContent = formatRupiah(totalOutflow);
        }

    } catch (error) {
        console.error("Kesalahan saat memuat ringkasan transaksi. Detail:", error);
        // Tampilkan nilai nol atau error jika gagal
        if (inflowDisplay) inflowDisplay.textContent = 'Rp 0 (Error)'; 
        if (outflowDisplay) outflowDisplay.textContent = 'Rp 0 (Error)';
        
        // 💡 Tambahkan alert spesifik
        alert(`❌ Gagal mengambil ringkasan transaksi (Inflow/Outflow).\nPastikan endpoint /api/user/transactions berjalan. Error: ${error.message}`);
    }
}

/**
 * Menginisiasi kamera web dan memutar feed-nya di elemen <video>.
 */
function startCamera() {
    // Fungsi ini tetap
    const video = document.getElementById('webcam_feed');
    if (!video) return; 

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            console.log("Kamera berhasil diaktifkan.");
        })
        .catch(err => {
            console.error("Gagal mengakses kamera:", err);
            // alert("Harap izinkan akses kamera untuk pendaftaran wajah.");
        });
}

/**
 * Mengambil gambar dari webcam dan mengirimkannya ke backend ML untuk pendaftaran.
 */
async function enrollFace() {
    // Fungsi ini tetap (hanya placeholder)
    const enrollButton = document.getElementById('enroll_button');
    if (!enrollButton) return;
    
    const originalText = enrollButton.textContent;
    enrollButton.disabled = true;
    enrollButton.textContent = "Processing...";

    try {
        alert('Fungsi EnrollFace dipanggil. Implementasi lengkap ada di fip_enroll.html');

    } catch (error) {
        console.error("Kesalahan jaringan saat pendaftaran:", error);
        alert('Gagal terhubung ke server FIP.');
    } finally {
        enrollButton.disabled = false;
        enrollButton.textContent = originalText;
    }
}

/**
 * Mengaktifkan/menonaktifkan tampilan saldo.
 */
function toggleBalanceVisibility() {
    // Fungsi ini tetap
    const balanceElement = document.getElementById('current_balance');
    const iconElement = document.querySelector('#toggle_balance .material-icons');
    
    if (!balanceElement) return;

    const isHidden = balanceElement.textContent.includes('*****');
    // Ambil saldo asli yang disimpan (sudah dipastikan number di fetchDashboardData)
    const rawBalance = parseFloat(balanceElement.dataset.rawBalance); 

    if (isHidden) {
        // Tampilkan Saldo dengan format Rupiah (menggunakan formatRupiah pembantu)
        balanceElement.textContent = formatRupiah(rawBalance);
        if (iconElement) iconElement.textContent = 'visibility';
    } else {
        // Sembunyikan Saldo
        balanceElement.textContent = '*****';
        if (iconElement) iconElement.textContent = 'visibility_off';
    }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', async () => {
    // 💡 KOREKSI UTAMA: Gunakan 'async' dan 'await' untuk memastikan data dimuat berurutan
    // Ini memperbaiki masalah di mana fetchTransactionSummary() bisa mulai sebelum
    // fetchDashboardData() selesai, atau error dari satu fungsi tidak ditangani sebelum
    // yang lain dimulai.
    
    // 1. Muat data dashboard (Nama & Saldo)
    await fetchDashboardData(); 
    
    // 2. Muat ringkasan transaksi (Inflow & Outflow)
    await fetchTransactionSummary(); 
    
    // 3. Inisiasi kamera (hanya jika elemen ada)
    startCamera(); 
    
    // 4. Tambahkan event listeners
    document.getElementById('toggle_balance')?.addEventListener('click', toggleBalanceVisibility);
    document.getElementById('enroll_button')?.addEventListener('click', enrollFace); 
});
