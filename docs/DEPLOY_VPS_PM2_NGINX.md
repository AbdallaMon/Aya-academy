# رفع Aya Academy على VPS — Ubuntu + PM2 + Nginx (إدارة يدوية كاملة)

> الطريقة دي بتديك تحكّم كامل: انت اللي بتثبّت Node و MySQL، وبتدير الـ
> processes بـ **PM2**، وبتعمل reverse proxy و SSL بـ **Nginx + Certbot**.
> لو عايز لوحة تحكم جاهزة بدل اليدوي، شوف [DEPLOY_VPS_CLOUDPANEL.md](./DEPLOY_VPS_CLOUDPANEL.md).

---

## 0) نظرة سريعة على المعمارية

المشروع monorepo (npm workspaces):

| الجزء | المكان | بيشتغل إزاي | البورت الداخلي |
|------|--------|-------------|----------------|
| **API server** | `server/` (Express 5 + Prisma 7 + socket.io) | `node src/server.js` تحت PM2 | `4000` (من `PORT`) |
| **Web** | `web/` (Next.js 16) | `next start` تحت PM2 | `3000` |
| **DB package** | `packages/db/` (Prisma + MariaDB adapter) | migrations فقط (مش process) | — |
| **Shared** | `packages/shared/` | مكتبة داخلية | — |
| **MySQL/MariaDB** | على نفس السيرفر | systemd service | `3306` |

المخطط النهائي:

```
الإنترنت
   │
   ▼
 Nginx (443 / 80, SSL)
   ├── aya.example.com       ──► Next.js  (127.0.0.1:3000)
   └── api.aya.example.com   ──► Express  (127.0.0.1:4000)  + socket.io (WebSocket)
                                     │
                                     ▼
                                  MySQL (127.0.0.1:3306)
```

