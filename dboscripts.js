// public_dbo/scripts.js

const API_BASE_URL = 'http://127.0.0.1:4000/api/dbo'; // Ganti jika port berbeda
const DBO_AUTH_ID = 'STAFF_DBO_001'; // ID untuk header otentikasi DBO

// --- LOGIKA UTAMA ---

/**
 * Mengambil dan menampilkan daftar nasabah.
 */
async function fetchNasabahList() {
    const tableBody = document.getElementById('nasabah-list');
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Memuat data...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: { 'X-DBO-ID': DBO_AUTH_ID }
        });

        if (!response.ok) {
            throw new Error(`Gagal fetch data: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message);
        }

        tableBody.innerHTML = '';
        data.users.forEach(user => {
            const row = tableBody.insertRow();
            
            // Format Saldo
            const formattedSaldo = `Rp ${parseFloat(user.saldo || 0).toLocaleString('id-ID')}`;
            
            // Tentukan status styling
            const rekStatusClass = user.status_rekening === 'Aktif' ? 'status-active' : 'status-inactive';
            const fipStatusClass = user.face_id_status === 'Aktif' ? 'status-active' : 'status-inactive';
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nama}</td>
                <td>${formattedSaldo}</td>
                <td class="${rekStatusClass}">${user.status_rekening || 'Pending'}</td>
                <td class="${fipStatusClass}">${user.face_id_status || 'Belum Daftar'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="openEditModal('${user.id}', ${user.saldo}, '${user.status_rekening || 'Pending'}', '${user.face_id_status || 'Nonaktif'}')">Edit</button>
                </td>
            `;
        });

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
        console.error("Fetch Nasabah Error:", error);
    }
}

/**
 * Membuka Modal Edit dan mengisi data nasabah.
 */
function openEditModal(userId, saldo, statusRekening, statusFIP) {
    document.getElementById('modal-user-id').textContent = userId;
    document.getElementById('edit-user-id-input').value = userId;
    document.getElementById('edit-saldo').value = saldo;
    document.getElementById('edit-status-rekening').value = statusRekening;
    document.getElementById('edit-fip-status').value = statusFIP;

    // Tampilkan Modal (membutuhkan Bootstrap JS)
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

/**
 * Mengirim form update data nasabah.
 */
document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('edit-user-id-input').value;
    const saldo = document.getElementById('edit-saldo').value;
    const status_rekening = document.getElementById('edit-status-rekening').value;
    const face_id_status = document.getElementById('edit-fip-status').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/update_user`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-DBO-ID': DBO_AUTH_ID
            },
            body: JSON.stringify({ userId, saldo, status_rekening, face_id_status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            fetchNasabahList(); // Refresh tabel
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
        } else {
            alert('Gagal memperbarui: ' + result.message);
        }
    } catch (error) {
        alert('Terjadi kesalahan jaringan.');
    }
});

/**
 * Mengirim Pesan ke Nasabah.
 */
document.getElementById('send-message-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetUserId = document.getElementById('targetUserId').value;
    const subject = document.getElementById('subject').value;
    const content = document.getElementById('content').value;
    const statusDiv = document.getElementById('message-status');
    statusDiv.innerHTML = '<span class="text-warning">Mengirim...</span>';

    try {
        const response = await fetch(`${API_BASE_URL}/send_message`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-DBO-ID': DBO_AUTH_ID
            },
            body: JSON.stringify({ targetUserId, subject, content })
        });
        
        const result = await response.json();
        
        if (result.success) {
            statusDiv.innerHTML = `<span class="text-success">${result.message}</span>`;
            document.getElementById('send-message-form').reset();
        } else {
            statusDiv.innerHTML = `<span class="text-danger">Gagal: ${result.message}</span>`;
        }
    } catch (error) {
        statusDiv.innerHTML = '<span class="text-danger">Terjadi kesalahan jaringan saat mengirim pesan.</span>';
    }
});

/**
 * Mengganti bagian konten (Manajemen atau Pesan)
 */
function showSection(sectionId) {
    document.getElementById('user-management-section').style.display = 'none';
    document.getElementById('message-section').style.display = 'none';
    
    document.getElementById(sectionId).style.display = 'block';
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    fetchNasabahList();
    
    // Fungsi agar bisa dipanggil dari sidebar
    window.showSection = showSection;
});
