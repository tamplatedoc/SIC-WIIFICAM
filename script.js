// ===== KONFIGURASI =====
const ESP_IP = "192.168.43.147";   // Ganti dengan IP ESP32-CAM kamu

// ===== ELEMENT DOM =====
const video = document.getElementById('camera');
const loadingSpinner = document.getElementById('loadingSpinner');
const darkModeToggle = document.getElementById('darkModeToggle');
const flashLed = document.getElementById('flashLed');
const rebootBtn = document.getElementById('rebootBtn');

const infoSsid = document.getElementById('info-ssid');
const infoRssi = document.getElementById('info-rssi');
const infoIp = document.getElementById('info-ip');
const infoBattery = document.getElementById('info-battery');

let streamActive = false;
let flashOn = false;

// ===== STREAM CAMERA =====
async function startStream() {
  if (streamActive) return;
  loadingSpinner.classList.remove('hidden');

  video.src = `http://${ESP_IP}:81/stream`;

  video.onload = () => {
    loadingSpinner.classList.add('hidden');
    streamActive = true;
    console.log("Stream started");
  };

  video.onerror = () => {
    loadingSpinner.classList.add('hidden');
    streamActive = false;
    alert("Gagal memuat stream. Pastikan ESP32-CAM aktif di " + ESP_IP);
  };
}

function stopStream() {
  video.src = "";
  streamActive = false;
  console.log("Stream stopped");
}

// ===== DEVICE STATUS =====
async function fetchDeviceStatus() {
  try {
    const response = await fetch(`http://${ESP_IP}/status`);
    const data = await response.json();

    infoSsid.textContent = data.ssid || "N/A";
    infoRssi.textContent = data.rssi || "N/A";
    infoIp.textContent = data.ip || ESP_IP;
    infoBattery.textContent = data.battery || "N/A";
  } catch (err) {
    console.error("Gagal ambil status:", err);
    infoSsid.textContent = "Error";
    infoRssi.textContent = "Error";
    infoIp.textContent = ESP_IP;
    infoBattery.textContent = "Error";
  }
}

// ===== CONTROL =====
async function sendCommand(cmd, value) {
  try {
    await fetch(`http://${ESP_IP}/control?var=${cmd}&val=${value}`);
    console.log(`Command sent: ${cmd}=${value}`);
  } catch (err) {
    console.error("Gagal kirim command:", err);
  }
}

// Flash LED toggle
flashLed.addEventListener("click", () => {
  flashOn = !flashOn;
  sendCommand("flash", flashOn ? 1 : 0);
});

// Reboot device
rebootBtn.addEventListener("click", async () => {
  if (confirm("Yakin mau reboot ESP32-CAM?")) {
    await fetch(`http://${ESP_IP}/reboot`);
  }
});

// ===== DARK MODE =====
darkModeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
});

// ===== AUTO REFRESH STATUS =====
setInterval(fetchDeviceStatus, 5000);
fetchDeviceStatus();

