# 🔐 Question-Based Secure Privacy Vault

A zero-knowledge privacy vault that requires NO email, NO login, NO OTP, and NO user accounts.

## 🎯 One-Line Description
"This project secures personal data using security questions and password-based encryption without relying on email or third-party authentication."

## 🚀 How to Run

1. Open `index.html` in any modern web browser
2. No server or installation required
3. Works completely offline after first load

## 🔁 System Flow

### First-Time Setup
1. User opens the website
2. System displays security questions
3. User selects 3 questions and provides answers
4. Answers are hashed using SHA-256
5. User creates a password
6. Password is hashed and stored
7. Vault is ready to store encrypted data

### Access From Any Device
1. User opens the same website
2. System asks the same security questions
3. User enters answers
4. If correct → password screen appears
5. If password correct → vault unlocks and data is decrypted
6. If incorrect → access denied

## 🛡️ Security Features

### Triple-Layer Protection
1. **Security Questions** - 3 user-selected questions
2. **Answer Verification** - SHA-256 hashed answers
3. **Password Authentication** - SHA-256 hashed password

### Encryption
- **Algorithm**: AES-GCM (256-bit)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Data**: All notes and files encrypted before storage

### Zero-Knowledge Architecture
- No server-side storage
- All data stored in browser's localStorage
- Encryption/decryption happens client-side
- No personal information collected

## 🔒 What This System Does NOT Use

❌ Email ID  
❌ Google / social login  
❌ OTP or two-step verification  
❌ Account recovery mechanisms  
❌ User accounts or databases  
❌ Server-side processing  

## 📁 Features

- Store encrypted private notes
- Upload and encrypt files
- Download decrypted files
- Delete notes and files
- Logout and re-authenticate

## ⚠️ Important Notes

1. **Data Storage**: All data is stored in browser's localStorage (typically 5-10MB limit)
2. **Data Persistence**: Clearing browser data will DELETE all vault data permanently
3. **No Recovery**: If you forget answers or password, data CANNOT be recovered
4. **Browser-Specific**: Data is tied to the specific browser and device
5. **Backup**: Export important data regularly as there's no cloud backup

## 🔧 Technical Stack

- **Frontend**: Pure HTML, CSS, JavaScript
- **Encryption**: Web Crypto API
- **Storage**: localStorage
- **No Dependencies**: No external libraries required

## 🏗️ Architecture

```
User Input (Questions + Answers + Password)
    ↓
SHA-256 Hashing
    ↓
Verification Layer
    ↓
AES-GCM Encryption (PBKDF2 Key Derivation)
    ↓
localStorage (Encrypted Data)
```

## 🔐 Security Best Practices

1. Use strong, unique answers
2. Create a complex password (min 6 characters, recommended 12+)
3. Don't share your questions/answers
4. Use on trusted devices only
5. Clear browser cache on public computers after use

## 📊 Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Opera: ✅ Full support

Requires modern browser with Web Crypto API support.

## 🎓 Viva Questions & Answers

**Q: How is this secure without a server?**  
A: All encryption happens client-side using Web Crypto API. Data never leaves the device unencrypted.

**Q: What if someone clears localStorage?**  
A: All data is permanently lost. This is a trade-off for zero-knowledge architecture.

**Q: Can you recover forgotten passwords?**  
A: No. This is by design - true zero-knowledge means no recovery mechanism.

**Q: How do you prevent brute force attacks?**  
A: PBKDF2 with 100,000 iterations makes each attempt computationally expensive. Additionally, data is client-side only.

**Q: Why not use a database?**  
A: To maintain zero-knowledge and no-account principles. No server = no data breach risk.

## 📝 License

Free to use for educational and personal projects.
