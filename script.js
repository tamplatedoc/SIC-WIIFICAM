// scripts.js

// Ambil URL Ngrok Anda dari Terminal 3, HANYA URL dasarnya tanpa endpoint
const API_BASE_URL = 'https://142422b71760.ngrok-free.app'; 

// ID pengguna dummy yang sedang login (Ganti dengan logika autentikasi di produksi)
const CURRENT_USER_ID = 'nasabah_001'; 

// --- FUNGSI UTAMA ---

/**
 * Mengambil dan menampilkan data saldo dan laporan singkat dari backend.
 * Catatan: Asumsi endpoint ini ada di Servis Web Node.js Anda: /api/dashboard/:userId
 */
async function fetchDashboardData() {
    // ⚠️ Catatan: Asumsi Anda membuat endpoint /api/dashboard/:userId di server.js
    const dashboardURL = `${API_BASE_URL}/api/dashboard/${CURRENT_USER_ID}`;
    
    try {
        const response = await fetch(dashboardURL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        document.getElementById('user_name').textContent = data.user_name || 'Nasabah FIP';
        
        // Simpan nilai asli saldo di data-attribute untuk toggle
        document.getElementById('current_balance').dataset.hidden = data.saldo || 0; 
        document.getElementById('current_balance').textContent = '*****'; // Sembunyikan default
        
        document.getElementById('total_inflow').textContent = `Rp ${data.inflow ? data.inflow.toLocaleString('id-ID') : 0}`;
        document.getElementById('total_outflow').textContent = `Rp ${data.outflow ? data.outflow.toLocaleString('id-ID') : 0}`;

    } catch (error) {
        console.error("Gagal memuat data dashboard. Cek apakah endpoint /api/dashboard sudah dibuat di Node.js:", error);
        document.getElementById('current_balance').textContent = 'Gagal memuat';
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

        const enrollURL = `${API_BASE_URL}/enroll`; 

        // 4. Panggil Backend
        const response = await fetch(enrollURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            alert('✅ Pendaftaran Wajah Berhasil! Wajah Anda kini terdaftar sebagai ID Pembayaran.');
        } else {
            const errorData = await response.json();
            const errorCode = errorData.detail?.code || errorData.code || 'UNKNOWN_ERROR';
            alert(`❌ Pendaftaran Gagal: Kode Error ${errorCode}. Pastikan wajah terlihat jelas.`);
        }
    } catch (error) {
        console.error("Kesalahan jaringan saat pendaftaran:", error);
        alert('Gagal terhubung ke server. Cek Ngrok dan Node.js Anda.');
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
    
    const isHidden = balanceElement.textContent.includes('*****');

    if (isHidden) {
        // Tampilkan Saldo
        const rawBalance = parseFloat(balanceElement.dataset.hidden);
        balanceElement.textContent = `Rp ${rawBalance.toLocaleString('id-ID')}`;
        iconElement.textContent = 'visibility';
    } else {
        // Sembunyikan Saldo
        balanceElement.textContent = '*****';
        iconElement.textContent = 'visibility_off';
    }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Muat data dashboard
    fetchDashboardData();
    
    // 2. Inisiasi kamera jika elemen <video> tersedia
    startCamera(); 
    
    // 3. Tambahkan event listeners
    document.getElementById('toggle_balance')?.addEventListener('click', toggleBalanceVisibility);
    document.getElementById('enroll_button')?.addEventListener('click', enrollFace); 
});
