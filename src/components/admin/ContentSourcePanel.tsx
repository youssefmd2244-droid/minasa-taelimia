/**
 * ContentSourcePanel — اختيار "مصدر نشر المحتوى" من الإعدادات:
 *   - supabase (افتراضي): زي ما كان بالظبط، السحابة الحالية بتاعتك.
 *   - github: بيانات لوحة الإدارة (أقسام + محتوى) بتتنشر كملف JSON على
 *     ريبو GitHub عام، وأي مستخدم بيقرأه مباشرة من غير توكن.
 *   - both: بينشر على المكانين مع بعض (نسخة احتياطية إضافية).
 *
 * ملحوظة مهمة بتتعرض للأدمن هنا نفسه (مش مخفية): GitHub مناسب للنصوص/
 * بيانات JSON خفيفة بس — مش للصور/الفيديوهات الكبيرة (تفضل دايمًا على
 * Supabase Storage زي ما هي).
 */
import { useState, type CSSProperties } from 'react';
import { GitBranch, Check, Loader2, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import {
  getContentSource, setContentSource, getGithubConfig, setGithubConfig,
  testGithubConnection, type ContentSource, type GithubConfig,
} from '../../lib/githubStorage';

const SOURCE_LABELS: Record<ContentSource, string> = {
  supabase: 'Supabase (السحابة الحالية) — الافتراضي',
  github: 'GitHub فقط',
  both: 'الاثنين مع بعض (Supabase + GitHub)',
};

export default function ContentSourcePanel() {
  const [source, setSourceState] = useState<ContentSource>(() => getContentSource());
  const [cfg, setCfgState] = useState<GithubConfig>(() => getGithubConfig());
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const needsGithubFields = source === 'github' || source === 'both';

  const handleSourceChange = (v: ContentSource) => {
    setSourceState(v);
    setContentSource(v);
  };

  // بيحدّث state الفورم وكمان بيحفظ نفس اللحظة في localStorage. قبل كده كان
  // الحفظ الفعلي بيحصل بس لما تدوس "حفظ إعدادات GitHub" بالزرار، فلو حد دخل
  // البيانات ودوس على زرار "حفظ التغييرات" الكبير في الإعدادات (تحت) قبل ما
  // يدوس الزرار ده تحديدًا، كانت إعدادات GitHub بتتقرا فاضية وقت الحفظ
  // (owner/repo فاضيين) فالحفظ على GitHub كان بيفشل بصمت — وده اللي كان
  // بيمنع أي محتوى جديد إنه يظهر عند المستخدمين في وضع GitHub. دلوقتي أي
  // تغيير في أي حقل بيتحفظ فورًا زي ما بيحصل بالظبط مع اختيار المصدر نفسه.
  const updateCfg = (patch: Partial<GithubConfig>) => {
    const next = { ...cfg, ...patch };
    setCfgState(next);
    setGithubConfig(next);
  };

  const handleSaveConfig = () => {
    setGithubConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setGithubConfig(cfg); // نحفظ الإعدادات الحالية قبل الاختبار عشان الاختبار يقرا نفس القيم
    setTestStatus('testing');
    const result = await testGithubConnection();
    setTestStatus(result.ok ? 'ok' : 'error');
    setTestMessage(result.message || null);
  };

  const inp: CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-3">
        <GitBranch size={16} className="text-white/60" />
        <h3 className="text-base font-bold text-white">مصدر نشر المحتوى</h3>
      </div>
      <p className="text-xs text-white/40 mb-3">
        أي إضافة أو تعديل تعمله (أقسام، محتوى) هيتنشر تلقائيًا للمصدر (أو المصادر) اللي تختارها هنا.
      </p>

      <div className="space-y-2 mb-4">
        {(Object.keys(SOURCE_LABELS) as ContentSource[]).map((key) => (
          <button
            key={key}
            onClick={() => handleSourceChange(key)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-start transition-all"
            style={{
              background: source === key ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
              border: source === key ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: source === key ? '#f97316' : 'white',
            }}
          >
            <span className="font-medium">{SOURCE_LABELS[key]}</span>
            {source === key && <Check size={14} />}
          </button>
        ))}
      </div>

      {needsGithubFields && (
        <div className="space-y-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', color: '#fdba74' }}>
            <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              استخدم <strong>Fine-grained personal access token</strong> (مش Classic) مقيّد بالريبو ده بس، وبصلاحية
              <strong> Contents: Read and write</strong> فقط. الريبو نفسه لازم يكون <strong>عام (public)</strong> عشان المستخدمين يقدروا يقرأوا المحتوى بدون توكن.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-white/40 block mb-1">اسم المالك (owner)</label>
              <input type="text" value={cfg.owner} onChange={e => updateCfg({ owner: e.target.value.trim() })}
                placeholder="مثلاً: ghh" className="w-full px-3 py-2 rounded-xl text-white outline-none text-sm" style={inp} />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">اسم الريبو (repo)</label>
              <input type="text" value={cfg.repo} onChange={e => updateCfg({ repo: e.target.value.trim() })}
                placeholder="مثلاً: eduverse-content" className="w-full px-3 py-2 rounded-xl text-white outline-none text-sm" style={inp} />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">الفرع (branch)</label>
              <input type="text" value={cfg.branch} onChange={e => updateCfg({ branch: e.target.value.trim() || 'main' })}
                placeholder="main" className="w-full px-3 py-2 rounded-xl text-white outline-none text-sm" style={inp} />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">مسار الملف (path)</label>
              <input type="text" value={cfg.path} onChange={e => updateCfg({ path: e.target.value.trim() || 'content.json' })}
                placeholder="content.json" className="w-full px-3 py-2 rounded-xl text-white outline-none text-sm" style={inp} />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 block mb-1">GitHub Token (للنشر فقط — بيتحفظ على جهازك بس)</label>
            <div className="relative">
              <input type={showToken ? 'text' : 'password'} value={cfg.token} onChange={e => updateCfg({ token: e.target.value.trim() })}
                placeholder="github_pat_..." className="w-full px-3 py-2 rounded-xl text-white outline-none text-sm pe-10" style={{ ...inp, direction: 'ltr' }} />
              <button type="button" onClick={() => setShowToken(!showToken)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSaveConfig}
              className="flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
              style={{ background: saved ? 'rgba(107,191,122,0.18)' : 'white', color: saved ? '#6BBF7A' : '#0a0a1a' }}>
              {saved ? <><Check size={14} /> تم الحفظ</> : 'حفظ إعدادات GitHub'}
            </button>
            <button onClick={handleTest} disabled={testStatus === 'testing'}
              className="flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', cursor: testStatus === 'testing' ? 'wait' : 'pointer' }}>
              {testStatus === 'testing' ? <><Loader2 size={14} className="animate-spin" /> جاري الاختبار...</> : 'اختبار الاتصال'}
            </button>
          </div>

          {testStatus === 'ok' && (
            <p className="text-xs text-[#6BBF7A] flex items-center gap-1.5"><Check size={12} /> {testMessage}</p>
          )}
          {testStatus === 'error' && (
            <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle size={12} /> {testMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
