# EmailJS Setup Guide for Wildrose Painters

## Quick Setup (5 minutes)

### 1. Create EmailJS Account
1. Go to [emailjs.com](https://www.emailjs.com)
2. Sign up for free account
3. Verify your email

### 2. Set up Email Service
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail recommended)
4. Follow connection steps
5. Note your **Service ID**

### 3. Create Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use this template:

```
Subject: New Quote Request from {{from_name}}

From: {{from_name}}
Email: {{from_email}}
Phone: {{phone}}
Service Needed: {{service}}

Message:
{{message}}

---
Sent from wildrosepainters.ca contact form
```

4. Note your **Template ID**

### 4. Get Public Key
1. Go to "Account" → "General"
2. Copy your **Public Key**

### 5. Update Website Code
In `app/page.tsx`, replace these lines (around line 88):

```javascript
const serviceId = 'YOUR_SERVICE_ID' // Replace with your Service ID
const templateId = 'YOUR_TEMPLATE_ID' // Replace with your Template ID  
const publicKey = 'YOUR_PUBLIC_KEY' // Replace with your Public Key
```

And uncomment this line:
```javascript
await emailjs.send(serviceId, templateId, templateParams, publicKey)
```

Comment out this demo line:
```javascript
// await new Promise(resolve => setTimeout(resolve, 1000))
```

### 6. Email Already Configured!
Your email is already set to: **karim@kylife.ca**

All form submissions will be sent to this email address.

## That's it! 
Your forms will now send emails directly to your inbox when customers submit quotes.

## Free Tier Limits
- 200 emails/month (plenty for most small businesses)
- Upgrade if you need more

## Alternative: Use Formspree (Even Easier)
If EmailJS seems complex, I can set up Formspree instead - just let me know!