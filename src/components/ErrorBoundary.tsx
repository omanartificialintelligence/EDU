
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "حدث خطأ غير متوقع في النظام.";
      let isQuotaError = false;

      try {
        const errorData = JSON.parse(this.state.error?.message || "{}");
        if (errorData.error && (errorData.error.includes("Quota limit exceeded") || errorData.error.includes("Quota exceeded"))) {
          isQuotaError = true;
          errorMessage = "تم تجاوز حصة الاستخدام اليومية لخدمة قاعدة البيانات (Firestore Quota Exceeded). سيتم تصفير الحصة تلقائياً غداً. يرجى المحاولة مرة أخرى لاحقاً.";
        } else if (errorData.error) {
          errorMessage = `خطأ في قاعدة البيانات: ${errorData.error}`;
        }
      } catch (e) {
        // Not a JSON error
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-['Tajawal']" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">عذراً، حدث خطأ</h2>
              <p className="text-slate-500 text-sm font-bold leading-relaxed">
                {errorMessage}
              </p>
              {isQuotaError && (
                <p className="text-[10px] text-slate-400 mt-2">
                  يمكنك العثور على مزيد من المعلومات حول حصص الاستخدام في خطة Spark على موقع Firebase.
                </p>
              )}
            </div>

            <button 
              onClick={this.handleReset}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
