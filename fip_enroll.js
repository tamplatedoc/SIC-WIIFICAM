// fip_enroll.js

const video = document.getElementById('webcam');
const statusMsg = document.getElementById('status_message');

// Ganti dengan data user yang sebenarnya dari sesi login
const CURRENT_USER_ID = 'nasabah_001'; 
const CURRENT_USER_NAME = 'Budi Santoso';
const API_ENROLL_URL = 'https://142422b71760.ngrok-free.app/enroll'; // Endpoint di backend VBank (Node.js/Express)

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
            });
    } else {
        statusMsg.className = 'status-msg failed';
        statusMsg.textContent = "Error: Browser Anda tidak mendukung akses kamera.";
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
                userId: CURRENT_USER_ID, 
                faceImageData: faceImageData,
                nama: CURRENT_USER_NAME,
                data_diri: {alamat: 'Jl. Merdeka', usia: 25, gender: 'L'} // Data tambahan untuk user
            })
        });

        const data = await response.json();

        if(response.ok && data.success) {
            statusMsg.className = 'status-msg success';
            statusMsg.textContent = "✅ Pendaftaran FIP Berhasil! Anda siap bertransaksi.";
        } else {
            // Handle error dari server (misal: "wajah tidak terdeteksi")
            statusMsg.className = 'status-msg failed';
            statusMsg.textContent = "❌ Pendaftaran Gagal: " + (data.message || "Kesalahan Server.");
        }
    } catch (err) {
        statusMsg.className = 'status-msg failed';
        statusMsg.textContent = "❌ Gagal Terhubung ke Server VBank. Cek koneksi Anda.";
        console.error("Enrollment Fetch Error:", err);
    }
}

// Panggil inisialisasi webcam saat DOM sudah siap
document.addEventListener('DOMContentLoaded', initWebcam);
