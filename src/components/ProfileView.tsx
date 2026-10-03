import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Department, AcademicLevel } from '../types';
import { DEPARTMENTS, LEVELS } from '../data/spacesData';
import { 
  UserCircle, 
  GraduationCap, 
  Save, 
  LogOut, 
  Check, 
  Sparkles, 
  Mail, 
  Phone, 
  ShieldCheck, 
  BookOpen, 
  Palette,
  Camera,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

const BADGE_COLORS = [
  { name: 'Emerald', class: 'bg-emerald-600' },
  { name: 'Forest', class: 'bg-green-700' },
  { name: 'Amber Gold', class: 'bg-amber-600' },
  { name: 'Teal', class: 'bg-teal-600' },
  { name: 'Cyan', class: 'bg-cyan-600' },
  { name: 'Royal Blue', class: 'bg-blue-600' },
  { name: 'Indigo', class: 'bg-indigo-600' },
  { name: 'Rose', class: 'bg-rose-600' }
];

export const ProfileView: React.FC = () => {
  const { userProfile, updateUserProfile, logOut, currentUser } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [department, setDepartment] = useState<Department>(userProfile?.department || 'Microbiology');
  const [level, setLevel] = useState<AcademicLevel>(userProfile?.level || '100 Level');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [avatarColor, setAvatarColor] = useState(userProfile?.avatarColor || 'bg-emerald-600');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'NB';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  // Handle local photo file upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 2MB for avatar data URL)
    if (file.size > 2 * 1024 * 1024) {
      alert('Please choose an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoURL(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        department,
        level,
        bio: bio.trim(),
        phoneNumber: phoneNumber.trim(),
        avatarColor,
        photoURL
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      {/* Header Profile Showcase */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {/* Profile Picture / Avatar */}
          <div className="relative group shrink-0">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName || 'User Profile'}
                className="w-24 h-24 rounded-2xl object-cover shadow-xl ring-4 ring-amber-400/90 bg-white"
              />
            ) : (
              <div className={`w-24 h-24 rounded-2xl ${avatarColor} text-white font-black text-3xl flex items-center justify-center shadow-xl ring-4 ring-amber-400/90`}>
                {getInitials(displayName || userProfile?.displayName)}
              </div>
            )}

            {/* Change photo button */}
            <label className="absolute -bottom-2 -right-2 p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-800 border border-emerald-700 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Real Registered Student Scholar
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white truncate uppercase">
              {displayName || userProfile?.displayName}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200 mt-0.5">
              Federal University Wukari • {department} ({level})
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>{userProfile?.email || currentUser?.email}</span>
              </span>
              {phoneNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{phoneNumber}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">
              Academic & Contact Profile Settings
            </h3>
            <p className="text-xs text-slate-500">
              Update your real student credentials, department, and contact information
            </p>
          </div>

          {savedSuccess && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Changes Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name or Student Handle *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Department and Level Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Academic Level *
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as AcademicLevel)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {LEVELS.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone / WhatsApp Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone / WhatsApp Number (For Market & Study Inquiries)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 08123456789 or +234..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Profile Picture URL or Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Profile Photo (Upload from device or enter URL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={photoURL.startsWith('data:') ? 'Image uploaded from device' : photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="Paste image URL (https://...) or upload below"
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Academic Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Academic Bio & Research Focus
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your academic interests, courses, or study group preferences..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Color Palette fallback */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Avatar Background Accent
            </label>
            <div className="flex flex-wrap gap-2">
              {BADGE_COLORS.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setAvatarColor(c.class)}
                  className={`w-8 h-8 rounded-full ${c.class} flex items-center justify-center transition-transform cursor-pointer ${
                    avatarColor === c.class ? 'ring-2 ring-offset-2 ring-emerald-600 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                >
                  {avatarColor === c.class && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={logOut}
              className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Hub</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
