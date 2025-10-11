// scripts.js

// Konstanta untuk ID pengguna dummy (harus diganti dengan otentikasi sesi di produksi)
const CURRENT_USER_ID = 'nasabah_001'; 
const API_BASE_URL = 'http://127.0.0.1:5000'; // Ganti dengan URL dasar API VBank Anda (misalnya http://localhost:3000)

/**
 * Mengambil dan menampilkan data saldo dan laporan singkat dari backend.
 */
async function fetchDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/${CURRENT_USER_ID}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        // 1. Tampilkan Nama Pengguna
        document.getElementById('user_name').textContent = data.user_name || 'Nasabah';

        // 2. Tampilkan Saldo
        const formattedBalance = `Rp ${data.saldo.toLocaleString('id-ID')}`;
        document.getElementById('current_balance').dataset.hidden = data.saldo; // Simpan nilai asli
        document.getElementById('current_balance').textContent = '*****'; // Sembunyikan secara default
        
        // 3. Tampilkan Laporan Singkat
        document.getElementById('total_inflow').textContent = `Rp ${data.inflow.toLocaleString('id-ID')}`;
        document.getElementById('total_outflow').textContent = `Rp ${data.outflow.toLocaleString('id-ID')}`;

    } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
        document.getElementById('current_balance').textContent = 'Gagal memuat';
        document.getElementById('total_inflow').textContent = 'Rp 0';
        document.getElementById('total_outflow').textContent = 'Rp 0';
    }
}

/**
 * Mengaktifkan/menonaktifkan tampilan saldo.
 */
function toggleBalanceVisibility() {
    const balanceElement = document.getElementById('current_balance');
    const iconElement = document.querySelector('#toggle_balance .material-icons');
    const labelElement = document.getElementById('toggle_balance');
    
    const isHidden = balanceElement.textContent === '*****';

    if (isHidden) {
        // Tampilkan Saldo
        balanceElement.textContent = `Rp ${parseFloat(balanceElement.dataset.hidden).toLocaleString('id-ID')}`;
        iconElement.textContent = 'visibility';
        labelElement.childNodes[2].textContent = ' Sembunyikan Saldo'; // Update text node
    } else {
        // Sembunyikan Saldo
        balanceElement.textContent = '*****';
        iconElement.textContent = 'visibility_off';
        labelElement.childNodes[2].textContent = ' Tampilkan Saldo'; // Update text node
    }
}


// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    
    // Tambahkan event listener untuk fitur tampil/sembunyi saldo
    document.getElementById('toggle_balance').addEventListener('click', toggleBalanceVisibility);
});

// Catatan: Anda perlu membuat endpoint di backend VBank Anda, contoh:
// app.get('/api/dashboard/:userId', (req, res) => { /* logic */ });
// yang mengembalikan JSON seperti: { user_name: 'Budi Santoso', saldo: 500000, inflow: 1200000, outflow: 700000 }
