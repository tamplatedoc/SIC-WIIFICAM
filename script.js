const video = document.getElementById('camera');
const statusIndicator = document.getElementById('status');
const gallery = document.getElementById('gallery-grid');
const ctaOverlay = document.querySelector('.cta-overlay'); // Kunci: Seleksi CTA
const darkModeToggle = document.getElementById('darkModeToggle');
const htmlElement = document.querySelector('html');
const flashLedBtn = document.getElementById('flashLedBtn');
const infoFps = document.getElementById('info-fps'); 
const loadingSpinner = document.getElementById('loadingSpinner'); // BARU: Elemen loading spinner/overlay
const cameraSettings = ['quality', 'brightness', 'contrast']; 

// BARU: Elemen untuk Kartu Status Perangkat
const infoSsid = document.getElementById('info-ssid');
const infoIp = document.getElementById('info-ip');
const infoRssi = document.getElementById('info-rssi');
const infoBattery = document.getElementById('info-battery'); // Meskipun ESP32 tidak punya baterai, ini untuk fleksibilitas

// Variabel State Global
let streamActive = false;
let zoomLevel = 1;
let nightMode = false;
let flashLedState = 0; // 0=OFF, 1=ON
const ESP_IP = '192.168.1.77'; // Pastikan ini adalah IP ESP32-CAM Anda yang benar

// Variabel FPS Counter
let lastTime = 0;
let frameCount = 0;
let fpsInterval = null; // Untuk menyimpan referensi interval
let statusInterval = null; // BARU: Untuk menyimpan referensi interval status

// --- UTILITY FUNGSI NOTIFIKASI (SWEETALERT2) ---

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

// --- FUNGSI BARU: FPS COUNTER ---

/**
 * Memperbarui nilai FPS di UI.
 */
function updateFPS() {
    const currentTime = performance.now();
    frameCount++;

    // Hitung FPS setiap 1 detik
    if (currentTime - lastTime >= 1000) {
        const fps = Math.round(frameCount / ((currentTime - lastTime) / 1000));
        infoFps.textContent = `${fps} FPS`;
        frameCount = 0;
        lastTime = currentTime;
    }
    
    // Ulangi pengukuran jika stream masih aktif
    if (streamActive) {
        fpsInterval = requestAnimationFrame(updateFPS);
    } else {
        infoFps.textContent = '0 FPS';
    }
}

// --- FUNGSI BARU: FETCH DEVICE STATUS ---

/**
 * Mengambil data status perangkat (IP, SSID, RSSI, Baterai) dari ESP32
 */
async function fetchDeviceStatus() {
    try {
        const response = await fetch(`http://${ESP_IP}/status`);

        if (response.ok) {
            const data = await response.json();
            
            // Perbarui elemen UI dengan data dari ESP32
            infoSsid.textContent = data.ssid || 'N/A';
            infoIp.textContent = ESP_IP; // IP sudah diketahui
            infoRssi.textContent = (data.rssi !== undefined && data.rssi !== null) ? `${data.rssi} dBm` : 'N/A';
            
            // Asumsi ESP32 tidak punya baterai, namun dipertahankan untuk fleksibilitas
            infoBattery.textContent = (data.battery !== undefined && data.battery !== null) ? `${data.battery}%` : 'AC Power';

        } else {
            console.warn("Gagal mengambil status perangkat. Pastikan endpoint /status ada.");
            // Set status ke N/A jika gagal
            infoSsid.textContent = 'N/A';
            infoRssi.textContent = 'N/A';
        }
    } catch (error) {
        // Jika ada kesalahan jaringan (misalnya ESP offline)
        console.error("Kesalahan jaringan saat mengambil status:", error);
        infoSsid.textContent = 'N/A';
        infoRssi.textContent = 'N/A';
    }
}


// --- FUNGSI UTILITY DASHBOARD ---