**⚠️ أهم نقطة (الملفات):** الـ API بيخزّن صور/مرفقات في `uploads/` ونسخ
احتياطية في `backups/` على نفس الديسك. **لازم** نخليهم **خارج مجلد الكود**
عشان أي `git pull` أو إعادة نشر ما يمسحهمش، ولازم يكونوا **مملوكين للمستخدم اللي
بيشغّل الـ Node** بصلاحيات كتابة. فيه قسم كامل لده تحت ([قسم 8](#8-الملفات-والصلاحيات--الأهم)).

---

## 1) تجهيز السيرفر (مرة واحدة)

اتصل بالسيرفر كـ root أو مستخدم عنده sudo:

```bash
ssh root@SERVER_IP
apt update && apt upgrade -y
apt install -y curl git build-essential ufw
```

### 1.1 جدار الحماية (UFW)

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

> ملاحظة: مش بنفتح 3000 ولا 4000 ولا 3306 للعالم — دول داخليين بس، Nginx
> هو اللي بيتكلم معاهم على `127.0.0.1`.

### 1.2 إنشاء مستخدم مخصّص للتشغيل (مهم للصلاحيات)

ما نشغّلش الـ app كـ root. نعمل مستخدم اسمه `aya`:

```bash
adduser --disabled-password --gecos "" aya
usermod -aG sudo aya          # اختياري لو محتاجه يعمل sudo
```

كل اللي جاي (تثبيت node عبر nvm، الكود، PM2) هيتعمل **وانت داخل بالمستخدم `aya`**:

```bash
su - aya
```

---

## 2) تثبيت Node.js (الإصدار المناسب)

Next.js 16 و Prisma 7 محتاجين **Node 20.9+**. هنركّب **Node 22 LTS** عبر `nvm`
(تحت المستخدم `aya`):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm alias default 22
node -v   # لازم يطلع v22.x
npm -v
```

---

## 3) تثبيت MySQL / MariaDB

المشروع شغّال مع MySQL أو MariaDB (الـ runtime adapter اسمه `@prisma/adapter-mariadb`
وبيشتغل مع الاتنين). هنستخدم MariaDB:

```bash
sudo apt install -y mariadb-server mariadb-client
sudo systemctl enable --now mariadb
sudo mysql_secure_installation     # اعمل root password وامسح الـ defaults
```

أنشئ قاعدة البيانات + مستخدم مخصّص:

```bash
sudo mysql
```

```sql
CREATE DATABASE aya_academy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aya_user'@'localhost' IDENTIFIED BY 'STRONG_DB_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON aya_academy.* TO 'aya_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> `mariadb-client` بيجيب معاه `mysqldump` — مفيد لو احتجت تعمل/تستعيد نسخة
> احتياطية يدوية. (نظام الباك أب الداخلي بيعتمد على mysql2 من node، فمش لازم،
> بس مستحسن يكون موجود.)

---

## 4) جلب الكود + تركيب الاعتماديات

اختار مكان للمشروع، مثلاً `/var/www/aya`، ومملوك لـ `aya`:

```bash
sudo mkdir -p /var/www/aya
sudo chown -R aya:aya /var/www/aya
# (وانت بالمستخدم aya)
git clone <REPO_URL> /var/www/aya
cd /var/www/aya
```

ثبّت كل الـ workspaces دفعة واحدة من الجذر:

```bash
npm ci          # بيركّب server + web + packages كلها مع بعض
```

---

## 5) متغيرات البيئة (.env)

من قالب `.env` الموجود في جذر المشروع، محتاج تعمل **3 ملفات**:

| الملف | لمين |
|------|------|
| `packages/db/.env` | الـ Prisma migrations (محتاج `DATABASE_URL`) |
| `server/.env` | الـ API server وقت التشغيل |
| `web/.env.local` | الـ Next.js (متغيرات `NEXT_PUBLIC_*`) |

### 5.1 `packages/db/.env`

```env
DATABASE_URL="mysql://aya_user:STRONG_DB_PASSWORD_HERE@127.0.0.1:3306/aya_academy"
```

### 5.2 `server/.env`

```env
# قاعدة البيانات — الـ migrations بتقرأ URL، والـ runtime بيقرأ الأجزاء
DATABASE_URL="mysql://aya_user:STRONG_DB_PASSWORD_HERE@127.0.0.1:3306/aya_academy"
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=aya_user
DATABASE_PASSWORD=STRONG_DB_PASSWORD_HERE
DATABASE_NAME=aya_academy

# السيرفر
PORT=4000
NODE_ENV=production
CORS_ORIGINS=https://aya.example.com
APP_URL=https://aya.example.com

# JWT — ولّد أسرار قوية (انظر تحت)
JWT_ACCESS_SECRET=__PUT_64_HEX_HERE__
JWT_REFRESH_SECRET=__PUT_ANOTHER_64_HEX_HERE__
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
COOKIE_DOMAIN=.example.com

# مفتاح التشفير at-rest (32 byte base64)
MASTER_KEY=__PUT_BASE64_32_BYTES__

# 📁 مسارات التخزين — خليها خارج مجلد الكود (قسم 8)
UPLOAD_DIR=/var/www/aya-storage/uploads
BACKUP_DIR=/var/www/aya-storage/backups

# الباك أب
BACKUP_PROVIDER=local        # أو drive / s3
BACKUP_ENABLED=true
BACKUP_TIME_OF_DAY=02:00
BACKUP_RETENTION_MAX=30

# Google Drive (لو BACKUP_PROVIDER=drive)
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_REDIRECT_URI=https://api.aya.example.com/api/v1/...
```

### 5.3 `web/.env.local`

```env
NEXT_PUBLIC_API_URL=https://api.aya.example.com/api/v1
NEXT_PUBLIC_APP_URL=https://aya.example.com
NEXT_PUBLIC_SITE_URL=https://aya.example.com
```

### 5.4 توليد الأسرار

```bash
# JWT secrets (شغّلها مرتين)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# MASTER_KEY (base64 لـ 32 بايت)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> **مهم:** ملفات `.env` فيها أسرار. اتأكد إنها مش متتبّعة في git (هي أصلاً
> في `.gitignore`) وصلاحياتها مقفولة: `chmod 600 server/.env packages/db/.env web/.env.local`.

---

## 6) تجهيز قاعدة البيانات + بناء الواجهة

من جذر المشروع (بالمستخدم `aya`):

```bash
npm run db:generate          # prisma generate
npm run db:migrate:deploy    # تطبيق الـ migrations على قاعدة الإنتاج
npm run db:seed              # بيانات أولية (اختياري — لو محتاج أول أدمن مثلاً)

npm run build:web            # بناء Next.js للإنتاج
```

> ما تستخدمش `db:migrate` (الـ dev) ولا `db:migrate:reset` على الإنتاج —
> `migrate:reset` بيمسح الداتا.

---

## 7) تشغيل الـ processes بـ PM2

ثبّت PM2 عالمياً (بالمستخدم `aya`):

```bash
npm install -g pm2
```

اعمل ملف `ecosystem.config.cjs` في جذر المشروع:

```bash
nano /var/www/aya/ecosystem.config.cjs
```

```js
// /var/www/aya/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "aya-api",
      cwd: "/var/www/aya/server",
      script: "src/server.js",
      interpreter: "node",
      env: { NODE_ENV: "production" },
      max_memory_restart: "500M",
      out_file: "/var/www/aya-storage/logs/api-out.log",
      error_file: "/var/www/aya-storage/logs/api-err.log",
    },
    {
      name: "aya-web",
      cwd: "/var/www/aya/web",
      // next start على البورت 3000
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: { NODE_ENV: "production" },
      max_memory_restart: "500M",
      out_file: "/var/www/aya-storage/logs/web-out.log",
      error_file: "/var/www/aya-storage/logs/web-err.log",
    },
  ],
};
```

> الـ `cwd` للـ API لازم يكون `server/` عشان لو ما حطّيتش `UPLOAD_DIR`/`BACKUP_DIR`
> صريحين، الافتراضي بيكون نسبةً للـ cwd. إحنا أصلاً حاطّينهم absolute في `.env`، فتمام.

شغّل وثبّت على البوت:

```bash
mkdir -p /var/www/aya-storage/logs     # هنعمله رسمياً في قسم 8
cd /var/www/aya
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd        # نفّذ السطر اللي هيطلعلك (بـ sudo) عشان يشتغل بعد الـ reboot
```

أوامر مفيدة:

```bash
pm2 status
pm2 logs aya-api
pm2 logs aya-web
pm2 restart aya-api
pm2 reload all       # إعادة تشغيل بدون downtime تقريباً
```

---

## 8) الملفات والصلاحيات — **الأهم** 📁

ده الجزء اللي اتقلقت منه — خليه صح من الأول وعمرك ما تتعب منه.

### 8.1 ليه نطلّع `uploads/` و `backups/` بره الكود؟

- لو سيبتهم جوه `/var/www/aya/server/uploads`، أي `git pull` / إعادة نشر /
  استبدال للمجلد ممكن **يمسح ملفات المستخدمين**.
- الكود بيقرأ المسار من `UPLOAD_DIR` و `BACKUP_DIR` (في `server/.env`)، فممكن
  نوجّههم لمجلد ثابت بره.

### 8.2 إنشاء مجلد التخزين وضبط الملكية

```bash
sudo mkdir -p /var/www/aya-storage/uploads
sudo mkdir -p /var/www/aya-storage/backups
sudo mkdir -p /var/www/aya-storage/logs

