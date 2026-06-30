import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { Send, ThumbsUp, MessageCircle } from 'lucide-react';

interface Comment {
  id: number;
  name: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
  replies: Reply[];
}

interface Reply {
  id: number;
  name: string;
  text: string;
  time: string;
}

const INITIAL_COMMENTS: Comment[] = [
  { id: 1, name: 'أحمد علي', avatar: '🧑‍🎓', text: 'المنصة دي رائعة جداً! الشرح واضح والمحتوى ممتاز.', time: 'منذ ٢ ساعة', likes: 12, liked: false, replies: [{ id: 1, name: 'EDUVERSE', text: 'شكراً يا أحمد! سعيدين بتجربتك ❤️', time: 'منذ ١ ساعة' }] },
  { id: 2, name: 'سارة محمد', avatar: '👩‍🎓', text: 'الكورسات منظمة وسهل التنقل بينها. استفدت كتير من الرياضيات!', time: 'منذ ٥ ساعات', likes: 8, liked: false, replies: [] },
  { id: 3, name: 'عمر حسن', avatar: '👨‍💻', text: 'تطبيق ممتاز وسريع. بس كنت عايز فيديوهات أكتر في قسم العلوم.', time: 'منذ يوم', likes: 5, liked: false, replies: [] },
];

export default function StudentComments() {
  const { dir } = useLanguage();
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [newText, setNewText] = useState('');
  const [newName, setNewName] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const addComment = () => {
    if (!newText.trim() || !newName.trim()) return;
    setComments((prev) => [{
      id: Date.now(), name: newName.trim(), avatar: '👤',
      text: newText.trim(), time: 'الآن', likes: 0, liked: false, replies: [],
    }, ...prev]);
    setNewText(''); setNewName('');
  };

  const toggleLike = (id: number) => {
    setComments((prev) => prev.map((c) =>
      c.id === id ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
    ));
  };

  const addReply = (commentId: number) => {
    if (!replyText.trim()) return;
    setComments((prev) => prev.map((c) =>
      c.id === commentId
        ? { ...c, replies: [...c.replies, { id: Date.now(), name: 'طالب', text: replyText.trim(), time: 'الآن' }] }
        : c
    ));
    setReplyText(''); setReplyingTo(null);
  };

  return (
    <section dir={dir} style={{ background: '#07070f', padding: '80px 0' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '48px' }}>
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
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={newText} onChange={(e) => setNewText(e.target.value)}
              placeholder={dir === 'rtl' ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
              rows={3}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', textAlign: dir === 'rtl' ? 'right' : 'left' }}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addComment(); }}
            />
            <button onClick={addComment} style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f97316', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AnimatePresence>
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
                    {comment.avatar}
                  </div>
                  <div style={{ flex: 1, textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{comment.name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{comment.time}</div>
                  </div>
                </div>

                {/* Comment text */}
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '14px', textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                  {comment.text}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button onClick={() => toggleLike(comment.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: comment.liked ? '#f97316' : 'rgba(255,255,255,0.4)', fontSize: '13px', transition: 'color 200ms' }}>
                    <ThumbsUp size={14} fill={comment.liked ? '#f97316' : 'none'} />
                    {comment.likes}
                  </button>
                  <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                    <MessageCircle size={14} />
                    {dir === 'rtl' ? 'رد' : 'Reply'}
                  </button>
                </div>

                {/* Reply input */}
                <AnimatePresence>
                  {replyingTo === comment.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <input
                        value={replyText} onChange={(e) => setReplyText(e.target.value)}
                        placeholder={dir === 'rtl' ? 'اكتب ردك...' : 'Write reply...'}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'white', fontSize: '13px', outline: 'none', textAlign: dir === 'rtl' ? 'right' : 'left' }}
                        onKeyDown={(e) => { if (e.key === 'Enter') addReply(comment.id); }}
                      />
                      <button onClick={() => addReply(comment.id)} style={{ padding: '8px 14px', borderRadius: '10px', background: '#f97316', border: 'none', color: 'white', fontSize: '13px', cursor: 'pointer' }}>
                        {dir === 'rtl' ? 'ارسل' : 'Send'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div style={{ marginTop: '14px', paddingInlineStart: '20px', borderInlineStart: '2px solid rgba(249,115,22,0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {comment.replies.map((reply) => (
                      <div key={reply.id}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f97316', marginBottom: '2px', textAlign: dir === 'rtl' ? 'right' : 'left' }}>{reply.name}</div>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', textAlign: dir === 'rtl' ? 'right' : 'left' }}>{reply.text}</p>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{reply.time}</span>
                      </div>
                    ))}
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