function updateStreamState(isActive) {
    streamActive = isActive;
    
    // Matikan/Nyalakan FPS Counter
    if (isActive) {
        lastTime = performance.now();
        frameCount = 0;
        fpsInterval = requestAnimationFrame(updateFPS);
        // Mulai interval pembaruan status
        if (!statusInterval) {
            fetchDeviceStatus(); // Panggil sekali saat start
            statusInterval = setInterval(fetchDeviceStatus, 5000); 
        }
    } else {
        // Hentikan FPS Counter
        if (fpsInterval) {
            cancelAnimationFrame(fpsInterval);
            fpsInterval = null;
        }
        infoFps.textContent = '0 FPS';
        
        // Hentikan interval pembaruan status
        if (statusInterval) {
            clearInterval(statusInterval);
            statusInterval = null;
        }
    }

    // Mengatur visibilitas tombol CTA
    ctaOverlay.classList.toggle('hidden', isActive);
    
    // Update Status Indicator
    statusIndicator.innerHTML = isActive ? 
        '<i class="fas fa-check-circle"></i> Connected' : 
        '<i class="fas fa-times-circle"></i> Disconnected';
        
    statusIndicator.classList.toggle('connected', isActive);
    statusIndicator.classList.toggle('disconnected', !isActive);
    statusIndicator.classList.toggle('text-bg-danger', !isActive);
}

async function startStream() {
    if (streamActive) return; 
    
    // 1. Tampilkan Loading Spinner saat proses dimulai
    loadingSpinner.classList.remove('hidden');

    try {
        // --- PERUBAHAN UTAMA UNTUK ESP32-CAM NYATA ---
        
        // Coba koneksi ke ESP32: Gunakan URL stream MJPEG
        video.src = `http://${ESP_IP}:81/stream`;
        
        // Listener untuk mengetahui kapan stream dimulai
        video.onload = () => {
            // 2. Sembunyikan Loading Spinner saat berhasil
            loadingSpinner.classList.add('hidden');
            updateStreamState(true);
            Toast.fire({ icon: 'success', title: 'Stream dimulai!' });
        };
        
        // Listener jika terjadi error (misalnya IP salah atau ESP mati)
        video.onerror = () => {
             // 3. Sembunyikan Loading Spinner saat gagal
            loadingSpinner.classList.add('hidden');
             // Jika terjadi error, kembali ke status disconnected
            updateStreamState(false); 
            console.error("Error loading ESP32 stream.");
            Swal.fire({
                icon: 'error',
                title: 'Koneksi Gagal',
                text: 'Gagal memuat stream. Pastikan ESP32-CAM aktif di IP: ' + ESP_IP,
                confirmButtonColor: '#d33'
            });
        };

        video.style.filter = "none";
        nightMode = false;

        /* // Kode simulasi sebelumnya (untuk referensi):
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        video.srcObject = stream;
        updateStreamState(true); 
        Toast.fire({ icon: 'success', title: 'Stream dimulai (Simulasi)!' });
        */
        
    } catch (error) {
        console.error("Error starting stream:", error);
        // Sembunyikan Loading Spinner saat terjadi exception
        loadingSpinner.classList.add('hidden');
        Swal.fire({
            icon: 'error',
            title: 'Koneksi Gagal',
            text: 'Gagal mengakses kamera.',
            confirmButtonColor: '#d33'
        });
        updateStreamState(false);
    }
}

function stopStream() {
    // Untuk ESP32 nyata, hentikan dengan mengosongkan src
    video.src = ''; 
    video.load(); // Memastikan video berhenti memuat data
    
    // Jika menggunakan simulasi kamera lokal:
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    
    updateStreamState(false); // <--- Memanggil updateStreamState(false) untuk SHOW CTA kembali
    zoomLevel = 1;
    video.style.transform = `scale(1)`;
    video.style.filter = "none";
    nightMode = false;
    Toast.fire({ icon: 'warning', title: 'Stream dihentikan.' });
}