# الملكية للمستخدم اللي بيشغّل الـ Node (aya)
sudo chown -R aya:aya /var/www/aya-storage

# صلاحيات: المالك يقرأ/يكتب/يدخل، الباقي يدخل بس
sudo chmod -R 750 /var/www/aya-storage
```

اتأكد إن `server/.env` بيشاور عليهم:

```env
UPLOAD_DIR=/var/www/aya-storage/uploads
BACKUP_DIR=/var/www/aya-storage/backups
```

### 8.3 ملكية مجلد الكود نفسه

```bash
sudo chown -R aya:aya /var/www/aya
```

> **مهم أمنياً:** الـ uploads **مش** بتتقدّم static من Nginx — الـ API بيبثّها
> بعد التحقق من تسجيل الدخول. يعني **ما تعملش** location في Nginx يفتح
> `/var/www/aya-storage/uploads` للعامة. سيبها ورا الـ API.

### 8.4 لو شغّال الباك أب لـ Google Drive / S3

- **Drive:** التوكِنز بتتشفّر at-rest بـ `MASTER_KEY`، فاتأكد إن `MASTER_KEY`
  ثابت وما يتغيّرش بعد أول ربط (لو اتغيّر، التوكِنز القديمة مش هتتفكّ).
- **S3:** حط مفاتيح `AWS_*` في `server/.env`، وساعتها مش محتاج صلاحيات
  كتابة كتير محلياً (بس لسه محتاج `BACKUP_DIR` كمكان مؤقت).

### 8.5 ملف الاستعادة المؤقت

استعادة نسخة خارجية (`.enc`) بترفعها multer في `os.tmpdir()` (يعني `/tmp`) —
اتأكد إن `/tmp` فيه مساحة كافية (النسخ ممكن توصل 200MB).

---

## 9) إعداد Nginx (reverse proxy + WebSocket)

```bash
sudo apt install -y nginx
```

### 9.1 vhost للواجهة (Next.js)

```bash
sudo nano /etc/nginx/sites-available/aya-web
```

```nginx
server {
    listen 80;
    server_name aya.example.com;

    client_max_body_size 20M;   # عشان رفع الصور

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;     # Next HMR/stream
        proxy_set_header Connection "upgrade";
    }
}
```

### 9.2 vhost للـ API (Express + socket.io)

```bash
sudo nano /etc/nginx/sites-available/aya-api
```

```nginx
server {
    listen 80;
    server_name api.aya.example.com;

    client_max_body_size 200M;  # عشان رفع ملفات الاستعادة الكبيرة

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # مهم لـ socket.io / WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;   # اتصالات WebSocket طويلة العمر
    }
}
```

> الـ socket.io شغّال على نفس بورت الـ API (4000)، فالـ headers بتاعة الـ
> Upgrade دي ضرورية جداً عشان الـ real-time يشتغل.

### 9.3 تفعيل المواقع

```bash
sudo ln -s /etc/nginx/sites-available/aya-web /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/aya-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t        # اختبار الإعداد
sudo systemctl reload nginx
```

---

## 10) شهادات SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d aya.example.com -d api.aya.example.com
```

