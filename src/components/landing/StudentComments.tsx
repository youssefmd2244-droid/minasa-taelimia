import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { Send, ThumbsUp, Clock } from 'lucide-react';
import {
  fetchVisibleComments,
  submitComment,
  subscribeComments,
  type PublicCommentRow,
} from '../../lib/commentsBridge';

export default function StudentComments() {
  const { dir } = useLanguage();
  const [comments, setComments] = useState<PublicCommentRow[]>([]);
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [newText, setNewText] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValidPhone = (phone: string) => /^01[0-9]{9}$/.test(phone.trim());

  const refresh = useCallback(() => {
    fetchVisibleComments().then(setComments);
  }, []);

  useEffect(() => {
    refresh();
    // يسمع لأي موافقة/تعليق جديد فورًا بدون إعادة تحميل الصفحة
    const unsubscribe = subscribeComments(refresh);
    return unsubscribe;
  }, [refresh]);

  const addComment = async () => {
    if (submitting) return;
    if (!newName.trim()) { setError(dir === 'rtl' ? 'من فضلك اكتب اسمك' : 'Please enter your name'); return; }
    if (!isValidPhone(newPhone)) { setError(dir === 'rtl' ? 'رقم الهاتف غير صحيح (مثال: 01012345678)' : 'Invalid phone number (e.g. 01012345678)'); return; }
    if (!newText.trim()) { setError(dir === 'rtl' ? 'من فضلك اكتب تعليقك' : 'Please write your comment'); return; }
    setError('');
    setSubmitting(true);
    const result = await submitComment(newName, newPhone, newText);
    setSubmitting(false);
    if (!result.ok) {
      setError(dir === 'rtl' ? 'تعذّر إرسال التعليق، حاول مرة أخرى' : 'Could not send comment, please try again');
      return;
    }
    setNewText(''); setNewName(''); setNewPhone('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const toggleLike = (id: number) => {
    setLikedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US'); } catch { return ''; }
  };

  return (
    <section dir={dir} style={{ background: '#07070f', padding: '80px 0' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div className="reveal-3d" style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', color: '#f97316', textTransform: 'uppercase' }}>
            {dir === 'rtl' ? 'آراء الطلاب' : 'Student Reviews'}
          </span>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 800, color: 'white', marginTop: '12px', fontFamily: "'Cairo', sans-serif" }}>
            {dir === 'rtl' ? 'شاركنا رأيك' : 'Share Your Thoughts'}
          </h2>
        </div>

        {/* Add Comment Box */}
        <div className="reveal admin-card" style={{ padding: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexDirection: dir === 'rtl' ? 'row' : 'row-reverse' }}>
            <input
              value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder={dir === 'rtl' ? 'اسمك...' : 'Your name...'}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 16px', color: 'white', fontSize: '14px', outline: 'none', textAlign: dir === 'rtl' ? 'right' : 'left' }}
            />
            <input
              value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={dir === 'rtl' ? 'رقم الهاتف...' : 'Phone number...'}
              type="tel" maxLength={11}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 16px', color: 'white', fontSize: '14px', outline: 'none', textAlign: dir === 'rtl' ? 'right' : 'left', direction: 'ltr' }}
            />
          </div>
          {error && (
            <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '10px', textAlign: dir === 'rtl' ? 'right' : 'left' }}>{error}</p>
          )}
          {submitted && (
            <p style={{ color: '#6BBF7A', fontSize: '12px', marginBottom: '10px', textAlign: dir === 'rtl' ? 'right' : 'left' }}>
              {dir === 'rtl' ? '✅ تم إرسال تعليقك! سيظهر للجميع بعد مراجعته من الإدارة.' : '✅ Comment sent! It will appear after review.'}
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={newText} onChange={(e) => setNewText(e.target.value)}
              placeholder={dir === 'rtl' ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
              rows={3}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', textAlign: dir === 'rtl' ? 'right' : 'left' }}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addComment(); }}
            />
            <button onClick={addComment} disabled={submitting}
              style={{ width: '48px', height: '48px', borderRadius: '12px', background: submitting ? 'rgba(249,115,22,0.5)' : '#f97316', border: 'none', color: 'white', cursor: submitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AnimatePresence>
            {comments.length === 0 && (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                {dir === 'rtl' ? 'لا توجد تعليقات بعد — كن أول من يشارك رأيه!' : 'No comments yet — be the first to share!'}
              </p>
            )}
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-card"
                style={{ padding: '20px' }}
              >
                {/* Comment header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexDirection: dir === 'ltr' ? 'row' : 'row-reverse' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    👤
                  </div>
                  <div style={{ flex: 1, textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{comment.name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {formatTime(comment.created_at)}
                    </div>
                  </div>
                </div>

                {/* Comment text */}
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '14px', textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                  {comment.comment_text}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button onClick={() => toggleLike(comment.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: likedIds.includes(comment.id) ? '#f97316' : 'rgba(255,255,255,0.4)', fontSize: '13px', transition: 'color 200ms' }}>
                    <ThumbsUp size={14} fill={likedIds.includes(comment.id) ? '#f97316' : 'none'} />
                    {likedIds.includes(comment.id) ? 1 : 0}
                  </button>
                </div>

                {/* Admin reply */}
                {comment.reply_text && (
                  <div style={{ marginTop: '14px', paddingInlineStart: '20px', borderInlineStart: '2px solid rgba(249,115,22,0.25)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f97316', marginBottom: '2px', textAlign: dir === 'rtl' ? 'right' : 'left' }}>EDUVERSE</div>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', textAlign: dir === 'rtl' ? 'right' : 'left' }}>{comment.reply_text}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
