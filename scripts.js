// scripts.js - Frontend Dashboard untuk Menampilkan Saldo dan Pendaftaran Wajah

// Ambil URL Ngrok atau localhost:3000
// ⚠️ GANTI DENGAN URL NGrok AKTIF TERBARU DARI TERMINAL 3 (JIKA SUDAH BERUBAH)
const API_BASE_URL = 'https://12e7f5acfe39.ngrok-free.app'; 

// ID pengguna dummy yang sedang login (HARUS SAMA dengan ID di database)
const CURRENT_USER_ID = 'nasabah_001'; 

// --- FUNGSI UTAMA ---

/**
 * Mengambil dan menampilkan data saldo dan nama user dari backend.
 */
// scripts.js - Frontend Dashboard untuk Menampilkan Saldo dan Pendaftaran Wajah

// ... (Kode API_BASE_URL dan CURRENT_USER_ID tetap) ...

// --- FUNGSI UTAMA ---

/**
 * Mengambil dan menampilkan data saldo dan nama user dari backend.
 */
async function fetchDashboardData() {
    // ... (Kode pengambilan data user detail tetap) ...

    const dashboardURL = `${API_BASE_URL}/api/user/details/${CURRENT_USER_ID}`;
    
    // Ambil elemen HTML
    const nameDisplay = document.getElementById('user_name'); 
    const balanceDisplay = document.getElementById('current_balance'); 
    const inflowDisplay = document.getElementById('total_inflow'); // <-- Elemen ini
    const outflowDisplay = document.getElementById('total_outflow'); // <-- Dan elemen ini

    // Tampilkan status loading awal
    if (nameDisplay) nameDisplay.textContent = 'Memuat...';
    if (balanceDisplay) balanceDisplay.textContent = 'Loading...';
    if (inflowDisplay) inflowDisplay.textContent = 'Memuat...'; // 💡 UBAH: Status loading
    if (outflowDisplay) outflowDisplay.textContent = 'Memuat...'; // 💡 UBAH: Status loading
    
    try {
        const response = await fetch(dashboardURL);
        
        if (!response.ok) {
            throw new Error(`Gagal ambil data. Cek koneksi API: ${response.url} Status: ${response.status}`);
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
            balanceDisplay.textContent = '*****'; 
        }
        
        // 3. Status Inflow/Outflow (akan diisi oleh fungsi terpisah)
        // HAPUS: Baris ini tidak lagi diperlukan
        // if (inflowDisplay) inflowDisplay.textContent = 'Rp 0';
        // if (outflowDisplay) outflowDisplay.textContent = 'Rp 0';


    } catch (error) {
        // ... (Kode penanganan error tetap) ...
        console.error("Kesalahan saat memuat dashboard. Detail:", error);
        
        if (nameDisplay) nameDisplay.textContent = 'Error Koneksi';
        if (balanceDisplay) balanceDisplay.textContent = 'Gagal Muat';
        if (inflowDisplay) inflowDisplay.textContent = 'Error'; // 💡 TAMBAH: Penanganan error
        if (outflowDisplay) outflowDisplay.textContent = 'Error'; // 💡 TAMBAH: Penanganan error
        
        alert(`❌ Gagal mengambil data user.\nURL Gagal: ${dashboardURL}\nPastikan Node.js dan Ngrok berjalan. Error: ${error.message}`);
    }
}

// 💡 FUNGSI BARU: Mengambil ringkasan transaksi (Inflow/Outflow)
async function fetchTransactionSummary() {
    const transactionsURL = `${API_BASE_URL}/api/user/transactions/${CURRENT_USER_ID}`;
    
    const inflowDisplay = document.getElementById('total_inflow');
    const outflowDisplay = document.getElementById('total_outflow');

    try {
        const response = await fetch(transactionsURL);
        
        if (!response.ok) {
            throw new Error(`Gagal ambil transaksi. Status: ${response.status}`);
        }
        
        const result = await response.json(); 
        const { totalInflow, totalOutflow } = result; 
        
        // Fungsi pembantu untuk format Rupiah (tanpa desimal)
        const formatRupiah = (amount) => amount.toLocaleString('id-ID', {
             style: 'currency', 
             currency: 'IDR', 
             minimumFractionDigits: 0,
             maximumFractionDigits: 0 
        });

        // Update Inflow
        if (inflowDisplay) {
            inflowDisplay.textContent = formatRupiah(totalInflow || 0);
        }

        // Update Outflow
        if (outflowDisplay) {
            outflowDisplay.textContent = formatRupiah(totalOutflow || 0);
        }

    } catch (error) {
        console.error("Kesalahan saat memuat ringkasan transaksi. Detail:", error);
        if (inflowDisplay) inflowDisplay.textContent = 'Rp 0';
        if (outflowDisplay) outflowDisplay.textContent = 'Rp 0';
    }
}

// ... (Fungsi startCamera, enrollFace, dan toggleBalanceVisibility tetap) ...

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Muat data dashboard (Nama & Saldo)
    fetchDashboardData();
    
    // 💡 TAMBAH: Muat ringkasan transaksi (Inflow & Outflow)
    fetchTransactionSummary(); 
    
    // 2. Inisiasi kamera (hanya jika elemen ada)
    startCamera(); 
    
    // 3. Tambahkan event listeners
    document.getElementById('toggle_balance')?.addEventListener('click', toggleBalanceVisibility);
    document.getElementById('enroll_button')?.addEventListener('click', enrollFace); 
});
