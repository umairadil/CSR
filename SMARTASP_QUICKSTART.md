# 🚀 SmartASP Deployment - Quick Start Guide

## Prerequisites
- SmartASP hosting account with Node.js support
- SQL Server database credentials from SmartASP
- FTP/SFTP access to your SmartASP server
- Your production domain

---

## Step-by-Step Deployment

### **Step 1: Prepare Local Build** (5 minutes)

1. **Copy environment template**
   ```powershell
   Copy-Item env.production.template .env.production
   ```

2. **Edit `.env.production`** with your SmartASP credentials:
   - Update `DATABASE_URL` with SQL Server details
   - Update `NEXTAUTH_URL` with your domain
   - Generate and set `NEXTAUTH_SECRET`

3. **Run preparation script**
   ```powershell
   .\prepare-production.ps1
   ```

   This will:
   - Clean previous builds
   - Install dependencies
   - Generate Prisma Client
   - Build the application
   - Create necessary folders

---

### **Step 2: Upload to SmartASP** (15-30 minutes)

#### **Using FTP Client (FileZilla, WinSCP, etc.)**

1. **Connect to SmartASP FTP**:
   - Host: `ftp.your-domain.smartasp.net`
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21 (FTP) or 22 (SFTP)

2. **Navigate to application directory**:
   - Usually `/httpdocs` or `/public_html`

3. **Upload these folders/files**:
   ```
   ✅ .next/
   ✅ node_modules/
   ✅ public/
   ✅ prisma/
   ✅ uploads/ (empty folder)
   ✅ server.js
   ✅ package.json
   ✅ package-lock.json
   ✅ next.config.js
   ✅ .env.production (rename to .env after upload)
   ```

4. **After upload, rename `.env.production` to `.env`** on the server

---

### **Step 3: Configure SmartASP** (10 minutes)

#### **Option A: Using SSH (if available)**

```bash
# SSH into your server
ssh your-username@your-domain.smartasp.net

# Navigate to application directory
cd /path/to/your/app

# Install production dependencies
npm ci --production

# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: Seed database
npx prisma db seed

# Start the application
node server.js
```

#### **Option B: Using SmartASP Control Panel**

1. **Log into SmartASP Control Panel**

2. **Go to Node.js Application Settings**:
   - **Node Version**: Select v18 or higher
   - **Entry Point**: Set to `server.js`
   - **Environment**: Set to `production`
   - **Memory Limit**: At least 512MB (recommended: 1GB)

3. **Set Environment Variables** (from your `.env` file):
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `DATABASE_URL` = [Your SQL Server connection string]
   - `NEXTAUTH_URL` = [Your production URL]
   - `NEXTAUTH_SECRET` = [Your generated secret]

4. **Enable WebSockets** (for Socket.IO):
   - Check "Enable WebSocket Support"

5. **Install Dependencies**:
   - Click "Install npm Packages" or run via SSH:
     ```bash
     npm ci --production
     npx prisma generate
     npx prisma db push
     ```

6. **Start Application**:
   - Click "Start Application" or "Restart Application Pool"

---

### **Step 4: Verify Deployment** (5 minutes)

1. **Test Homepage**:
   ```
   https://your-domain.smartasp.net
   ```

2. **Test Login**:
   ```
   https://your-domain.smartasp.net/auth/signin
   ```
   - Default Admin: `admin@csr.com` / `Admin@123`
   - Default Agent: `agent@csr.com` / `Agent@123`

3. **Test Socket.IO Connection**:
   - Open browser console (F12)
   - Look for: `✅ Connected to orders namespace`
   - If you see "Connecting..." or errors, check Socket.IO configuration

4. **Test Real-Time Features**:
   - Login as admin on one browser
   - Login as agent on another browser (or incognito)
   - Verify agent shows as "Online" on admin dashboard
   - Test chat functionality between users

---

## Troubleshooting

### 🔴 **Socket.IO Not Connecting**

**Check browser console for errors:**

```javascript
// If you see CORS errors, update server.js:
const io = new Server(server, {
  cors: {
    origin: ["https://your-domain.smartasp.net"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});
```

### 🔴 **Database Connection Failed**

1. **Verify SQL Server credentials** in SmartASP control panel
2. **Test connection string** format:
   ```
   sqlserver://HOST:1433;database=DB_NAME;user=DB_USER;password=DB_PASS;encrypt=true;trustServerCertificate=true
   ```
3. **Check firewall rules** - ensure SQL Server port (1433) is accessible

### 🔴 **Application Not Starting**

1. **Check SmartASP logs** in control panel
2. **Verify Node.js version** is v18+
3. **Ensure all environment variables** are set
4. **Check memory limits** - increase if needed

### 🔴 **Pages Return 404**

1. **Verify `.next` folder** is uploaded
2. **Check `next.config.js`** is present
3. **Restart application pool** in SmartASP control panel

---

## Post-Deployment Checklist

After successful deployment, verify:

- ✅ Homepage loads correctly
- ✅ Users can log in
- ✅ Admin dashboard accessible
- ✅ Agent dashboard accessible
- ✅ Socket.IO shows "Connected"
- ✅ Agent status updates in real-time
- ✅ Order grid loads data
- ✅ Chat functionality works
- ✅ File attachments upload successfully
- ✅ Agents modal displays correctly

---

## Monitoring & Maintenance

### **Daily**
- Check application is running
- Monitor error logs

### **Weekly**
- Review application performance
- Check database size
- Monitor memory usage

### **Monthly**
- Update dependencies (`npm update`)
- Clean old logs
- Backup database

---

## Getting Help

**SmartASP Support:**
- Email: support@smartasp.net
- Knowledge Base: https://smartasp.net/kb

**Application Issues:**
- Check `DEPLOYMENT_GUIDE.md` for detailed troubleshooting
- Review server logs in SmartASP control panel
- Test locally with production environment

---

## Important Security Notes

🔒 **Before Going Live:**

1. **Change all default passwords** in the database
2. **Use strong `NEXTAUTH_SECRET`** (minimum 32 characters)
3. **Enable HTTPS/SSL** on your domain
4. **Configure CORS** to only allow your domain
5. **Keep `.env` file secure** (never commit to Git)
6. **Backup database** regularly
7. **Update dependencies** regularly

---

## Quick Commands Reference

```bash
# Build application
npm run build

# Install production dependencies
npm ci --production

# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push

# Start application
node server.js

# Check application logs
tail -f logs/app.log

# Restart application (on SmartASP)
# Use control panel "Restart Application Pool"
```

---

## Success Indicators

Your deployment is successful when:

✅ Homepage loads without errors
✅ Login works for all users
✅ Socket.IO status shows "Connected"
✅ Agent status updates in real-time
✅ Orders grid displays data correctly
✅ Chat messages send and receive instantly
✅ File uploads work
✅ No errors in browser console
✅ No errors in server logs

---

**Congratulations! Your application is now live on SmartASP! 🎉**

For detailed information, see `DEPLOYMENT_GUIDE.md`

---

**Version**: 1.0.0  
**Last Updated**: October 27, 2025



