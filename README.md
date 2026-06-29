# EduVerse — دليل إعداد GitHub + Real-time + Admin Storage

## ⚡ الملخص السريع

| الميزة | كيف تشتغل |
|--------|-----------|
| **Deploy تلقائي** | Push على `main` → GitHub Actions → موقع يُحدَّث في ثوانٍ |
| **Real-time لكل المستخدمين** | Supabase Realtime WebSocket — بدون refresh |
| **تخزين محلي على جهاز الأدمن** | `useAdminStorage` → localStorage أولاً ثم Supabase |
| **Offline support** | العمليات تُخزَّن محلياً وتُرسل لما الإنترنت يرجع |

---

## 📋 خطوات الإعداد (مرة واحدة فقط)

### 1. رفع المشروع على GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/eduverse.git
git push -u origin main
```

### 2. تفعيل GitHub Pages

1. روح **Settings → Pages**
2. **Source** → اختار **GitHub Actions**
3. خلاص — أول push هيعمل deploy تلقائي

### 3. إضافة Supabase Secrets في GitHub

روح **Settings → Secrets and variables → Actions → New repository secret**:

| اسم السر | القيمة |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (الـ anon public key) |

> تلاقيهم في Supabase Dashboard: **Project Settings → API**

### 4. تشغيل Migration الجديدة

في Supabase SQL Editor:
```sql
-- الصق محتوى supabase/migrations/0002_realtime_fixes.sql وشغّله
```

### 5. تفعيل Realtime في Supabase

في Supabase Dashboard:
1. **Database → Replication**
2. تأكد إن الجداول دي موجودة في `supabase_realtime`:
   - ✅ `sections`
   - ✅ `content`
   - ✅ `app_settings`
   - ✅ `comments`

---

## 🔄 كيف يشتغل الـ Real-time

```
الأدمن يعدّل محتوى
        ↓
useAdminStorage.ts
    ├─ يحفظ في localStorage (فوري — optimistic)
    └─ يرسل لـ Supabase
                ↓
        Supabase Postgres
                ↓
    Realtime WebSocket يُذيع التغيير
                ↓
    كل المستخدمين المفتوحين يتلقون الحدث
                ↓
    useSections / useContent يعملوا refresh()
                ↓
        ✅ الشاشة تتحدث بدون refresh — في < 1 ثانية
```

---

## 💾 كيف يشتغل التخزين المحلي على جهاز الأدمن

### `useAdminStorage.ts` — الـ Hook الرئيسي

```tsx
import { useAdminStorage } from '../hooks/useAdminStorage';

function AdminDashboard() {
  const {
    adminCreateSection,
    adminUpdateSection,
    adminDeleteSection,
    adminUpdateContent,
    adminDeleteContent,
    syncStatus,
    syncLabel,
    pendingCount,
    lastSync,
    syncNow,
  } = useAdminStorage();

  // مثال: إضافة قسم جديد
  await adminCreateSection('رياضيات — المستوى الثاني');
  // ↑ يُحفظ في localStorage فوراً + يُرسل لـ Supabase + يظهر لكل المستخدمين
}
```

### مفاتيح localStorage على جهاز الأدمن

| المفتاح | ماذا يخزّن |
|---------|-----------|
| `eduverse_admin_sections` | نسخة cache من الأقسام |
| `eduverse_admin_content` | نسخة cache من المحتوى |
| `eduverse_admin_pending_queue` | العمليات المنتظرة (لو Offline) |
| `eduverse_admin_last_sync` | وقت آخر مزامنة ناجحة |

### عرض حالة المزامنة في الواجهة

```tsx
import { SyncStatusBar } from '../components/admin/SyncStatusBar';

<SyncStatusBar
  status={syncStatus}
  label={syncLabel}
  pendingCount={pendingCount}
  lastSync={lastSync}
  onSyncNow={syncNow}
/>
```

---

## 🏗️ هيكل الملفات الجديدة

```
src/
├── hooks/
│   └── useAdminStorage.ts      ← التخزين المحلي + المزامنة
└── components/
    └── admin/
        └── SyncStatusBar.tsx   ← شريط حالة المزامنة

.github/
└── workflows/
    └── deploy.yml              ← Deploy تلقائي + Build APK

supabase/
└── migrations/
    └── 0002_realtime_fixes.sql ← Realtime + policies محدّثة
```

---

## 🚀 Workflow يومي للأدمن

```
1. افتح AdminDashboard
2. أضف / عدّل / امسح أي محتوى
3. التغيير يُحفظ فوراً على جهازك
4. في نفس الثانية يظهر لكل المستخدمين عبر Realtime
5. SyncStatusBar يأكد نجاح المزامنة ✅
```

### لو الإنترنت قطع:

```
1. تعدّل بالاعتيادي
2. التعديلات تتحفظ في queue محلي على جهازك
3. SyncStatusBar يقول: "📵 غير متصل — X عمليات في الانتظار"
4. لما الإنترنت يرجع → كل العمليات ترتفع تلقائياً
5. ✅ المستخدمون يشوفوا التغييرات
```

---

## 📦 GitHub Actions Workflows

### `deploy.yml` — Deploy تلقائي
- **Trigger**: كل push على `main`
- **Job 1**: Build → Deploy to GitHub Pages
- **Job 2**: Build Android APK (artifact لـ 30 يوم)

### `android.yml` — Build APK يدوي
- **Trigger**: يدوي من GitHub → Actions → Run workflow
- يبني APK Debug ويرفعه كـ artifact

---

## 🔑 ملاحظات أمان

- **ANON KEY** في GitHub Secrets آمن ✅ (مش في الكود)
- **RLS policies** في Supabase تحمي البيانات ✅
- **Admin operations** تمر عبر service role server-side ✅
- **localStorage** فقط على جهاز الأدمن — مش بيانات حساسة ✅
