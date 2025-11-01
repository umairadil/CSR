# 🚀 SmartASP Node.js Deployment Guide - CSR Portal

**Domain**: https://csr.darjaah-hub.com  
**SQL Server**: SQL1002.site4now.net  
**Database**: db_ab7671_csr  
**Based on**: [SmartASP Node.js Hosting Documentation](https://www.smarterasp.net/nodejs_hosting)

---

## ✅ **Build Completed Successfully!**

Your Next.js application has been built for production. The `.next` folder now contains your optimized build.

---

## 📋 **PHASE 1: Prepare Files for Upload** ⏱️ ~5 minutes

### **Step 1.1: Copy production.env to .env**

```powershell
Copy-Item production.env .env
```

### **Step 1.2: Verify Required Files**

Make sure these exist before uploading:
- ✅ `.next/` folder (created from `npm run build`)
- ✅ `node_modules/` folder (all dependencies)
- ✅ `prisma/` folder (schema and migrations)
- ✅ `server.js` (custom Node.js server with Socket.IO)
- ✅ `package.json` & `package-lock.json`
- ✅ `.env` (production environment variables)
- ✅ `next.config.js`
- ✅ `web.config` (IIS configuration for Windows hosting)

### **Step 1.3: Create uploads folder**

```powershell
New-Item -ItemType Directory -Force -Path uploads
```

---

## 📤 **PHASE 2: Upload to SmartASP** ⏱️ ~30-60 minutes

According to [SmartASP's Quick Start Guide](https://www.smarterasp.net/support/kb/a1970/quick-start-node_js.aspx), follow these steps:

### **Step 2.1: Access Control Panel**

1. Log in to your SmartASP control panel at https://www.smarterasp.net
2. Navigate to **Control Panel > Hosting Manager**

### **Step 2.2: Enable Node.js**

1. In Hosting Manager, find **Node.js** section
2. Click **Enable Node.js**
3. Select **Node.js version 20.x** (recommended for Next.js 14)

### **Step 2.3: Upload Files via File Manager or FTP**

**Method A: File Manager (Recommended for smaller projects)**

1. Go to **Control Panel > File Manager**
2. Navigate to your website root directory (e.g., `/wwwroot` or `/httpdocs`)
3. Create a new folder: `csr-portal`
4. Upload the following folders and files:

**Upload these folders (will take longest time)**:
- `.next/` → Entire production build (~50-150 MB)
- `node_modules/` → All dependencies (~200-800 MB) ⚠️ This will take 15-30 minutes
- `prisma/` → Database schema
- `public/` → Static assets (if any)
- `uploads/` → Empty folder for file uploads

**Upload these files**:
- `server.js` → Custom Node.js server
- `package.json`
- `package-lock.json`
- `next.config.js`
- `web.config` → IIS configuration
- `.env` → Production environment variables

**⚠️ IMPORTANT**: Rename `production.env` to `.env` when uploading!

**Method B: FTP/SFTP (Recommended for faster uploads)**

According to [SmartASP documentation](https://www.smarterasp.net/support/kb/a276/getting-started-with-node_js-hosting-on-smarteraspnet.aspx):

1. Use an FTP client (FileZilla, WinSCP, etc.)
2. Connect using your FTP credentials from SmartASP control panel
3. Navigate to your website root
4. Upload all files and folders listed above

**FTP Optimization Tip**:
- Compress `node_modules` to a ZIP file locally
- Upload the ZIP file
- Extract it on the server using File Manager

---

## 🗄️ **PHASE 3: Configure Database** ⏱️ ~3 minutes

### **Step 3.1: Verify SQL Server Connection**

Your `.env` file already contains:
```
DATABASE_URL="sqlserver://SQL1002.site4now.net:1433;database=db_ab7671_csr;user=db_ab7671_csr_admin;password=INse14ron;encrypt=true;trustServerCertificate=true"
```

### **Step 3.2: Run Prisma Schema Push**

**Since SmartASP shared hosting doesn't provide SSH/terminal access**, we already did this from your local machine earlier:

✅ Database schema has been pushed to production SQL Server

If you need to re-run it, execute this from your local machine:

```powershell
# Set production database URL temporarily
$env:DATABASE_URL="sqlserver://SQL1002.site4now.net:1433;database=db_ab7671_csr;user=db_ab7671_csr_admin;password=INse14ron;encrypt=true;trustServerCertificate=true"

# Push schema to production
npx prisma db push

# Verify by generating client
npx prisma generate
```

---

## ⚙️ **PHASE 4: Configure Node.js Application** ⏱️ ~10 minutes

According to [SmartASP Node.js Publishing Guide](https://www.smarterasp.net/support/kb/a2233/how-to-publish-a-next_js-project-to-your-hosting-account.aspx):

### **Step 4.1: Configure Node.js in Control Panel**

1. Go to **Control Panel > Node.js**
2. Click **Create New Application**
3. Configure settings:
   - **Application Name**: `CSR Portal`
   - **Application Path**: `/csr-portal` (or your chosen folder)
   - **Entry Point**: `server.js` ⚠️ **CRITICAL: Use `server.js` NOT `node_modules/next/dist/bin/next`**
   - **Node.js Version**: `20.x`
   - **Application URL**: `https://csr.darjaah-hub.com`

4. Click **Save**

### **Step 4.2: Set Environment Variables**

According to [SmartASP's .env guide](https://www.smarterasp.net/support/kb/a2234/how-to-use-node-environment-variables-with-a-dotenv-file-in-node_js.aspx):

Option A: **Use .env file** (Already done - `.env` uploaded)

Option B: **Set via Control Panel** (if .env doesn't work):
1. Go to **Node.js > Environment Variables**
2. Add these variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `sqlserver://SQL1002.site4now.net:1433;database=db_ab7671_csr;user=db_ab7671_csr_admin;password=INse14ron;encrypt=true;trustServerCertificate=true`
   - `NEXTAUTH_URL` = `https://csr.darjaah-hub.com`
   - `NEXTAUTH_SECRET` = `csr_darjaah_hub_production_2024_secure_key_8f2k9j3n4m5b6v7c8x9z0a1s2d3f4g5h`
   - `PORT` = `3000` (or as assigned by SmartASP)

### **Step 4.3: Configure web.config for IIS**

Your `web.config` file should already be uploaded. It configures:
- ✅ IIS to use iisnode for Node.js
- ✅ URL rewriting for Next.js
- ✅ WebSocket support for Socket.IO
- ✅ Static file serving
- ✅ Security headers

**Verify web.config contents**:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    
    <rewrite>
      <rules>
        <rule name="NodeApp">
          <match url="/*" />
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    
    <webSocket enabled="true" />
    
    <iisnode 
      node_env="production"
      nodeProcessCommandLine="C:\Program Files\nodejs\node.exe"
      interceptor="&quot;%programfiles%\iisnode\interceptor.js&quot;"
    />
  </system.webServer>
</configuration>
```

---

## 🚦 **PHASE 5: Start the Application** ⏱️ ~2 minutes

### **Step 5.1: Start Node.js Application**

1. Go to **Control Panel > Node.js**
2. Find your **CSR Portal** application
3. Click **Start** button
4. Wait for status to change to **Running**

### **Step 5.2: Check Application Status**

Monitor the application:
- Status should show: ✅ **Running**
- If it shows **Stopped** or **Error**, check logs (next step)

---

## 🐛 **PHASE 6: Troubleshooting & Verification** ⏱️ ~10 minutes

### **Step 6.1: View Logs**

1. Go to **Control Panel > Node.js > Your Application**
2. Click **View Logs**
3. Check for errors:
   - Database connection errors
   - Port conflicts
   - Missing dependencies
   - Socket.IO errors

### **Step 6.2: Common Issues & Solutions**

#### **Issue 1: Application won't start**

**Error**: `ENOENT: no such file or directory, open '.env'`

**Solution**:
- Ensure `.env` file exists in the root directory
- Alternatively, set environment variables via Control Panel

---

#### **Issue 2: Database connection errors**

**Error**: `Error: getaddrinfo ENOTFOUND SQL1002.site4now.net`

**Solution**:
- Verify SQL Server is accessible from SmartASP servers
- Check firewall rules in SQL Server settings
- Confirm database credentials are correct

According to [SmartASP SQL Server guide](https://www.smarterasp.net/support/kb/a2274/how-to-connect-mssql-with-node_js.aspx):
- SmartASP SQL Server requires **Remote Connection enabled**
- Verify in **Control Panel > SQL Server > Remote Connection = Enabled**

---

#### **Issue 3: Socket.IO not connecting**

**Error**: Client shows "Disconnected" or "Socket connection failed"

**Solution**:
- Verify `web.config` has `<webSocket enabled="true" />`
- Check if IIS WebSocket module is enabled on server
- Ensure port 3000 (or configured port) is not blocked

---

#### **Issue 4: 404 errors on API routes**

**Error**: `/api/orders` returns 404

**Solution**:
- Verify `.next` folder uploaded completely
- Check `server.js` is configured as entry point (not `next start`)
- Restart Node.js application

---

#### **Issue 5: Static files (CSS/JS) not loading**

**Error**: `/_ next/static/` files return 404

**Solution**:
- Verify `.next` folder structure intact
- Check `web.config` static file rules
- Ensure `public` folder uploaded

---

### **Step 6.3: Test Deployment**

1. **Visit Homepage**:
   - https://csr.darjaah-hub.com
   - Should redirect to login page

2. **Test Login**:
   - Email: `admin@csr.com`
   - Password: (your admin password)
   - Should redirect to `/admin` dashboard

3. **Test Real-time Features**:
   - Open admin dashboard
   - Check if agent status shows (Socket.IO connection)
   - Test chat functionality

4. **Test Database**:
   - Try creating/updating an order
   - Verify data persists in SQL Server

---

## 📊 **Post-Deployment Checklist**

- [ ] Application status shows **Running**
- [ ] Homepage loads without errors
- [ ] Login works with existing users
- [ ] Admin dashboard displays correctly
- [ ] Agent dashboard displays correctly
- [ ] Socket.IO connection established (shows "Connected")
- [ ] Orders grid loads data
- [ ] Chat functionality works
- [ ] Real-time updates working
- [ ] File uploads work (test chat attachments)
- [ ] Database operations work (create/update/delete)

---

## 🔧 **Maintenance & Updates**

### **To Deploy Updates**:

1. **On Local Machine**:
   ```powershell
   npm run build
   ```

2. **Upload to SmartASP**:
   - Upload updated `.next` folder
   - Upload any changed files (`server.js`, components, etc.)
   - **DON'T re-upload** `node_modules` unless dependencies changed

3. **Restart Application**:
   - Go to Control Panel > Node.js
   - Click **Restart** button

### **To Update Dependencies**:

1. **Add new package locally**:
   ```powershell
   npm install new-package
   npm run build
   ```

2. **Upload to SmartASP**:
   - Upload updated `package.json` and `package-lock.json`
   - Upload new/updated files in `node_modules/new-package/`
   - Or re-upload entire `node_modules` folder

3. **Restart Application**

---

## 🆘 **Getting Help**

If you encounter issues:

1. **Check SmartASP Documentation**:
   - [Node.js Hosting Guide](https://www.smarterasp.net/nodejs_hosting)
   - [Getting Started with Node.js](https://www.smarterasp.net/support/kb/a276/getting-started-with-node_js-hosting-on-smarteraspnet.aspx)
   - [Next.js Publishing Guide](https://www.smarterasp.net/support/kb/a2233/how-to-publish-a-next_js-project-to-your-hosting-account.aspx)

2. **Contact SmartASP Support**:
   - Live Chat: Available on SmartASP.net
   - Support Ticket: via Control Panel
   - Phone: +1-888-993-7327 (Toll Free)

3. **Check Application Logs**:
   - Control Panel > Node.js > View Logs
   - Look for stack traces and error messages

---

## ✅ **Success!**

Your CSR Portal should now be live at:
**https://csr.darjaah-hub.com**

🎉 Congratulations on deploying your Next.js application with Socket.IO to SmartASP!

---

## 📝 **Notes**

- SmartASP uses **IIS with iisnode** to run Node.js applications
- Your custom `server.js` handles Socket.IO connections
- Database is hosted on SQL Server (not local SQLite)
- All environment variables loaded from `.env` file
- WebSocket connections enabled via `web.config`
- Application runs persistently (not serverless)