function togglePlay() {
    // Pada ESP32 stream (MJPEG), play/pause tidak selalu didukung dengan baik
    // di elemen <video> standar. Kita akan tetap menggunakan logika pause/play
    // untuk menghentikan gambar pada UI.
    if (!streamActive) return;
    if (video.paused) {
        video.play();
        // Saat play/pause, kita perlu me-reset FPS counter agar akurat
        if (!video.paused) {
            lastTime = performance.now();
            frameCount = 0;
            if (!fpsInterval) fpsInterval = requestAnimationFrame(updateFPS);
        }
        Toast.fire({ icon: 'info', title: 'Video dilanjutkan.' });
    } else {
        video.pause();
        if (fpsInterval) {
            cancelAnimationFrame(fpsInterval);
            fpsInterval = null;
        }
        Toast.fire({ icon: 'info', title: 'Video dijeda.' });
    }
}

function toggleDarkMode() {
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    darkModeToggle.innerHTML = newTheme === 'dark' ? 
        '<i class="fas fa-sun"></i> <span class="d-none d-sm-inline ms-1">Light Mode</span>' : 
        '<i class="fas fa-moon"></i> <span class="d-none d-sm-inline ms-1">Dark Mode</span>';
}

function takeSnapshot() {
    if (!streamActive || video.paused) {
        Toast.fire({ icon: 'error', title: 'Gagal: Stream tidak aktif atau dijeda.' });
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imgURL = canvas.toDataURL('image/jpeg', 0.9); 
    const col = document.createElement('div');
    col.className = 'col';
    
    const img = document.createElement('img');
    img.src = imgURL;
    img.className = 'img-fluid';
    img.alt = `Snapshot-${Date.now()}`;
    
    col.appendChild(img);
    gallery.prepend(col);

    const a = document.createElement('a');
    a.href = imgURL;
    a.download = `ESP32_Snapshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
    a.click();
    
    Toast.fire({ icon: 'success', title: 'Snapshot berhasil diambil!' });
}

function zoomIn() {
    if (!streamActive) return;
    zoomLevel = Math.min(3, zoomLevel + 0.2);
    video.style.transform = `scale(${zoomLevel})`;
    Toast.fire({ icon: 'info', title: 'Zoom In' });
}
function zoomOut() {
    if (!streamActive) return;
    zoomLevel = Math.max(1, zoomLevel - 0.2);
    video.style.transform = `scale(${zoomLevel})`;
    Toast.fire({ icon: 'info', title: 'Zoom Out' });
}

function toggleNightMode() {
    if (!streamActive) {
        Toast.fire({ icon: 'warning', title: 'Nyalakan stream untuk Night Mode.' });
        return;
    }
    nightMode = !nightMode;
    
    video.style.filter = nightMode ? 
        "brightness(0.5) contrast(1.2) sepia(0.3) hue-rotate(180deg)" : 
        "none"; 
    
    if (nightMode) {
        Toast.fire({ icon: 'success', title: 'Night Mode ON' });
    } else {
        updateRangeValue('brightness');
        updateRangeValue('contrast');
        Toast.fire({ icon: 'info', title: 'Night Mode OFF' });
    }
}

function sendCommand(cmd, value, persist = false) {
    // --- PANGGILAN API NYATA KE ESP32-CAM ---
    fetch(`http://${ESP_IP}/control?var=${cmd}&val=${value}`)
        .then(response => {
            if (response.ok) {
                if (persist) {
                    localStorage.setItem(`cam_setting_${cmd}`, value);
                }
                console.log(`[Command Sent] ${cmd} set to: ${value} (Persist: ${persist})`);
                Toast.fire({ icon: 'success', title: `${cmd} diatur ke ${value}` });
            } else {
                throw new Error("ESP32 responded with non-200 status.");
            }
        })
        .catch(error => {
            console.error("Error sending command:", error);
            Toast.fire({ icon: 'error', title: `Gagal mengirim perintah ${cmd}.` });
        });
}

function updateRangeValue(id) {
    const slider = document.getElementById(id);
    const valueSpan = document.getElementById(id + 'Value');
    valueSpan.textContent = slider.value;
    
    if ((id === 'brightness' || id === 'contrast') && !nightMode) {
        const currentBrightness = document.getElementById('brightness').value;
        const currentContrast = document.getElementById('contrast').value;
        
        // Atur filter CSS untuk pratinjau lokal
        const cssBrightness = 1 + (currentBrightness * 0.25); 
        const cssContrast = 1 + (currentContrast * 0.5); 
        video.style.filter = `brightness(${cssBrightness}) contrast(${cssContrast})`;
        
        // Kirim perintah ke ESP32
        sendCommand(id, slider.value);
    } else if (id === 'quality') {
        // Kirim perintah ke ESP32
        sendCommand(id, slider.value);
    }
}

function toggleFlashLed() {
    flashLedState = flashLedState === 0 ? 1 : 0;
    
    sendCommand('flash', flashLedState);
    
    if (flashLedState === 1) {
        flashLedBtn.innerHTML = '<i class="fas fa-times-circle me-1"></i> Turn OFF Flash LED';
        flashLedBtn.classList.remove('btn-warning');
        flashLedBtn.classList.add('btn-secondary');
        Toast.fire({ icon: 'success', title: 'Flash LED menyala.' });
    } else {
        flashLedBtn.innerHTML = '<i class="fas fa-bolt me-1"></i> Turn ON Flash LED';
        flashLedBtn.classList.remove('btn-secondary');
        flashLedBtn.classList.add('btn-warning');
        Toast.fire({ icon: 'info', title: 'Flash LED mati.' });
    }
}

function changeResolution(value) {
    sendCommand('framesize', value);
    Swal.fire({
        icon: 'warning',
        title: 'Resolusi Diubah',
        text: `Resolusi diatur ke ${value}. Stream **perlu di-restart** agar perubahan terlihat.`,
        showConfirmButton: false,
        timer: 3000
    });
}

function confirmReboot() {
    Swal.fire({
        title: 'Konfirmasi Reboot',
        text: "Anda yakin ingin me-reboot perangkat ESP32?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Reboot Sekarang!'
    }).then((result) => {
        if (result.isConfirmed) {
            rebootDevice();
        }
    });
}

function rebootDevice() {
    // --- PANGGILAN API NYATA KE ESP32-CAM ---
    fetch(`http://${ESP_IP}/reboot`)
        .then(() => {
            stopStream();
            Swal.fire({
                title: 'Rebooting...',
                html: 'Perangkat sedang me-restart. Tunggu sekitar 5 detik...',
                timer: 5000,
                timerProgressBar: true,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    Toast.fire({ icon: 'success', title: 'Reboot Selesai. Siap digunakan.' });
                }
            });
            console.log("[Command Sent] REBOOT DEVICE");
        })
        .catch(error => {
            console.error("Reboot command failed:", error);
            Toast.fire({ icon: 'error', title: 'Gagal mengirim perintah reboot.' });
        });
}

// --- INITIATOR ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Dark Mode
    const storedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    htmlElement.setAttribute('data-bs-theme', storedTheme);
    toggleDarkMode(); 
    
    // 2. Muat Pengaturan Kamera yang Persisten (localStorage)
    cameraSettings.forEach(setting => {
        const storedValue = localStorage.getItem(`cam_setting_${setting}`);
        if (storedValue !== null) {
            const slider = document.getElementById(setting);
            if (slider) {
                slider.value = storedValue;
                // Kirim perintah (simulasi)
                console.log(`[Load Persist] ${setting} set to: ${storedValue}`);
                // Kirim perintah nyata ke ESP32 saat inisialisasi
                sendCommand(setting, storedValue);
            }
        }
    });
    
    // 3. Set initial stream state dan update slider values
    updateStreamState(false); // Memastikan CTA terlihat saat halaman dimuat
    updateRangeValue('quality');
    updateRangeValue('brightness');
    updateRangeValue('contrast');
});
