// scripts.js - Frontend Dashboard untuk Menampilkan Saldo dan Pendaftaran Wajah

// Ambil URL Ngrok atau localhost:3000
// ⚠️ Pastikan Anda mengganti ini jika URL Ngrok Anda berubah
const API_BASE_URL = 'https://142422b71760.ngrok-free.app'; 

// ID pengguna dummy yang sedang login (HARUS SAMA dengan ID di database)
const CURRENT_USER_ID = 'nasabah_001'; 

// --- FUNGSI UTAMA ---

/**
 * Mengambil dan menampilkan data saldo dan nama user dari backend.
 * Menggunakan endpoint /api/user/details/:user_id yang sudah dibuat di server.js.
 */
async function fetchDashboardData() {
    // 🛑 KOREKSI URL: Menggunakan endpoint detail user
    const dashboardURL = `${API_BASE_URL}/api/user/details/${CURRENT_USER_ID}`;
    
    // Asumsi ID elemen HTML:
    const nameDisplay = document.getElementById('user_name'); // Tampilkan Nama
    const balanceDisplay = document.getElementById('current_balance'); // Tampilkan Saldo

    if (nameDisplay) nameDisplay.textContent = 'Memuat...';
    if (balanceDisplay) balanceDisplay.textContent = 'Loading...';
    
    try {
        const response = await fetch(dashboardURL);
        
        if (!response.ok) {
            throw new Error(`Gagal mengambil data. Status: ${response.status}`);
        }
        
        const result = await response.json(); // Hasil: { success: true, user: {...} }
        const user = result.user; // Ambil objek user

        // 🛑 KOREKSI VARIABEL: Menggunakan user.nama dan user.saldo
        if (nameDisplay) {
            nameDisplay.textContent = user.nama || 'Nasabah VBank';
        }
        
        if (balanceDisplay) {
            // Simpan nilai asli saldo di data-attribute untuk toggle
            const rawBalance = user.saldo || 0;
            balanceDisplay.dataset.rawBalance = rawBalance; // Simpan saldo asli di data-attribute
            balanceDisplay.textContent = '*****'; // Sembunyikan default
        }
        
        // ⚠️ Catatan: Elemen total_inflow dan total_outflow diabaikan sementara
        // karena endpoint /api/user/details belum menyediakannya.

    } catch (error) {
        console.error("Gagal memuat data dashboard. Error:", error);
        if (nameDisplay) nameDisplay.textContent = 'Gagal Muat';
        if (balanceDisplay) balanceDisplay.textContent = 'Gagal Muat';
    }
}

/**
 * Menginisiasi kamera web dan memutar feed-nya di elemen <video>.
 */
function startCamera() {
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
    const originalText = enrollButton.textContent;
    enrollButton.disabled = true;
    enrollButton.textContent = "Processing...";

    try {
        const video = document.getElementById('webcam_feed');
        if (!video || video.paused || video.ended) {
            alert('Kamera belum aktif atau feed video tidak tersedia.');
            return;
        }

        // 1. Capture Gambar
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 2. Konversi ke Base64 (tanpa prefix)
        const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1]; 
        
        // 3. Persiapkan Data Payload
        const payload = {
            user_id: CURRENT_USER_ID, 
            image_base64: imageBase64
        };

        // 🛑 KOREKSI URL: Menggunakan endpoint /enroll di Node.js
        const enrollURL = `${API_BASE_URL}/enroll`; 

        // 4. Panggil Backend
        const response = await fetch(enrollURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (response.ok) {
            alert('✅ Pendaftaran Wajah Berhasil! FIP Anda aktif.');
            fetchDashboardData(); // Muat ulang data untuk update status FIP
        } else {
            // Tangani error dari backend (misalnya LIVENESS_FAIL, FACE_MISSING)
            const errorMessage = responseData.detail?.message || responseData.message || 'Error Server.';
            alert(`❌ Pendaftaran Gagal: ${errorMessage}.`);
        }
    } catch (error) {
        console.error("Kesalahan jaringan saat pendaftaran:", error);
        alert('Gagal terhubung ke server. Cek koneksi.');
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
    const rawBalance = parseFloat(balanceElement.dataset.rawBalance);

    if (isHidden) {
        // Tampilkan Saldo
        balanceElement.textContent = `Rp ${rawBalance.toLocaleString('id-ID')}`;
        if (iconElement) iconElement.textContent = 'visibility';
    } else {
        // Sembunyikan Saldo
        balanceElement.textContent = '*****';
        if (iconElement) iconElement.textContent = 'visibility_off';
    }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Muat data dashboard (dipanggil pertama kali untuk mendapatkan nama & saldo)
    fetchDashboardData();
    
    // 2. Inisiasi kamera jika elemen <video> tersedia
    startCamera(); 
    
    // 3. Tambahkan event listeners
    document.getElementById('toggle_balance')?.addEventListener('click', toggleBalanceVisibility);
    document.getElementById('enroll_button')?.addEventListener('click', enrollFace); 
});
