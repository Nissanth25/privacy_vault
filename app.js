// Security and Encryption Module
const crypto = {
    async hash(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text.toLowerCase().trim());
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        return await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    },

    async encrypt(data, password) {
        const salt = 'vault-salt-2024';
        const key = await this.deriveKey(password, salt);
        const encoder = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoder.encode(JSON.stringify(data))
        );
        return {
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        };
    },

    async decrypt(encryptedObj, password) {
        const salt = 'vault-salt-2024';
        const key = await this.deriveKey(password, salt);
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(encryptedObj.iv) },
            key,
            new Uint8Array(encryptedObj.data)
        );
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }
};

// Storage Module
const storage = {
    save(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    get(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    
    exists(key) {
        return localStorage.getItem(key) !== null;
    },
    
    clear() {
        localStorage.clear();
    }
};

// Vault Application
const vault = {
    currentPassword: null,
    vaultId: null,

    generateVaultId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let id = '';
        for (let i = 0; i < 12; i++) {
            if (i > 0 && i % 4 === 0) id += '-';
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    },

    async init() {
        if (storage.exists('vaultConfig')) {
            this.showVerifyScreen();
        } else {
            this.showSetupScreen();
        }
    },

    showSetupScreen() {
        this.hideAllScreens();
        document.getElementById('setupScreen').classList.remove('hidden');
    },

    showVerifyScreen() {
        this.hideAllScreens();
        const config = storage.get('vaultConfig');
        const container = document.getElementById('verifyQuestions');
        container.innerHTML = '';
        
        config.questions.forEach((q, i) => {
            const div = document.createElement('div');
            div.className = 'question-group';
            div.innerHTML = `
                <label>${this.getQuestionText(q)}</label>
                <input type="text" id="va${i}" placeholder="Answer ${i + 1}" required>
            `;
            container.appendChild(div);
        });
        
        document.getElementById('verifyScreen').classList.remove('hidden');
    },

    showPasswordScreen() {
        this.hideAllScreens();
        document.getElementById('passwordScreen').classList.remove('hidden');
        document.getElementById('passwordError').textContent = '';
    },

    showVaultScreen() {
        this.hideAllScreens();
        document.getElementById('vaultScreen').classList.remove('hidden');
        this.loadVaultData();
    },

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById('errorMsg').textContent = '';
    },

    getQuestionText(value) {
        const questions = {
            pet: "What was your first pet's name?",
            city: "In what city were you born?",
            school: "What is your elementary school name?",
            teacher: "What was your favorite teacher's name?",
            mother: "What is your mother's maiden name?",
            book: "What is your favorite book?",
            food: "What is your favorite food?",
            color: "What is your favorite color?",
            car: "What was your first car model?",
            street: "What street did you grow up on?",
            friend: "What is your best friend's name?",
            movie: "What is your favorite movie?"
        };
        return questions[value] || value;
    },

    async handleSetup(e) {
        e.preventDefault();
        const questions = [
            document.getElementById('q1').value,
            document.getElementById('q2').value,
            document.getElementById('q3').value
        ];
        const answers = [
            document.getElementById('a1').value,
            document.getElementById('a2').value,
            document.getElementById('a3').value
        ];
        const password = document.getElementById('setupPassword').value;

        if (new Set(questions).size !== 3) {
            document.getElementById('errorMsg').textContent = 'Please select 3 different questions';
            return;
        }

        const hashedAnswers = await Promise.all(answers.map(a => crypto.hash(a)));
        const hashedPassword = await crypto.hash(password);
        const vaultId = this.generateVaultId();

        storage.save('vaultConfig', {
            vaultId,
            questions,
            answers: hashedAnswers,
            password: hashedPassword
        });
        
        this.vaultId = vaultId;

        storage.save('vaultData', await crypto.encrypt({ notes: [], files: [] }, password));
        
        this.currentPassword = password;
        this.showVaultScreen();
    },

    async handleVerify(e) {
        e.preventDefault();
        const config = storage.get('vaultConfig');
        const answers = [
            document.getElementById('va0').value,
            document.getElementById('va1').value,
            document.getElementById('va2').value
        ];

        const hashedAnswers = await Promise.all(answers.map(a => crypto.hash(a)));
        const match = hashedAnswers.every((h, i) => h === config.answers[i]);

        if (match) {
            this.showPasswordScreen();
        } else {
            document.getElementById('errorMsg').textContent = 'Incorrect answers. Access denied.';
            setTimeout(() => document.getElementById('errorMsg').textContent = '', 3000);
        }
    },

    async handlePassword(e) {
        e.preventDefault();
        const password = document.getElementById('vaultPassword').value;
        const config = storage.get('vaultConfig');
        const hashedPassword = await crypto.hash(password);

        if (hashedPassword === config.password) {
            this.currentPassword = password;
            this.showVaultScreen();
        } else {
            document.getElementById('passwordError').textContent = 'Incorrect password. Access denied.';
            setTimeout(() => document.getElementById('passwordError').textContent = '', 3000);
        }
    },

    async loadVaultData() {
        try {
            const config = storage.get('vaultConfig');
            this.vaultId = config.vaultId || 'LEGACY-VAULT';
            document.getElementById('vaultIdDisplay').textContent = this.vaultId;
            
            const encryptedData = storage.get('vaultData');
            const data = await crypto.decrypt(encryptedData, this.currentPassword);
            
            const notesContainer = document.getElementById('notesContainer');
            notesContainer.innerHTML = '<h4>Notes:</h4>';
            data.notes.forEach((note, i) => {
                const div = document.createElement('div');
                div.className = 'vault-item';
                div.innerHTML = `
                    <p>${note}</p>
                    <button onclick="vault.deleteNote(${i})">Delete</button>
                `;
                notesContainer.appendChild(div);
            });

            const filesContainer = document.getElementById('filesContainer');
            filesContainer.innerHTML = '<h4>Files:</h4>';
            data.files.forEach((file, i) => {
                const div = document.createElement('div');
                div.className = 'vault-item';
                div.innerHTML = `
                    <p>${file.name} (${(file.size / 1024).toFixed(2)} KB)</p>
                    <button onclick="vault.downloadFile(${i})">Download</button>
                    <button onclick="vault.deleteFile(${i})">Delete</button>
                `;
                filesContainer.appendChild(div);
            });
        } catch (error) {
            console.error('Failed to load vault data');
        }
    },

    async addNote() {
        const noteInput = document.getElementById('noteInput');
        const note = noteInput.value.trim();
        if (!note) return;

        const encryptedData = storage.get('vaultData');
        const data = await crypto.decrypt(encryptedData, this.currentPassword);
        data.notes.push(note);
        storage.save('vaultData', await crypto.encrypt(data, this.currentPassword));
        
        noteInput.value = '';
        this.loadVaultData();
    },

    async addFile() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const encryptedData = storage.get('vaultData');
            const data = await crypto.decrypt(encryptedData, this.currentPassword);
            data.files.push({
                name: file.name,
                size: file.size,
                type: file.type,
                content: e.target.result
            });
            storage.save('vaultData', await crypto.encrypt(data, this.currentPassword));
            
            fileInput.value = '';
            this.loadVaultData();
        };
        reader.readAsDataURL(file);
    },

    async deleteNote(index) {
        const encryptedData = storage.get('vaultData');
        const data = await crypto.decrypt(encryptedData, this.currentPassword);
        data.notes.splice(index, 1);
        storage.save('vaultData', await crypto.encrypt(data, this.currentPassword));
        this.loadVaultData();
    },

    async deleteFile(index) {
        const encryptedData = storage.get('vaultData');
        const data = await crypto.decrypt(encryptedData, this.currentPassword);
        data.files.splice(index, 1);
        storage.save('vaultData', await crypto.encrypt(data, this.currentPassword));
        this.loadVaultData();
    },

    async downloadFile(index) {
        const encryptedData = storage.get('vaultData');
        const data = await crypto.decrypt(encryptedData, this.currentPassword);
        const file = data.files[index];
        
        const a = document.createElement('a');
        a.href = file.content;
        a.download = file.name;
        a.click();
    },

    logout() {
        this.currentPassword = null;
        this.showVerifyScreen();
    },

    switchUser() {
        if (confirm('⚠️ This will clear the current vault from this browser and let you create a new one or import a different vault.\n\nThe current vault data will be DELETED from this browser.\n\nContinue?')) {
            storage.clear();
            this.showSetupScreen();
        }
    },

    copyVaultId() {
        navigator.clipboard.writeText(this.vaultId).then(() => {
            alert('✅ Vault ID copied to clipboard!');
        }).catch(() => {
            prompt('Copy your Vault ID:', this.vaultId);
        });
    },

    // Export vault for cross-device access
    exportVault() {
        const config = storage.get('vaultConfig');
        const data = storage.get('vaultData');
        
        if (!config || !data) {
            alert('No vault data to export!');
            return;
        }

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            config: config,
            data: data
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `privacy-vault-${Date.now()}.vault`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('✅ Vault exported! Transfer this file to another device and import it there.');
    },

    // Import vault from another device
    async importVault(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (!importData.config || !importData.data) {
                throw new Error('Invalid vault file format');
            }

            // Check if vault already exists
            if (storage.exists('vaultConfig')) {
                if (!confirm('⚠️ A vault already exists on this device. Importing will REPLACE it. Continue?')) {
                    return;
                }
            }

            // Save imported data
            storage.save('vaultConfig', importData.config);
            storage.save('vaultData', importData.data);

            alert('✅ Vault imported successfully! Now verify your identity to access.');
            this.showVerifyScreen();
        } catch (error) {
            alert('❌ Failed to import vault: ' + error.message);
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    vault.init();
    
    document.getElementById('setupForm').addEventListener('submit', (e) => vault.handleSetup(e));
    document.getElementById('verifyForm').addEventListener('submit', (e) => vault.handleVerify(e));
    document.getElementById('passwordForm').addEventListener('submit', (e) => vault.handlePassword(e));
    
    // Import file handler
    document.getElementById('importFile').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            vault.importVault(e.target.files[0]);
        }
    });
});
