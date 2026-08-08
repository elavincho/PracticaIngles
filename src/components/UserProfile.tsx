import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Camera,
  Check,
  Save,
  Shield,
  Award,
  Flame,
  Sparkles,
  Calendar,
  Upload,
  X,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

interface UserProfileProps {
  user: User | null;
  onUpdateUser: (updated: User) => void;
}

// Preset avatars for quick selection
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=256'
];

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    occupation: user?.occupation || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || ''
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        occupation: user.occupation || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle local image file upload (converts to base64 Data URL)
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('La imagen seleccionada supera los 2MB. Elija una imagen más pequeña.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
          setErrorMsg('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetAvatar = (url: string) => {
    setFormData(prev => ({ ...prev, avatarUrl: url }));
    setShowAvatarPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updated = await api.updateProfile(formData);
      onUpdateUser(updated);
      setSuccessMsg('¡Perfil y datos de contacto actualizados con éxito!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      // If API error or DB disconnected, update locally so user interface updates gracefully
      if (user) {
        const localUpdated: User = {
          ...user,
          ...formData
        };
        onUpdateUser(localUpdated);
        setSuccessMsg('¡Perfil actualizado localmente!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(err.message || 'Error al guardar los cambios');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Inicie sesión para acceder a su perfil.
      </div>
    );
  }

  const roleLabel = user.role === 'admin' ? 'Administrador del Sistema' : 'Estudiante A1';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Abstract background shape */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 bg-indigo-950 flex items-center justify-center overflow-hidden shadow-2xl relative">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-indigo-600 text-white font-black text-3xl sm:text-4xl flex items-center justify-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-10 h-10" />}
                </div>
              )}

              {/* Photo edit trigger badge */}
              <label
                htmlFor="avatar-file-top"
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-xs font-bold gap-1"
              >
                <Camera className="w-5 h-5" />
                <span>Cambiar</span>
              </label>
              <input
                id="avatar-file-top"
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute -bottom-1 -right-1 bg-indigo-500 hover:bg-indigo-400 text-white p-2 rounded-full shadow-lg border-2 border-slate-900 transition-transform active:scale-95 cursor-pointer"
              title="Elegir o subir foto de perfil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User info summary */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                user.role === 'admin'
                  ? 'bg-amber-400 text-amber-950 border border-amber-300'
                  : 'bg-indigo-500/40 text-indigo-200 border border-indigo-400/30'
              }`}>
                {roleLabel}
              </span>
              <span className="text-slate-300 text-xs flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                Registrado {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'recientemente'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formData.name || user.name}
            </h1>
            <p className="text-slate-300 text-sm flex items-center justify-center md:justify-start gap-1.5 font-medium">
              <Mail className="w-4 h-4 text-indigo-300" />
              {formData.email || user.email}
            </p>

            {/* Quick stats badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs">
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold border border-white/10">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{user.points || 0} XP</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold border border-white/10">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span>Racha: {user.streak || 1} días</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold border border-white/10">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Nivel {user.unlockedLevel || 1} Unlocked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Avatars Modal / Drawer */}
      {showAvatarPicker && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              Seleccionar o Subir Foto de Perfil
            </h3>
            <button
              onClick={() => setShowAvatarPicker(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Custom file upload option */}
            <label className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
              <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Subir foto local</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">JPG, PNG o WEBP</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleImageFile(e);
                  setShowAvatarPicker(false);
                }}
                className="hidden"
              />
            </label>

            {/* Avatar presets */}
            {PRESET_AVATARS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPresetAvatar(url)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all p-1 hover:scale-105 cursor-pointer ${
                  formData.avatarUrl === url
                    ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-400/30'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-16 object-cover rounded-xl" />
                {formData.avatarUrl === url && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Remove image button */}
          {formData.avatarUrl && (
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, avatarUrl: '' }));
                  setShowAvatarPicker(false);
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
              >
                Quitar foto de perfil
              </button>
            </div>
          )}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Datos Personales y de Contacto
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Todos los datos de contacto son opcionales y sirven para personalizar tu perfil.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            Campos de contacto opcionales
          </span>
        </div>

        {/* Feedback alert messages */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
              Nombre Completo
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                Teléfono de Contacto
              </span>
              <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+591 70000000"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Ocupación / Profesión */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                Ocupación / Profesión
              </span>
              <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              placeholder="Ej. Estudiante, Ingeniero, Docente"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Dirección */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Dirección / Ciudad / País
              </span>
              <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ej. Av. Principal 123, La Paz, Bolivia"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* URL personalizada de foto (opcional) */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-500" />
                URL de Foto de Perfil (o sube tu imagen más arriba)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleChange}
              placeholder="https://ejemplo.com/mi-foto.jpg"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-xs"
            />
          </div>

          {/* Biografía / Sobre mí */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-500" />
                Sobre mí / Notas
              </span>
              <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Escribe una breve descripción sobre tus metas con el aprendizaje de inglés..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center space-x-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios de Perfil</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
