# 🚀 SmartASP Deployment Checklist for CSR Portal

**Domain**: https://csr.darjaah-hub.com  
**SQL Server**: SQL1002.site4now.net  
**Database**: db_ab7671_csr

---

## ✅ **Pre-Deployment Steps (On Your Local Machine)**

### **Step 1: Build the Application** ⏱️ ~5 minutes

Run the preparation script:

```powershell
.\prepare-production.ps1
```

**This will:**
- ✅ Clean previous builds
- ✅ Install dependencies
- ✅ Generate Prisma Client
- ✅ Build Next.js application
- ✅ Create uploads folder

**Expected output**: "Preparation Complete!"

---

## 📤 **Step 2: Upload to SmartASP** ⏱️ ~15-20 minutes

### **Files to Upload via SmartASP File Manager**

Based on your screenshot, upload to: `/home/darjaah123-001/www/csr`

#### **📁 Folders to Upload** (Select entire folders)
```
✅ .next/              (~50-100 MB)
✅ node_modules/       (~200-500 MB) - This will take the longest
✅ public/             (~1-5 MB)
✅ prisma/             (~1 MB)
✅ uploads/            (empty folder - create if needed)
```

#### **📄 Files to Upload**
```
✅ server.js
✅ package.json
✅ package-lock.json
✅ next.config.js
✅ web.config
✅ production.env  → RENAME to .env after upload
```

### **Upload Tips**:
- Upload `node_modules/` first (largest, takes longest)
- Use FTP client (FileZilla) for faster upload if SmartASP file manager is slow
- **IMPORTANT**: After uploading `production.env`, rename it to `.env`

---

## ⚙️ **Step 3: SmartASP Node.js Configuration** ⏱️ ~3 minutes

### **Navigate to**: SmartASP Control Panel → Node.js

Configure the following:

| Setting | Value |
|---------|-------|
| **Node.js Version** | v18 or higher |
| **Application URL** | https://csr.darjaah-hub.com |
| **Application Startup File** | `server.js` |
| **Application Directory** | `/home/darjaah123-001/www/csr` |
| **Memory Limit** | 1024 MB (1 GB) recommended |
| **Environment** | Production |

### **Environment Variables** (Set in SmartASP Panel)

If SmartASP allows setting environment variables in the panel:

```
NODE_ENV=production
PORT=3000
```

### **Enable WebSocket Support**
- ✅ Check "Enable WebSockets" (Required for Socket.IO)

---

## 🗄️ **Step 4: Database Setup** ⏱️ ~5 minutes

### **Option A: Using SmartASP Console/Terminal (Recommended)**

If SmartASP provides SSH/Terminal access:

```bash
# Navigate to application directory
cd /home/darjaah123-001/www/csr

# Generate Prisma Client
npx prisma generate

# Push database schema to SQL Server
npx prisma db push

# Optional: Seed database with initial data
npx prisma db seed
```

### **Option B: From Local Machine (If No SSH)**

Run these commands locally, they will affect the production database:

```powershell
# Set production database URL
$env:DATABASE_URL="sqlserver://SQL1002.site4now.net:1433;database=db_ab7671_csr;user=db_ab7671_csr_admin;password=INse14ron;encrypt=true;trustServerCertificate=true"

# Push schema
npx prisma db push

# Seed database
npx prisma db seed
```

---

## 🎬 **Step 5: Start the Application** ⏱️ ~2 minutes

### **In SmartASP Control Panel:**

1. Go to **Node.js Applications**
2. Find your application (`csr.darjaah-hub.com`)
3. Click **"Start"** or **"Restart"**

### **Verify Application is Running:**

Check the status indicator in SmartASP panel:
- ✅ **Green/Running** = Success!
- ❌ **Red/Stopped** = Check error logs

---

## 🧪 **Step 6: Post-Deployment Testing** ⏱️ ~5 minutes

### **Test 1: Homepage**
```
URL: https://csr.darjaah-hub.com
Expected: Homepage loads correctly
```

### **Test 2: Login**
```
URL: https://csr.darjaah-hub.com/auth/signin
Test with:
- admin@csr.com / Admin@123
- agent@csr.com / Agent@123
Expected: Successful login and redirect
```

### **Test 3: Socket.IO Connection**
```
1. Login as admin
2. Open browser console (F12)
3. Look for: "✅ Connected to orders namespace"
4. Check: Status shows "Connected" (not "Connecting...")
```

