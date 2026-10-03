import React, { useState } from 'react';
import { useAuth, FIREBASE_CONSOLE_AUTH_URL } from '../context/AuthContext';
import { Department, AcademicLevel } from '../types';
import { DEPARTMENTS, LEVELS } from '../data/spacesData';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  User, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Info
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    signUpWithEmail, 
    signInWithEmail, 
    signInWithGoogle, 
    loginAsDemoStudent, 
    error, 
    firebaseConsoleNotice,
    clearError, 
    loading 
  } = useAuth();

  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState<Department>('Microbiology');
  const [level, setLevel] = useState<AcademicLevel>('100 Level');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showConsoleGuide, setShowConsoleGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in both email and password.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setLocalError('Please enter your full name or preferred student handle.');
          return;
        }
        await signUpWithEmail(email, password, displayName, department, level);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      // Error handled by AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 flex flex-col justify-center items-center px-4 py-8 sm:px-6 relative overflow-hidden">
      {/* Background ambient biological motifs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* Decorative blurred circles */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden relative z-10">
        {/* Banner Header with explicit requirements */}
        <div className="bg-emerald-900 text-white p-6 text-center relative">
          {/* Uploaded NABIOSOS Logo: Circular 90px with shadow */}
          <div className="mx-auto mb-3.5 flex items-center justify-center">
            <img
              src="/src/assets/images/nabiosos_logo_1791066638287.jpg"
              alt="NABIOSOS HUB Logo - Federal University Wukari"
              className="w-[90px] h-[90px] rounded-full object-cover shadow-2xl ring-4 ring-amber-400/90 bg-white"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* REQUIRED PROMPT STRINGS */}
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200 text-[11px] font-bold uppercase tracking-wider mb-1.5 border border-emerald-700">
            NABIOSOS HUB
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            WELCOME TO NABIOSOS
          </h2>
          <p className="text-xs font-semibold text-emerald-200 mt-0.5 tracking-wide">
            Federal University Wukari
          </p>
          <p className="text-[11px] text-emerald-300/80 mt-1 max-w-xs mx-auto">
            Faculty of Pure & Applied Sciences • Departmental Communities
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => { setMode('signup'); setLocalError(null); clearError(); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Create Account (Sign Up)
          </button>
          <button
            type="button"
            onClick={() => { setMode('signin'); setLocalError(null); clearError(); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Student Log In
          </button>
        </div>

        <div className="p-6">
          {/* Informational notification if Firebase Console toggle is pending */}
          {firebaseConsoleNotice && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{firebaseConsoleNotice}</p>
              </div>
            </div>
          )}

          {/* Error alerts */}
          {(error || localError) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{localError || error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                {/* Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name / Student Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Emmanuel Danjuma"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department *
                    </label>
                    <div className="relative">
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value as Department)}
                        className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Academic Level *
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as AcademicLevel)}
                      className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notice: No Profile Picture required */}
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No profile picture required. A custom academic badge is automatically assigned.</span>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@fuwukari.edu.ng or personal email"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Student Account' : 'Sign In to Hub'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alternative Quick Sign-in options */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Or Fast Access Options
            </div>

            <div className="w-full">
              {/* Google Sign In */}
              <button
                type="button"
                onClick={() => signInWithGoogle(department, level)}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3h3.86c2.26-2.09 3.68-5.17 3.68-9.1z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.37 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                <span>Continue with Google Account</span>
              </button>
            </div>

            {/* Firebase Console Guide Accordion */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConsoleGuide(!showConsoleGuide)}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center justify-between w-full cursor-pointer"
              >
                <span>Firebase Authentication Setup Info</span>
                <span>{showConsoleGuide ? '▲' : '▼'}</span>
              </button>

              {showConsoleGuide && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-800">
                    To enable native Firebase Email/Password in your project:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Open Firebase Console Authentication Settings</li>
                    <li>Click on <strong>Email/Password</strong> under Sign-in providers</li>
                    <li>Toggle <strong>Enable</strong> to ON and click <strong>Save</strong></li>
                  </ol>
                  <a
                    href={FIREBASE_CONSOLE_AUTH_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline mt-1"
                  >
                    <span>Open Firebase Console Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500">
            NABIOSOS HUB • Federal University Wukari, Taraba State, Nigeria
          </p>
        </div>
      </div>
    </div>
  );
};