Certbot هيعدّل الـ vhosts ويضيف 443 ويعمل redirect من 80. التجديد تلقائي
عبر systemd timer — اختبره:

```bash
sudo certbot renew --dry-run
```

بعد كده اتأكد إن متغيرات البيئة كلها بـ `https://` (زي ما في قسم 5).

---

## 11) التحقق إن كل حاجة شغّالة

```bash
# الـ API بيرد؟
curl -i https://api.aya.example.com/api/v1
# الواجهة بترجع HTML؟
curl -I https://aya.example.com
# الـ processes شغّالة؟
pm2 status
# اختبار كتابة الصلاحيات (لازم ينجح كـ aya):
sudo -u aya touch /var/www/aya-storage/uploads/_test && \
  sudo -u aya rm /var/www/aya-storage/uploads/_test && echo "uploads OK"
```

افتح الموقع في المتصفح، سجّل دخول، ارفع صورة، واتأكد إنها بتتعرض (ده بيختبر
صلاحيات `uploads/` + بثّ الملف المحمي). شوف الـ real-time (إشعارات/سوكِت)
عشان تتأكد إن الـ WebSocket عدّى من Nginx.

---

## 12) إعادة النشر (Deploy جديد)

```bash
su - aya
cd /var/www/aya
git pull
npm ci
npm run db:migrate:deploy     # لو فيه migrations جديدة
npm run build:web             # لو فيه تغييرات في الواجهة
pm2 reload all
```

> لاحظ: `uploads/` و `backups/` **مش** بيتأثروا لأنهم بره مجلد الكود (قسم 8).
> ده بالظبط سبب إننا طلّعناهم بره.

---

## 13) صيانة دورية

```bash
pm2 logs              # مراقبة الأخطاء
df -h                 # مساحة الديسك (الباك أب بيكبر)
sudo systemctl status mariadb nginx
```

- نظّف الباك أب القديم عبر `BACKUP_RETENTION_MAX` في `server/.env`.
- لو مستخدم Drive/S3، الـ retention البعيد بيتحكّم فيه `BACKUP_DRIVE_RETENTION_MAX`.

---

## ملخّص نقاط الصلاحيات (للمراجعة السريعة)

1. ما تشغّلش الـ app كـ root — استخدم مستخدم `aya`.
2. `uploads/` و `backups/` **بره** مجلد الكود، عبر `UPLOAD_DIR`/`BACKUP_DIR`.
3. `chown -R aya:aya` على مجلد الكود ومجلد التخزين.
4. `chmod 750` على مجلد التخزين، و`chmod 600` على ملفات `.env`.
5. الـ uploads مش static — سيبها ورا الـ API، ما تفتحهاش في Nginx.
6. اتأكد إن المستخدم `aya` يقدر يكتب في `uploads/` و`backups/` و`/tmp`.
