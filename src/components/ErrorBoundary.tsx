import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * ErrorBoundary — يمنع "الشاشة السودة".
 * -----------------------------------------------------------------------
 * في React، أي خطأ يحصل أثناء الـ render (في أي مكوّن مهما كان) يخلي
 * React يلغي عرض الشجرة كلها فورًا — يعني بدل ما يظهر خطأ، الشاشة
 * بتفضل سودة/فاضية تمامًا زي ما بيحصل دلوقتي، من غير أي رسالة توضح
 * السبب لا للمستخدم ولا للمطوّر.
 *
 * هذا المكوّن يلف التطبيق كله في main.tsx، فيمسك أي خطأ زي ده ويعرض
 * بدل الشاشة السودة: رسالة واضحة + تفاصيل الخطأ (مفيدة جدًا للتشخيص)
 * + زرار "إعادة المحاولة" يعيد تحميل الصفحة.
 *
 * ملاحظة مهمة: هذا لا "يصلح" سبب الكراش نفسه — هو فقط يمنع اختفاء
 * الشاشة بالكامل ويوضح لنا *أين* المشكلة، عشان يبقى ممكن نصلحها فعليًا.
 */

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // eslint-disable-next-line no-console
    console.error('[EduVerse] كراش تم اعتراضه بواسطة ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '';
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        dir="rtl"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: '#05050f',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: "'Cairo', sans-serif",
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
          حصل خطأ غير متوقع
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px', maxWidth: '420px' }}>
          التطبيق واجه مشكلة أثناء التشغيل. اضغط "إعادة المحاولة" — لو تكررت
          المشكلة، ابعت التفاصيل اللي تحت للمطوّر.
        </p>
        <button
          onClick={this.handleReload}
          style={{
            padding: '12px 28px',
            borderRadius: '999px',
            background: '#f97316',
            border: 'none',
            color: 'white',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          إعادة المحاولة
        </button>
        {this.state.error && (
          <details style={{ maxWidth: '90%', width: '600px', textAlign: 'left' }} dir="ltr">
            <summary style={{ cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              تفاصيل تقنية (لإرسالها للمطوّر)
            </summary>
            <pre
              style={{
                marginTop: '10px',
                fontSize: '11px',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px',
                maxHeight: '240px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.toString()}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        )}
      </div>
    );
  }
}