### **Test 4: Real-Time Features**
```
1. Open admin dashboard in one browser
2. Open agent dashboard in another (or incognito)
3. Verify:
   ✅ Agent shows as "Online" on admin dashboard
   ✅ Order grid updates in real-time
   ✅ Chat messages send/receive instantly
```

### **Test 5: Chat Functionality**
```
1. Click chat icon on admin dashboard
2. Send message to an agent
3. Verify:
   ✅ Message appears instantly
   ✅ Agent receives notification
   ✅ Agent can reply
   ✅ File attachments work
```

---

## 🔍 **Troubleshooting Guide**

### **❌ Problem: Application Not Starting**

**Check**:
1. SmartASP error logs (usually in control panel)
2. Verify `server.js` is in root directory
3. Ensure Node.js version is v18+
4. Check `.env` file exists and is named correctly (not `production.env`)

**Solution**:
```bash
# Via SSH, check if process is running
ps aux | grep node

# Check for port conflicts
netstat -tlnp | grep :3000
```

### **❌ Problem: Socket.IO Shows "Disconnected"**

**Check**:
1. WebSocket support is enabled in SmartASP
2. `web.config` file is uploaded
3. CORS origin in `.env` matches domain exactly

**Solution**: Update `server.js` CORS settings (line ~20):
```javascript
const io = new Server(server, {
  cors: {
    origin: ["https://csr.darjaah-hub.com"],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

### **❌ Problem: Database Connection Failed**

**Check**:
1. SQL Server is accessible from SmartASP
2. Database credentials are correct in `.env`
3. Firewall allows connections to `SQL1002.site4now.net:1433`

**Solution**: Test connection string:
```powershell
# Test locally
npx prisma db pull
```

### **❌ Problem: Pages Return 404**

**Check**:
1. `.next` folder is uploaded completely
2. `next.config.js` exists
3. Application directory path is correct

**Solution**: Restart application in SmartASP panel

### **❌ Problem: Login Not Working**

**Check**:
1. `NEXTAUTH_URL` in `.env` matches your domain exactly
2. `NEXTAUTH_SECRET` is set
3. Database has user records (run seed script)

**Solution**: Check session in browser console:
```javascript
// In browser console
console.log(document.cookie);
```

---

## 📋 **Final Verification Checklist**

Before marking deployment as complete:

- [ ] Homepage loads at https://csr.darjaah-hub.com
- [ ] Login works for admin and agents
- [ ] Admin dashboard loads correctly
- [ ] Agent dashboard loads correctly
- [ ] Socket.IO shows "Connected" (not "Connecting...")
- [ ] Agent status updates in real-time (online/offline)
- [ ] Order grid displays data
- [ ] Order grid updates without refresh
- [ ] Chat widget opens
- [ ] Chat messages send/receive in real-time
- [ ] File attachments upload successfully
- [ ] No console errors in browser (F12)
- [ ] SSL certificate is valid (HTTPS shows padlock)

---

## 🎯 **Quick Reference: SmartASP File Structure**

```
/home/darjaah123-001/www/csr/
├── .next/                  ← Production build
├── node_modules/           ← All dependencies
├── public/                 ← Static files
├── prisma/                 ← Database schema
├── uploads/                ← File uploads
├── server.js               ← Application entry point
├── package.json            ← Dependencies list
├── next.config.js          ← Next.js config
├── web.config              ← IIS configuration
└── .env                    ← Environment variables (renamed from production.env)
```

---

## 📞 **Support Contacts**

**SmartASP Support**:
- Email: support@smartasp.net
- Control Panel: https://panel.smartasp.net

**Database Issues**:
- SQL Server: SQL1002.site4now.net
- Database: db_ab7671_csr

---

## 🔒 **Security Reminders**

Before going live:

- ✅ Change default passwords in database (admin@csr.com, agent@csr.com)
- ✅ `NEXTAUTH_SECRET` is unique (already set)
- ✅ HTTPS is enabled (SmartASP handles this)
- ✅ `.env` file is NOT publicly accessible
- ✅ Database credentials are secure
- ✅ CORS is configured for your domain only

---

## 📊 **Monitoring**

**After deployment, monitor**:
- Application uptime (SmartASP panel)
- Error logs (SmartASP panel)
- Database size and performance
- User login issues
- Real-time connection status

---

**🎉 You're ready to deploy! Follow the steps above and you'll be live in under 30 minutes.**

---

**Last Updated**: October 27, 2025  
**Version**: 1.0.0  
**Deployment Target**: SmartASP (site4now.net)



