// fip_enroll.js - Frontend Pendaftaran Wajah (Integrasi Penuh)

const video = document.getElementById('webcam'); 
const statusMsg = document.getElementById('status_message');
const enrollButton = document.getElementById('enroll_button');

// 🛑 KONFIGURASI PENTING
// Ganti dengan URL Ngrok terbaru Anda
const API_BASE_URL = 'https://2116a72c7562.ngrok-free.app'; 
const API_ENROLL_URL = `${API_BASE_URL}/enroll`; 
const API_USER_DETAILS_URL = `${API_BASE_URL}/api/user/details/`;

const STATIC_USER_ID = 'nasabah_001'; 
const REDIRECT_URL = 'profile.html'; // Tujuan redirect setelah sukses

// 💾 Variabel untuk menyimpan data user yang diambil dari Firestore
let userData = {
    user_id: STATIC_USER_ID,
    nama: 'Memuat Nama...',
    saldo: 0,
    face_id_exists: false // Status pendaftaran
};

// --- FUNGSI NOTIFIKASI ---

/**
 * Menambahkan notifikasi ke localStorage (simulasi database notifikasi frontend).
 */
function addNotification(message) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const newNotification = {
        id: Date.now(),
        message: message,
        timestamp: new Date().toISOString(),
        isRead: false
    };
    notifications.unshift(newNotification); // Tambahkan di awal
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// --- FUNGSI UTAMA ---

/**
 * Mengambil data user dari Firestore (untuk cek status pendaftaran awal).
 */
async function fetchUserData() {
    try {
        const url = `${API_USER_DETAILS_URL}${userData.user_id}`;
        
        statusMsg.textContent = "⏳ Memuat data user dari database...";
        statusMsg.className = 'status-msg processing';

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Gagal memuat data user. Status: ${response.status}`);
        }
        
        const result = await response.json();
        const user = result.user;
        
        // Simpan data yang sudah diambil
        userData.nama = user.nama || 'Nama Belum Ditetapkan';
        userData.saldo = user.saldo || 0;
        userData.face_id_exists = user.face_id_exists || false;
        
        // Pengecekan Status Pendaftaran Awal
        if (userData.face_id_exists) {
            statusMsg.textContent = `🛑 Akun ${userData.nama} sudah terdaftar FIP. Tidak perlu mendaftar lagi.`;
            statusMsg.className = 'status-msg failed';
            if (enrollButton) enrollButton.disabled = true;
            return;
        }

        statusMsg.textContent = `✅ Siap mendaftar wajah untuk: ${userData.nama}. Saldo: Rp ${userData.saldo.toLocaleString('id-ID')}`;
        statusMsg.className = 'status-msg success';

    } catch (err) {
        console.error("Fetch User Data Error:", err);
        statusMsg.textContent = "❌ Gagal memuat data user dari database. Cek koneksi API.";
        statusMsg.className = 'status-msg failed';
        if (enrollButton) enrollButton.disabled = true;
    }
}


/**
 * Mengakses kamera web browser.
 */
function initWebcam() {
    // ... (Fungsi tidak berubah, kode inisialisasi webcam)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => video.srcObject = stream)
            .catch(err => {
                statusMsg.className = 'status-msg failed';
                statusMsg.textContent = "Error: Gagal akses kamera. Pastikan izin kamera diberikan.";
                console.error("Webcam Init Error:", err);
                if (enrollButton) enrollButton.disabled = true;
            });
    } else {
        statusMsg.className = 'status-msg failed';
        statusMsg.textContent = "Error: Browser Anda tidak mendukung akses kamera.";
        if (enrollButton) enrollButton.disabled = true;
    }
}

/**
 * Mengambil frame dari kamera dan mengirimkannya ke backend untuk pendaftaran.
 */
async function captureAndEnroll() {
    if (video.readyState !== 4) {
        statusMsg.className = 'status-msg processing';
        statusMsg.textContent = "Kamera belum siap. Mohon tunggu sebentar.";
        return;
    }

    if (userData.face_id_exists) {
        statusMsg.textContent = "🛑 Akun ini sudah terdaftar FIP.";
        return;
    }

    if (enrollButton) {
        enrollButton.disabled = true;
        enrollButton.textContent = "Processing...";
    }
    
    statusMsg.className = 'status-msg processing';
    statusMsg.textContent = "⏳ Sedang memproses dan menyimpan Vektor Fitur...";
    
    // Proses pengambilan gambar Base64
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const faceImageData = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    
    try {
        const response = await fetch(API_ENROLL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: userData.user_id,
                image_base64: faceImageData,
                nama: userData.nama,
                saldo: userData.saldo 
            })
        });

        const data = await response.json();

        if(response.ok && data.status === 'success') {
            
            // 1. TAMBAHKAN NOTIFIKASI KE LOCAL STORAGE
            addNotification(`Selamat ${userData.nama} atas pembukaan rekening FIP Anda di VFIP BANK! Kami senang menjadi mitra perbankan Anda. Kami berharap dapat memberikan layanan terbaik dan semoga Anda mendapatkan pengalaman perbankan yang memuaskan.`);
            addNotification(`Terima kasih atas kepercayaan Anda dalam membuka rekening bersama kami. Merupakan suatu kehormatan bagi kami untuk menjalin hubungan perbankan dengan Anda. Kami akan selalu berusaha memberikan pelayanan terbaik.`);
            
            statusMsg.className = 'status-msg success';
            statusMsg.textContent = `✅ Pendaftaran FIP Berhasil! Mengalihkan ke halaman profil...`;
            
            // 2. REDIRECT
            setTimeout(() => {
                window.location.href = REDIRECT_URL; // Alihkan ke profile.html
            }, 1500); // Tunggu 1.5 detik sebelum redirect

        } else {
            statusMsg.className = 'status-msg failed';
            const errorMessage = data.detail?.message || data.message || "Kesalahan Server.";
            statusMsg.textContent = "❌ Pendaftaran Gagal: " + errorMessage;
        }
    } catch (err) {
        statusMsg.className = 'status-msg failed';
        statusMsg.textContent = "❌ Gagal Terhubung ke Server VBank. Cek koneksi Ngrok dan Node.js Anda.";
        console.error("Enrollment Fetch Error:", err);
    } finally {
        if (enrollButton && !userData.face_id_exists) {
            enrollButton.disabled = false;
            enrollButton.textContent = "Daftar Wajah Sekarang";
        }
    }
}

// Panggil inisialisasi webcam dan muat data saat DOM sudah siap
document.addEventListener('DOMContentLoaded', () => {
    fetchUserData(); 
    initWebcam(); 
    if (enrollButton) {
        enrollButton.addEventListener('click', captureAndEnroll);
    }
});
