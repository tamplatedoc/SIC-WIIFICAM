// fip_enroll.js

// Pastikan elemen video Anda memiliki ID 'webcam'
const video = document.getElementById('webcam'); 
const statusMsg = document.getElementById('status_message');
const enrollButton = document.getElementById('enroll_button'); // Asumsi Anda punya tombol dengan ID ini

// Ganti dengan data user yang sebenarnya dari sesi login
const CURRENT_USER_ID = 'nasabah_001'; 
const CURRENT_USER_NAME = 'Budi Santoso';
// Ganti URL Ngrok ini jika server Anda berubah
const API_ENROLL_URL = 'https://2116a72c7562.ngrok-free.app/fip_pay'; 
const DEFAULT_SALDO = 500000; // Saldo awal yang dikirim ke Node.js jika user baru

/**
 * Mengakses kamera web browser.
 */
function initWebcam() {
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
 * Mengambil frame dari kamera, mengkonversinya ke Base64, dan mengirimkannya ke backend.
 */
async function captureAndEnroll() {
    if (video.readyState !== 4) {
        statusMsg.className = 'status-msg processing';
        statusMsg.textContent = "Kamera belum siap. Mohon tunggu sebentar.";
        return;
    }

    if (enrollButton) {
        enrollButton.disabled = true;
        enrollButton.textContent = "Processing...";
    }
    
    statusMsg.className = 'status-msg processing';
    statusMsg.textContent = "⏳ Sedang memproses dan menyimpan Vektor Fitur...";
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Konversi gambar ke Base64, hapus header data URL
    const faceImageData = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    
    try {
        const response = await fetch(API_ENROLL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                // Payload untuk ML Python dan data tambahan untuk update Firestore di Node.js
                user_id: CURRENT_USER_ID,       // Diharapkan oleh Python
                image_base64: faceImageData,    // Diharapkan oleh Python
                nama: CURRENT_USER_NAME,        // Data tambahan untuk Node.js
                saldo: DEFAULT_SALDO            // Data tambahan untuk Node.js
            })
        });

        const data = await response.json();

        // 🛑 KOREKSI UTAMA: Cek data.status == 'success' karena ini yang dikirim Python
        if(response.ok && data.status === 'success') {
            statusMsg.className = 'status-msg success';
            statusMsg.textContent = `✅ Pendaftaran FIP Berhasil! Wajah ${CURRENT_USER_NAME} telah terdaftar.`;
        } else {
            // Tangani error dari Python (misal: LIVENESS_FAIL, FACE_MISSING)
            statusMsg.className = 'status-msg failed';
            
            // Ambil pesan error spesifik dari detail.message (FastAPI) atau message umum
            const errorMessage = data.detail?.message || data.message || "Kesalahan Server.";
            
            statusMsg.textContent = "❌ Pendaftaran Gagal: " + errorMessage;
        }
    } catch (err) {
        statusMsg.className = 'status-msg failed';
        statusMsg.textContent = "❌ Gagal Terhubung ke Server VBank. Cek koneksi Ngrok dan Node.js Anda.";
        console.error("Enrollment Fetch Error:", err);
    } finally {
        if (enrollButton) {
            enrollButton.disabled = false;
            enrollButton.textContent = "Daftar Wajah Sekarang";
        }
    }
}

// Panggil inisialisasi webcam saat DOM sudah siap
document.addEventListener('DOMContentLoaded', () => {
    initWebcam();
    if (enrollButton) {
        enrollButton.addEventListener('click', captureAndEnroll);
    }
});
