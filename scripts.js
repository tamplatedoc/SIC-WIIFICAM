// scripts.js - Frontend Dashboard untuk Menampilkan Saldo dan Pendaftaran Wajah

// Ambil URL Ngrok atau localhost:3000
// ⚠️ GANTI DENGAN URL NGrok AKTIF TERBARU DARI TERMINAL 3 (JIKA SUDAH BERUBAH)
const API_BASE_URL = 'https://142422b71760.ngrok-free.app'; 

// ID pengguna dummy yang sedang login (HARUS SAMA dengan ID di database)
const CURRENT_USER_ID = 'nasabah_001'; 

// --- FUNGSI UTAMA ---

/**
 * Mengambil dan menampilkan data saldo dan nama user dari backend.
 * Menggunakan endpoint /api/user/details/:user_id yang sudah dibuat di server.js.
 */
async function fetchDashboardData() {
    const dashboardURL = `${API_BASE_URL}/api/user/details/${CURRENT_USER_ID}`;
    
    // Ambil elemen HTML
    const nameDisplay = document.getElementById('user_name'); 
    const balanceDisplay = document.getElementById('current_balance'); 
    const inflowDisplay = document.getElementById('total_inflow');
    const outflowDisplay = document.getElementById('total_outflow');

    // Tampilkan status loading awal
    if (nameDisplay) nameDisplay.textContent = 'Memuat...';
    if (balanceDisplay) balanceDisplay.textContent = 'Loading...';
    if (inflowDisplay) inflowDisplay.textContent = 'Rp 0';
    if (outflowDisplay) outflowDisplay.textContent = 'Rp 0';
    
    try {
        const response = await fetch(dashboardURL);
        
        if (!response.ok) {
            // Jika Node.js mati/Ngrok mati/URL salah, respons akan 404 atau 502
            throw new Error(`Gagal ambil data. Cek koneksi API: ${response.url} Status: ${response.status}`);
        }
        
        const result = await response.json(); 
        const user = result.user; 

        // 1. Update Nama
        if (nameDisplay) {
            nameDisplay.textContent = user.nama || 'Nasabah VBank';
        }
        
        // 2. Update Saldo
        if (balanceDisplay) {
            const rawBalance = user.saldo || 0;
            balanceDisplay.dataset.rawBalance = rawBalance; // Simpan saldo asli
            balanceDisplay.textContent = '*****'; // Default Sembunyi
        }
        
        // 3. Status Inflow/Outflow (Tetap Rp 0 karena endpoint /details belum menyediakannya)
        // Anda harus membuat endpoint terpisah untuk mengambil data transaksi jika ingin ini diisi.
        if (inflowDisplay) inflowDisplay.textContent = 'Rp 0';
        if (outflowDisplay) outflowDisplay.textContent = 'Rp 0';

    } catch (error) {
        console.error("Kesalahan saat memuat dashboard. Detail:", error);
        // Tampilkan pesan error yang lebih berguna jika koneksi gagal
        if (nameDisplay) nameDisplay.textContent = 'Error';
        if (balanceDisplay) balanceDisplay.textContent = 'Gagal';
        
        alert(`❌ Gagal mengambil data user. Pastikan Node.js dan Ngrok berjalan. Error: ${error.message}`);
    }
}

/**
 * Menginisiasi kamera web dan memutar feed-nya di elemen <video>.
 */
function startCamera() {
    // Fungsi ini hanya berjalan jika Anda berada di fip_enroll.html,
    // karena index.html tidak memiliki elemen <video id="webcam_feed">.
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
            alert("Harap izinkan akses kamera untuk pendaftaran wajah.");
        });
}

/**
 * Mengambil gambar dari webcam dan mengirimkannya ke backend ML untuk pendaftaran.
 */
async function enrollFace() {
    const enrollButton = document.getElementById('enroll_button');
    if (!enrollButton) return;
    
    const originalText = enrollButton.textContent;
    enrollButton.disabled = true;
    enrollButton.textContent = "Processing...";

    try {
        // Logika EnrollFace dihilangkan untuk fokus pada perbaikan index.html
        // Jika Anda ingin menguji enroll, pastikan elemen HTML yang dibutuhkan (video, button) ada.
        
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
    const balanceElement = document.getElementById('current_balance');
    const iconElement = document.querySelector('#toggle_balance .material-icons');
    
    if (!balanceElement) return;

    const isHidden = balanceElement.textContent.includes('*****');
    const rawBalance = parseFloat(balanceElement.dataset.rawBalance); // Ambil saldo asli yang disimpan

    if (isHidden) {
        // Tampilkan Saldo
        const formattedSaldo = `Rp ${rawBalance.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
        balanceElement.textContent = formattedSaldo;
        if (iconElement) iconElement.textContent = 'visibility';
    } else {
        // Sembunyikan Saldo
        balanceElement.textContent = '*****';
        if (iconElement) iconElement.textContent = 'visibility_off';
    }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Muat data dashboard
    fetchDashboardData();
    
    // 2. Inisiasi kamera (hanya jika elemen ada)
    startCamera(); 
    
    // 3. Tambahkan event listeners
    document.getElementById('toggle_balance')?.addEventListener('click', toggleBalanceVisibility);
    document.getElementById('enroll_button')?.addEventListener('click', enrollFace); 
});
