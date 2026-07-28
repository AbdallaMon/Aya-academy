# رفع Ayah Academy على VPS — Ubuntu + CloudPanel

> CloudPanel لوحة تحكم مجانية بتدير لك **Nginx + شهادات SSL + قواعد البيانات +
> مستخدمي المواقع** من واجهة رسومية، وانت بتدير الـ Node processes بـ PM2.
> لو عايز تعمل كل حاجة يدوي من غير لوحة، شوف
> [DEPLOY_VPS_PM2_NGINX.md](./DEPLOY_VPS_PM2_NGINX.md).

CloudPanel بيوفّر عليك كتير، بس في حالتنا فيه حاجتين لازم تنتبه لهم:

1. **معمارية الـ monorepo:** عندنا **اتنين** Node processes (API + Web) +
   **socket.io (WebSocket)**. CloudPanel بيعمل reverse proxy لبورت واحد لكل
   موقع، فهنعمل **موقعين** (subdomain للواجهة + subdomain للـ API) وهنضيف
   إعدادات WebSocket في الـ Vhost يدوياً.
2. **الملفات والصلاحيات:** كل موقع في CloudPanel بيشتغل بـ **مستخدم خاص بيه**
   (site user) جوه `/home/<siteuser>/htdocs/...`. لازم `uploads/` و `backups/`
   يكونوا مملوكين لنفس المستخدم ده وبره مجلد الكود. فيه قسم كامل ([قسم 7](#7-الملفات-والصلاحيات--الأهم)).

---

## 0) نظرة على المعمارية

| الجزء | المكان | البورت الداخلي | موقع CloudPanel |
|------|--------|----------------|-----------------|
| **Web** (Next.js 16) | `web/` | `3000` | موقع `ayah.example.com` |
| **API** (Express 5 + socket.io) | `server/` | `4000` | موقع `api.ayah.example.com` |
| **DB** (Prisma 7) | `packages/db/` | — | قاعدة بيانات من CloudPanel |
| **MySQL** | يديره CloudPanel | `3306` | Databases tab |

```
الإنترنت ─► CloudPanel/Nginx (443, SSL تلقائي)
              ├── ayah.example.com      ─► Next.js (127.0.0.1:3000)
              └── api.ayah.example.com  ─► Express (127.0.0.1:4000) + WebSocket
                                              └─► MySQL (CloudPanel)
```

---

## 1) تثبيت CloudPanel (مرة واحدة)

على Ubuntu 22.04/24.04 نضيف (سيرفر فاضي، كـ root):

```bash
# نزّل سكربت التثبيت الرسمي من cloudpanel.io ثم نفّذه (راجع الموقع لآخر إصدار)
curl -sS https://installer.cloudpanel.io/ce/v2/install.sh -o install.sh
echo "<SHA256_من_الموقع>  install.sh" | sha256sum -c   # تحقّق من البصمة
sudo CLOUD=do bash install.sh        # CLOUD حسب مزوّدك (do/aws/gce/... أو امسحها)
```

بعد ما يخلص:

1. افتح `https://SERVER_IP:8443` (CloudPanel على بورت 8443).
2. اعمل حساب الأدمن.
3. CloudPanel بيظبط الـ firewall تلقائياً (بيفتح 80/443/8443/22).

---

## 2) ربط الـ DNS

من مزوّد الدومين، وجّه:

```
A   ayah.example.com        ─►  SERVER_IP
A   api.ayah.example.com    ─►  SERVER_IP
```

استنى الـ DNS يتحدّث قبل ما تطلب SSL.

---

## 3) إنشاء الموقعين في CloudPanel

CloudPanel فيه نوع موقع **Node.js** بيخليك تختار إصدار Node وبورت التطبيق
وبيعمل reverse proxy تلقائي. هنعمل موقعين:

### 3.1 موقع الواجهة (Web)

1. **Sites → Add Site → Create a Node.js Site**.
2. Domain: `ayah.example.com`
3. Node.js version: **22** (أو أحدث LTS متاح)
4. App Port: **3000**
5. Site User: سيب CloudPanel يولّد مستخدم (مثلاً `ayah-web`) — **احفظ اسمه**،
   هتحتاجه للصلاحيات.

### 3.2 موقع الـ API

1. **Sites → Add Site → Create a Node.js Site**.
2. Domain: `api.ayah.example.com`
3. Node.js version: **22**
4. App Port: **4000**
5. Site User: مثلاً `ayah-api` — **احفظ اسمه**.

> ليه موقعين؟ عشان كل موقع reverse proxy لبورت واحد، وعندنا processin مختلفين.
> ممكن نظرياً تخلّيهم تحت نفس الموقع وتعمل location يدوي، بس موقعين أنضف وأسهل
> في الـ SSL والصلاحيات.

> **بديل:** لو نوع "Node.js Site" مش متاح في نسختك، استخدم **"Create a Reverse
> Proxy Site"** ووجّهه لـ `http://127.0.0.1:3000` (و 4000 للتاني)، وهتدير الـ
> Node بـ PM2 بنفسك (قسم 6).

---

## 4) إنشاء قاعدة البيانات من CloudPanel

1. **Databases → Add Database**.
2. Database Name: `ayah_academy`
3. User: `ayah_user` — وكلمة سر قوية.
4. احفظ البيانات (host = `127.0.0.1`، port = `3306`).

> CloudPanel بيخلّي MySQL على `127.0.0.1` بس (مش مفتوح للخارج) — وده اللي إحنا
> عايزينه.

---

## 5) جلب الكود + الإعداد (داخل مستخدم الموقع)

كل أوامر التشغيل لازم تتعمل بمستخدم الموقع، مش root، عشان الصلاحيات تطلع صح.
ادخل بـ SSH وبدّل للمستخدم.

> ملاحظة: عندنا monorepo واحد بس نشغّله من موقعين. الأنضف: نحط **نسخة الكود
> كاملة جوه مجلد موقع الـ API** (هو اللي محتاج `uploads/`+`backups/`)، ونشغّل
> الواجهة من **نفس النسخة**. تحت بنوضّح.

### 5.1 ادخل بمستخدم موقع الـ API

```bash
ssh root@SERVER_IP
su - ayah-api          # مستخدم موقع الـ API
cd ~/htdocs/api.ayah.example.com
```

امسح أي ملفات افتراضية وحط الكود:

```bash
rm -rf ./*
git clone <REPO_URL> .
```

ثبّت Node نسخة الموقع (CloudPanel بيوفّر nvm لكل مستخدم):

```bash
node -v        # اتأكد إنها 22.x (CloudPanel بيظبطها للموقع)
npm ci         # بيركّب كل الـ workspaces
```

---

## 6) متغيرات البيئة + البناء

محتاج **3 ملفات** بيئة (زي اليدوي): `packages/db/.env`، `server/.env`،
`web/.env.local`.

### 6.1 `packages/db/.env`

```env
DATABASE_URL="mysql://ayah_user:DB_PASSWORD@127.0.0.1:3306/ayah_academy"
```

### 6.2 `server/.env`

```env
DATABASE_URL="mysql://ayah_user:DB_PASSWORD@127.0.0.1:3306/ayah_academy"
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=ayah_user
DATABASE_PASSWORD=DB_PASSWORD
DATABASE_NAME=ayah_academy

PORT=4000
NODE_ENV=production
CORS_ORIGINS=https://ayah.example.com
APP_URL=https://ayah.example.com

JWT_ACCESS_SECRET=__64_HEX__
JWT_REFRESH_SECRET=__64_HEX__
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
COOKIE_DOMAIN=.example.com

MASTER_KEY=__BASE64_32_BYTES__

# 📁 مسارات التخزين — جوه مجلد مستخدم الموقع بس بره مجلد الـ git (قسم 7)
UPLOAD_DIR=/home/ayah-api/storage/uploads
BACKUP_DIR=/home/ayah-api/storage/backups

BACKUP_PROVIDER=local
BACKUP_ENABLED=true
BACKUP_TIME_OF_DAY=02:00
BACKUP_RETENTION_MAX=30
```

### 6.3 `web/.env.local`

```env
NEXT_PUBLIC_API_URL=https://api.ayah.example.com/api/v1
NEXT_PUBLIC_APP_URL=https://ayah.example.com
NEXT_PUBLIC_SITE_URL=https://ayah.example.com
```

### 6.4 توليد الأسرار + تقفيل الملفات

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"     # JWT (مرتين)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # MASTER_KEY
chmod 600 server/.env packages/db/.env web/.env.local
```

### 6.5 تجهيز الـ DB + بناء الواجهة

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed            # اختياري
npm run build:web
```

---

## 7) الملفات والصلاحيات — **الأهم** 📁

ده الجزء اللي قلت إنك هتحتاج فيه صلاحيات. في CloudPanel كل موقع بمستخدم خاص،
فالحكاية بتكون أوضح بس لازم تتعمل صح.

### 7.1 المبدأ

- الكود كله جوه `/home/ayah-api/htdocs/api.ayah.example.com`.
- ملفات المستخدمين (`uploads/`) والنسخ الاحتياطية (`backups/`) لازم يكونوا:
  - **بره مجلد الكود** (عشان `git pull` ما يمسحهمش) → حطّيناهم في
    `/home/ayah-api/storage/...`.
  - **مملوكين لمستخدم الموقع** `ayah-api` (هو اللي بيشغّل الـ Node).

### 7.2 إنشاء مجلد التخزين

وانت بمستخدم `ayah-api`:

```bash
mkdir -p /home/ayah-api/storage/uploads
mkdir -p /home/ayah-api/storage/backups
mkdir -p /home/ayah-api/storage/logs

chmod -R 750 /home/ayah-api/storage
```

> لأنك أصلاً بتعمل ده **بمستخدم الموقع**، الملكية تلقائياً `ayah-api:ayah-api` —
> ده بالظبط المطلوب. لو عملته بـ root بالغلط، صحّحها:
> `chown -R ayah-api:ayah-api /home/ayah-api/storage`.

اتأكد إن `server/.env` بيشاور على المسارات دي (`UPLOAD_DIR`/`BACKUP_DIR`).

### 7.3 تحذير أمني مهم

الـ uploads **مش** بتتقدّم static — الـ API بيتحقّق من الدخول وبعدين يبثّ الملف.
**ما تضيفش** أي `location /uploads` في الـ Vhost يفتح المجلد للعامة. سيبها ورا الـ
API بالكامل.

### 7.4 ملف الاستعادة المؤقت

استعادة نسخة `.enc` خارجية بتترفع في `/tmp` (حتى 200MB) — اتأكد إن مساحة
`/tmp` كفاية.

---

## 8) تشغيل الـ processes بـ PM2

CloudPanel مابيشغّلش الـ Node عنك بشكل دائم بطريقة موثوقة للحالات المعقّدة زي
بتاعتنا (process اتنين)، فالأنضف نستخدم PM2 تحت مستخدم الموقع.

```bash
# بمستخدم ayah-api
npm install -g pm2     # أو npx pm2 لو مفيش صلاحية global
```

اعمل `ecosystem.config.cjs` في جذر المشروع:

```js
// /home/ayah-api/htdocs/api.ayah.example.com/ecosystem.config.cjs
const ROOT = "/home/ayah-api/htdocs/api.ayah.example.com";
module.exports = {
  apps: [
    {
      name: "ayah-api",
      cwd: ROOT + "/server",
      script: "src/server.js",
      env: { NODE_ENV: "production" },
      out_file: "/home/ayah-api/storage/logs/api-out.log",
      error_file: "/home/ayah-api/storage/logs/api-err.log",
    },
    {
      name: "ayah-web",
      cwd: ROOT + "/web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: { NODE_ENV: "production" },
      out_file: "/home/ayah-api/storage/logs/web-out.log",
      error_file: "/home/ayah-api/storage/logs/web-err.log",
    },
  ],
};
```

```bash
cd /home/ayah-api/htdocs/api.ayah.example.com
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup        # نفّذ السطر اللي يطلع (محتاج sudo/root مرة واحدة)
```

> لاحظ: الـ Web بيشتغل من نفس نسخة الكود بتاعة موقع الـ API (`ROOT/web`).
> CloudPanel هيعمل reverse proxy لموقع `ayah.example.com` على بورت 3000 —
> والـ process هو اللي شغّال هنا. (مش لازم تنسخ الكود في مجلد موقع الـ web.)

---

## 9) ضبط الـ Vhost لـ WebSocket (socket.io)

الـ real-time محتاج تمرير ترويسات الـ Upgrade. CloudPanel بيخليك تعدّل الـ
Vhost لكل موقع:

1. **Sites → api.ayah.example.com → Vhost**.
2. جوه الـ `location` اللي بيعمل `proxy_pass` للبورت 4000، اتأكد إن فيه:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_read_timeout 86400;
client_max_body_size 200M;     # لرفع ملفات الاستعادة الكبيرة
```

3. لموقع الواجهة `ayah.example.com`، زوّد `client_max_body_size 20M;` (رفع الصور)
   ونفس ترويسات الـ Upgrade.
4. احفظ — CloudPanel بيعمل reload للـ Nginx تلقائياً.

---

## 10) شهادات SSL

من CloudPanel:

1. **Sites → ayah.example.com → SSL/TLS → Let's Encrypt → Issue**.
2. كرّر لموقع `api.ayah.example.com`.

CloudPanel بيجدّدها تلقائياً. بعد كده اتأكد إن كل متغيرات البيئة بـ `https://`.

---

## 11) التحقق

```bash
pm2 status
curl -I https://ayah.example.com
curl -i https://api.ayah.example.com/api/v1

# اختبار صلاحية الكتابة كمستخدم الموقع:
sudo -u ayah-api touch /home/ayah-api/storage/uploads/_t && \
  sudo -u ayah-api rm /home/ayah-api/storage/uploads/_t && echo "uploads OK"
```

من المتصفح: سجّل دخول، ارفع صورة، اتأكد إنها بتتعرض (يختبر `uploads/` + البثّ
المحمي)، واختبر الإشعارات/السوكِت (يختبر WebSocket عبر CloudPanel).

---

## 12) إعادة النشر

```bash
su - ayah-api
cd ~/htdocs/api.ayah.example.com
git pull
npm ci
npm run db:migrate:deploy
npm run build:web
pm2 reload all
```

> `uploads/` و `backups/` في `/home/ayah-api/storage` — بره مجلد الكود، فمش
> بيتأثروا. ده سبب وضعهم هناك.

---

## ملخّص نقاط الصلاحيات (CloudPanel)

1. كل الأوامر بمستخدم الموقع (`ayah-api`)، مش root → الملكية تطلع صح تلقائياً.
2. `uploads/`+`backups/` في `/home/ayah-api/storage` (بره الكود) عبر
   `UPLOAD_DIR`/`BACKUP_DIR`.
3. `chmod 750` على `storage/`، و`chmod 600` على ملفات `.env`.
4. الـ uploads مش static — ما تفتحهاش في الـ Vhost، سيبها ورا الـ API.
5. لو شغّلت أي أمر بـ root بالغلط، صحّح الملكية:
   `chown -R ayah-api:ayah-api /home/ayah-api/storage` (و مجلد الكود لو لزم).
6. `MASTER_KEY` ثابت ولا يتغيّر بعد أول ربط Drive (وإلا التوكِنز ما تتفكّش).

---

## مقارنة سريعة: يدوي (PM2+Nginx) مقابل CloudPanel

| | يدوي | CloudPanel |
|--|------|-----------|
| Nginx vhosts | تكتبها بإيدك | واجهة + محرر Vhost |
| SSL | Certbot CLI | زر Issue + تجديد تلقائي |
| المستخدمين | تعملهم بنفسك (`ayah`) | مستخدم لكل موقع تلقائي |
| قواعد البيانات | mysql CLI | واجهة Databases |
| الـ Node processes | PM2 (انت) | PM2 (انت برضه) |
| الصلاحيات | انت تضبطها | أوضح (مستخدم لكل موقع) |
| التحكّم الكامل | ✅ | جزئي (اللوحة بتحط قيود) |

الاتنين بيشغّلوا نفس الـ stack — الفرق في مين بيدير Nginx/SSL/DB/users.
