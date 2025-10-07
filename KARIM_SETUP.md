# 🎨 Wildrose Painters EmailJS Setup Guide

<div align="center">

![Wildrose Painters](https://img.shields.io/badge/Wildrose_Painters-EmailJS_Setup-blue?style=for-the-badge&logo=paint-brush)

**Transform your contact forms into a professional lead generation system**

📧 **Configured for:** `Karim@kygroup.ca`  
⚡ **Status:** Ready to activate  
🚀 **Setup Time:** 5 minutes  

</div>

---

## 🌟 What You're Building

Transform your website contact forms from silent placeholders into a **powerful customer acquisition machine** that delivers qualified leads directly to your inbox.

### ✨ Features You'll Unlock:
- 📨 **Instant Email Notifications** - Get leads within seconds
- 💼 **Professional Templates** - Branded email formatting
- 📱 **Mobile Optimized** - Works perfectly on all devices
- 🔒 **Secure & Reliable** - Enterprise-grade email delivery
- 📊 **Free Analytics** - Track your form submissions

---

## 🚀 Quick Setup Process

### Step 1️⃣ - Create Your EmailJS Account

<table>
<tr>
<td width="50%">

🌐 **Visit EmailJS Portal**  
Navigate to [emailjs.com](https://www.emailjs.com)

✅ **Create Free Account**  
- Click "Sign Up"
- Use your business email
- Verify your account

🎯 **Why EmailJS?**  
- No backend required
- 200 free emails/month
- Enterprise reliability

</td>
<td width="50%">

```
🎨 Pro Tip:
Use your business email
(Karim@kygroup.ca) for 
professional branding
```

</td>
</tr>
</table>

### Step 2️⃣ - Connect Your Email Service

<table>
<tr>
<td width="50%">

📧 **Add Email Service**
1. Go to "Email Services" tab
2. Click "Add New Service" 
3. Choose **ky.group.solutions@gmail.com** (recommended)
4. Authorize your Google account
5. Copy your **service_09uh02h ID**

</td>
<td width="50%">

```javascript
// You'll get something like:
Service ID: "service_abc123"
```

</td>
</tr>
</table>

### Step 3️⃣ - Design Your Email Template

<table>
<tr>
<td width="50%">

🎨 **Create Template**
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use the professional template →

⭐ **Template Benefits:**
- Clean, professional format
- All customer details captured
- Branded for Wildrose Painters

</td>
<td width="50%">

**Subject Line:**
```
🎨 New Quote Request from {{from_name}} - Wildrose Painters
```

**Email Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #2563eb; color: white; padding: 20px; }
        .content { padding: 20px; }
        .footer { background: #f3f4f6; padding: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🎨 New Quote Request - Wildrose Painters</h2>
    </div>
    
    <div class="content">
        <h3>Customer Details:</h3>
        <p><strong>Name:</strong> {{from_name}}</p>
        <p><strong>Email:</strong> {{from_email}}</p>
        <p><strong>Phone:</strong> {{phone}}</p>
        <p><strong>Service Needed:</strong> {{service}}</p>
        
        <h3>Project Details:</h3>
        <p>{{message}}</p>
    </div>
    
    <div class="footer">
        <p>📧 Sent from wildrosepainters.ca contact form</p>
        <p>Response recommended within 24 hours</p>
    </div>
</body>
</html>
```

</td>
</tr>
</table>

### Step 4️⃣ - Get Your Credentials

<table>
<tr>
<td width="50%">

🔑 **Collect Your Keys**
1. **Template ID** - From your template
2. **Service ID** - From your email service  
3. **Public Key** - Account → General

📝 **Keep These Safe:**
You'll need all three for the next step

</td>
<td width="50%">

```javascript
// Example credentials:
const serviceId = 'service_abc123'
const templateId = 'template_xyz789'  
const publicKey = 'user_def456'
```

</td>
</tr>
</table>

### Step 5️⃣ - Activate Your Website

<table>
<tr>
<td width="50%">

💻 **Update Your Code**

1. Open `app/page.tsx`
2. Find line ~88 
3. Replace the placeholder values
4. Uncomment the send function
5. Comment out the demo line

🎯 **That's It!**  
Your forms are now live and sending emails to **<ky.group.solutions@gmail.com>**

</td>
<td width="50%">

**Replace these lines:**
```javascript
// BEFORE (demo mode):
const serviceId = 'YOUR_SERVICE_ID'
const templateId = 'YOUR_TEMPLATE_ID'  
const publicKey = 'YOUR_PUBLIC_KEY'

// AFTER (live mode):
const serviceId = 'service_abc123'
const templateId = 'template_xyz789'  
const publicKey = 'user_def456'
```

**Activate email sending:**
```javascript
// UNCOMMENT this line:
await emailjs.send(serviceId, templateId, templateParams, publicKey)

// COMMENT OUT this demo line:
// await new Promise(resolve => setTimeout(resolve, 1000))
```

</td>
</tr>
</table>

---

## 🎉 Success! You're Now Live

<div align="center">

### 🚀 **Your Professional Lead Generation System is Active**

📧 **Emails sent to:** `ky.group.solutions@gmail.com`  
⚡ **Response time:** Instant delivery  
📊 **Monthly quota:** 200 emails (free tier)  
🔧 **Upgrade path:** Available if needed  

---

### 🎯 **What Happens Next?**

1. **Customer visits** wildrosepainters.ca
2. **Fills out form** with project details  
3. **Clicks submit** - form validates and sends
4. **You receive email** with all details within seconds
5. **Follow up quickly** to close the lead

---

### 📈 **Pro Tips for Maximum Conversions**

✅ **Respond within 1 hour** - 7x higher conversion rate  
✅ **Use mobile-friendly emails** - 60% of customers check mobile first  
✅ **Follow up within 24 hours** - Professional standard  
✅ **Track your leads** - Monitor which services are most popular  

</div>

---

## 🆘 Need Help?

<table>
<tr>
<td width="33%">

### 📧 **Email Issues**
- Check spam folder
- Verify EmailJS credentials  
- Test with your own email first

</td>
<td width="33%">

### 🐛 **Technical Problems**
- Check browser console for errors
- Ensure all 3 credentials are correct
- Verify template variables match

</td>
<td width="33%">

### 📈 **Optimization**
- A/B test your email templates
- Monitor response rates
- Upgrade if you need more emails

</td>
</tr>
</table>

---

<div align="center">

**🎨 Built for Wildrose Painters Professional Success 🎨**

![EmailJS](https://img.shields.io/badge/Powered_by-EmailJS-green?style=flat-square)
![Next.js](https://img.shields.io/badge/Built_with-Next.js-black?style=flat-square)
![Status](https://img.shields.io/badge/Status-Ready_to_Launch-success?style=flat-square)

</div>