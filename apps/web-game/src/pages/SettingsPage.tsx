import React, { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Lock,
  Palette,
  Save,
  School,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react';

type UserRole = 'student' | 'teacher' | 'admin';

interface CurrentUser {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

interface UiPreferences {
  fontSize: number;
  highContrast: boolean;
  reduceMotion: boolean;
}

interface NotificationPreferences {
  appNotifications: boolean;
  emailNotifications: boolean;
  reviewAlerts: boolean;
  performanceAlerts: boolean;
  badgeAlerts: boolean;
}

interface TeacherPreferences {
  defaultSchoolName: string;
  defaultGradeLevel: string;
  moderationMode: 'manual' | 'guided' | 'strict';
  reportFormat: 'csv' | 'pdf';
  guardianDigest: boolean;
}

interface StudentPreferences {
  gameplayLanguage: 'tr' | 'en';
  soundEnabled: boolean;
  musicEnabled: boolean;
  hintsEnabled: boolean;
  allowRetries: boolean;
  profileVisibleInClass: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const defaultUiPreferences: UiPreferences = {
  fontSize: 16,
  highContrast: false,
  reduceMotion: false,
};

const defaultNotificationPreferences: NotificationPreferences = {
  appNotifications: true,
  emailNotifications: false,
  reviewAlerts: true,
  performanceAlerts: true,
  badgeAlerts: true,
};

const defaultTeacherPreferences: TeacherPreferences = {
  defaultSchoolName: '',
  defaultGradeLevel: '6',
  moderationMode: 'guided',
  reportFormat: 'csv',
  guardianDigest: false,
};

const defaultStudentPreferences: StudentPreferences = {
  gameplayLanguage: 'tr',
  soundEnabled: true,
  musicEnabled: true,
  hintsEnabled: true,
  allowRetries: true,
  profileVisibleInClass: true,
};

const readPreference = <T,>(key: string, fallback: T): T => {
  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return { ...fallback, ...JSON.parse(rawValue) };
  } catch {
    return fallback;
  }
};

const applyUiPreferences = (preferences: UiPreferences) => {
  document.documentElement.style.fontSize = `${preferences.fontSize}px`;
  document.documentElement.classList.toggle('high-contrast', preferences.highContrast);
  document.documentElement.classList.toggle('reduced-motion', preferences.reduceMotion);
  window.localStorage.setItem('ui_preferences', JSON.stringify(preferences));
};

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(var(--bg-surface-rgb), 0.96), rgba(var(--bg-surface-rgb), 0.9))',
  border: '1px solid rgba(var(--primary-rgb), 0.12)',
  borderRadius: '20px',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
  padding: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '1.15rem',
  fontWeight: 700,
  marginBottom: '18px',
};

const fieldGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const inputStyle: React.CSSProperties = {
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  padding: '12px 14px',
  fontSize: '0.95rem',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  border: 'none',
  borderRadius: '12px',
  padding: '12px 16px',
  background: 'var(--primary-color)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
};

const toggleRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 0',
  borderBottom: '1px solid rgba(var(--primary-rgb), 0.08)',
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '999px',
  padding: '8px 12px',
  background: 'rgba(var(--primary-rgb), 0.1)',
  color: 'var(--text-primary)',
  fontWeight: 600,
  fontSize: '0.85rem',
};

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', password: '' });
  const [uiPreferences, setUiPreferences] = useState<UiPreferences>(defaultUiPreferences);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const [teacherPreferences, setTeacherPreferences] = useState<TeacherPreferences>(defaultTeacherPreferences);
  const [studentPreferences, setStudentPreferences] = useState<StudentPreferences>(defaultStudentPreferences);
  const [classroomAccessCode, setClassroomAccessCode] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingLocalSettings, setIsSavingLocalSettings] = useState(false);
  const [isJoiningClassroom, setIsJoiningClassroom] = useState(false);

  const token = window.localStorage.getItem('token');

  const roleLabel = useMemo(() => {
    if (!currentUser) return '';
    if (currentUser.role === 'admin') return 'Yönetici / Öğretmen';
    if (currentUser.role === 'teacher') return 'Öğretmen';
    return 'Öğrenci';
  }, [currentUser]);

  useEffect(() => {
    const storedUser = window.localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        setProfileForm({
          full_name: parsedUser.full_name || '',
          email: parsedUser.email || '',
          password: '',
        });
      } catch {
        // ignore invalid local data
      }
    }

    setUiPreferences(readPreference('ui_preferences', defaultUiPreferences));
    setNotificationPreferences(readPreference('notification_preferences', defaultNotificationPreferences));
    setTeacherPreferences(readPreference('teacher_preferences', defaultTeacherPreferences));
    setStudentPreferences(readPreference('student_preferences', defaultStudentPreferences));
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Kullanıcı bilgileri alınamadı.');
        }
        return response.json();
      })
      .then((user: CurrentUser) => {
        setCurrentUser(user);
        setProfileForm((prev) => ({
          ...prev,
          full_name: user.full_name || '',
          email: user.email || '',
        }));
        window.localStorage.setItem('user', JSON.stringify(user));
      })
      .catch((fetchError) => setError(fetchError.message));
  }, [token]);

  useEffect(() => {
    applyUiPreferences(uiPreferences);
  }, [uiPreferences]);

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setIsSavingProfile(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail || 'Profil güncellenemedi.');
      }

      setCurrentUser(payload);
      setProfileForm((prev) => ({ ...prev, password: '' }));
      window.localStorage.setItem('user', JSON.stringify(payload));
      setFeedback('Hesap bilgileri güncellendi.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Profil kaydedilemedi.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLocalSettingsSave = () => {
    setIsSavingLocalSettings(true);
    setFeedback(null);
    setError(null);

    window.localStorage.setItem('notification_preferences', JSON.stringify(notificationPreferences));
    window.localStorage.setItem('teacher_preferences', JSON.stringify(teacherPreferences));
    window.localStorage.setItem('student_preferences', JSON.stringify(studentPreferences));
    window.localStorage.setItem('language', i18n.language);

    setTimeout(() => {
      setIsSavingLocalSettings(false);
      setFeedback('Tercihler bu cihaz için kaydedildi.');
    }, 250);
  };

  const handleJoinClassroom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !classroomAccessCode.trim()) return;

    setIsJoiningClassroom(true);
    setFeedback(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('access_code', classroomAccessCode.trim().toUpperCase());

      const response = await fetch(`${API_URL}/classrooms/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail || 'Sınıfa katılım başarısız.');
      }

      setClassroomAccessCode('');
      setFeedback(payload.message || 'Sınıfa başarıyla katıldın.');
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Sınıfa katılım sırasında hata oluştu.');
    } finally {
      setIsJoiningClassroom(false);
    }
  };

  const renderToggle = (
    title: string,
    description: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
  ) => (
    <div style={toggleRowStyle}>
      <div>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{title}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{description}</div>
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      </label>
    </div>
  );

  return (
    <MainLayout>
      <div style={{ padding: '32px', maxWidth: '1240px', margin: '0 auto' }}>
        <div
          style={{
            background:
              'radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.24), transparent 35%), linear-gradient(135deg, rgba(var(--bg-surface-rgb), 0.95), rgba(var(--bg-surface-rgb), 0.78))',
            borderRadius: '28px',
            padding: '28px',
            border: '1px solid rgba(var(--primary-rgb), 0.16)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ ...chipStyle, marginBottom: '14px', width: 'fit-content' }}>
                <Sparkles size={16} /> Sistem Ayarları
              </div>
              <h1 style={{ margin: 0, fontSize: '2.2rem' }}>Deneyimini rolüne göre yönet</h1>
              <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', maxWidth: '720px', lineHeight: 1.6 }}>
                Ortak ayarlar tüm kullanıcılara açıktır. Öğretmen ve öğrenciye özel tercihler ise yalnızca ilgili rolde görünür.
              </p>
            </div>
            <div style={{ minWidth: '240px', ...cardStyle, padding: '18px 20px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>Aktif Profil</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{currentUser?.full_name || 'Kullanıcı'}</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{currentUser?.email || 'E-posta bulunamadı'}</div>
              <div style={{ marginTop: '12px', ...chipStyle }}>{roleLabel}</div>
            </div>
          </div>
        </div>

        {(feedback || error) && (
          <div
            style={{
              ...cardStyle,
              marginBottom: '24px',
              borderColor: error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
              color: error ? 'var(--error-color)' : 'var(--success-color)',
            }}
          >
            {error || feedback}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div style={{ display: 'grid', gap: '24px' }}>
            <section style={cardStyle}>
              <div style={sectionTitleStyle}>
                <User size={20} /> Hesap Ayarları
              </div>
              <form onSubmit={handleProfileSave}>
                <div style={fieldGridStyle}>
                  <label style={fieldStyle}>
                    <span>Ad Soyad</span>
                    <input
                      style={inputStyle}
                      value={profileForm.full_name}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))}
                      placeholder="Adınızı girin"
                    />
                  </label>
                  <label style={fieldStyle}>
                    <span>E-posta</span>
                    <input
                      style={inputStyle}
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="ornek@mail.com"
                    />
                  </label>
                  <label style={fieldStyle}>
                    <span>Yeni Şifre</span>
                    <input
                      style={inputStyle}
                      type="password"
                      value={profileForm.password}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="Değiştirmek istemiyorsanız boş bırakın"
                    />
                  </label>
                </div>
                <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Bu bölüm doğrudan hesabınıza kaydedilir.
                  </div>
                  <button type="submit" style={buttonStyle} disabled={isSavingProfile}>
                    <Save size={16} /> {isSavingProfile ? 'Kaydediliyor...' : 'Profili Kaydet'}
                  </button>
                </div>
              </form>
            </section>

            <section style={cardStyle}>
              <div style={sectionTitleStyle}>
                <Palette size={20} /> Görünüm ve Dil
              </div>
              <div style={fieldGridStyle}>
                <label style={fieldStyle}>
                  <span>Tema</span>
                  <select style={selectStyle} value={theme} onChange={(event) => setTheme(event.target.value as 'light' | 'dark')}>
                    <option value="light">Açık Tema</option>
                    <option value="dark">Koyu Tema</option>
                  </select>
                </label>
                <label style={fieldStyle}>
                  <span>Dil</span>
                  <select
                    style={selectStyle}
                    value={i18n.language}
                    onChange={(event) => {
                      i18n.changeLanguage(event.target.value);
                      window.localStorage.setItem('language', event.target.value);
                    }}
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label style={fieldStyle}>
                  <span>Yazı Boyutu</span>
                  <select
                    style={selectStyle}
                    value={String(uiPreferences.fontSize)}
                    onChange={(event) => setUiPreferences((prev) => ({ ...prev, fontSize: Number(event.target.value) }))}
                  >
                    <option value="14">Küçük</option>
                    <option value="16">Orta</option>
                    <option value="18">Büyük</option>
                  </select>
                </label>
              </div>
              <div style={{ marginTop: '10px' }}>
                {renderToggle(
                  'Yüksek kontrast',
                  'Özellikle uzun kullanımda metin ve butonları daha belirgin hale getirir.',
                  uiPreferences.highContrast,
                  (checked) => setUiPreferences((prev) => ({ ...prev, highContrast: checked })),
                )}
                {renderToggle(
                  'Hareketi azalt',
                  'Animasyon ve geçişleri azaltarak daha sakin bir deneyim sunar.',
                  uiPreferences.reduceMotion,
                  (checked) => setUiPreferences((prev) => ({ ...prev, reduceMotion: checked })),
                )}
              </div>
            </section>

            <section style={cardStyle}>
              <div style={sectionTitleStyle}>
                <Bell size={20} /> Bildirimler
              </div>
              {renderToggle(
                'Uygulama içi bildirimler',
                'Panel içinde durum ve işlem geri bildirimleri gösterilir.',
                notificationPreferences.appNotifications,
                (checked) => setNotificationPreferences((prev) => ({ ...prev, appNotifications: checked })),
              )}
              {renderToggle(
                'E-posta bildirimleri',
                'Kritik olaylar için e-posta alırsın. Backend tarafında sonraki sürümde genişletilecek.',
                notificationPreferences.emailNotifications,
                (checked) => setNotificationPreferences((prev) => ({ ...prev, emailNotifications: checked })),
              )}
              {renderToggle(
                'İnceleme ve onay uyarıları',
                'Oyun moderasyonu, değerlendirme ve durum değişikliklerini takip et.',
                notificationPreferences.reviewAlerts,
                (checked) => setNotificationPreferences((prev) => ({ ...prev, reviewAlerts: checked })),
              )}
              {renderToggle(
                'Performans sinyalleri',
                'Düşük performans, ilerleme düşüşü ve dikkat gerektiren durumlar için uyarı üretir.',
                notificationPreferences.performanceAlerts,
                (checked) => setNotificationPreferences((prev) => ({ ...prev, performanceAlerts: checked })),
              )}
              {renderToggle(
                'Rozet ve başarı uyarıları',
                'Yeni rozet veya kilometre taşı kazanımlarını görünür kılar.',
                notificationPreferences.badgeAlerts,
                (checked) => setNotificationPreferences((prev) => ({ ...prev, badgeAlerts: checked })),
              )}
            </section>

            {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
              <section style={cardStyle}>
                <div style={sectionTitleStyle}>
                  <GraduationCap size={20} /> Öğretmen Ayarları
                </div>
                <div style={fieldGridStyle}>
                  <label style={fieldStyle}>
                    <span>Varsayılan Okul Adı</span>
                    <input
                      style={inputStyle}
                      value={teacherPreferences.defaultSchoolName}
                      onChange={(event) => setTeacherPreferences((prev) => ({ ...prev, defaultSchoolName: event.target.value }))}
                      placeholder="Okul adı"
                    />
                  </label>
                  <label style={fieldStyle}>
                    <span>Varsayılan Sınıf Seviyesi</span>
                    <select
                      style={selectStyle}
                      value={teacherPreferences.defaultGradeLevel}
                      onChange={(event) => setTeacherPreferences((prev) => ({ ...prev, defaultGradeLevel: event.target.value }))}
                    >
                      <option value="5">5. Sınıf</option>
                      <option value="6">6. Sınıf</option>
                      <option value="7">7. Sınıf</option>
                      <option value="8">8. Sınıf</option>
                      <option value="9">9. Sınıf</option>
                    </select>
                  </label>
                  <label style={fieldStyle}>
                    <span>Moderasyon Stili</span>
                    <select
                      style={selectStyle}
                      value={teacherPreferences.moderationMode}
                      onChange={(event) =>
                        setTeacherPreferences((prev) => ({
                          ...prev,
                          moderationMode: event.target.value as TeacherPreferences['moderationMode'],
                        }))
                      }
                    >
                      <option value="manual">Tam Manuel</option>
                      <option value="guided">Yönlendirmeli</option>
                      <option value="strict">Sıkı İnceleme</option>
                    </select>
                  </label>
                  <label style={fieldStyle}>
                    <span>Varsayılan Rapor Formatı</span>
                    <select
                      style={selectStyle}
                      value={teacherPreferences.reportFormat}
                      onChange={(event) =>
                        setTeacherPreferences((prev) => ({
                          ...prev,
                          reportFormat: event.target.value as TeacherPreferences['reportFormat'],
                        }))
                      }
                    >
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </label>
                </div>
                <div style={{ marginTop: '10px' }}>
                  {renderToggle(
                    'Veli özeti hazırlansın',
                    'İleride veli bilgilendirme modülü bağlandığında bu tercih kullanılacak.',
                    teacherPreferences.guardianDigest,
                    (checked) => setTeacherPreferences((prev) => ({ ...prev, guardianDigest: checked })),
                  )}
                </div>
              </section>
            )}

            {currentUser?.role === 'student' && (
              <section style={cardStyle}>
                <div style={sectionTitleStyle}>
                  <BookOpen size={20} /> Öğrenci Ayarları
                </div>
                <div style={fieldGridStyle}>
                  <label style={fieldStyle}>
                    <span>Tercih Edilen Oyun Dili</span>
                    <select
                      style={selectStyle}
                      value={studentPreferences.gameplayLanguage}
                      onChange={(event) =>
                        setStudentPreferences((prev) => ({
                          ...prev,
                          gameplayLanguage: event.target.value as StudentPreferences['gameplayLanguage'],
                        }))
                      }
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </label>
                </div>
                <div style={{ marginTop: '10px' }}>
                  {renderToggle(
                    'Ses efektleri açık',
                    'Oyun içi sesli geri bildirimleri etkin tutar.',
                    studentPreferences.soundEnabled,
                    (checked) => setStudentPreferences((prev) => ({ ...prev, soundEnabled: checked })),
                  )}
                  {renderToggle(
                    'Arka plan müziği açık',
                    'Daha sessiz bir deneyim için kapatılabilir.',
                    studentPreferences.musicEnabled,
                    (checked) => setStudentPreferences((prev) => ({ ...prev, musicEnabled: checked })),
                  )}
                  {renderToggle(
                    'İpuçları gösterilsin',
                    'Öğrenme akışında yardımcı açıklamalar görünür.',
                    studentPreferences.hintsEnabled,
                    (checked) => setStudentPreferences((prev) => ({ ...prev, hintsEnabled: checked })),
                  )}
                  {renderToggle(
                    'Tekrar hakkı açık',
                    'Başarısız denemelerde yeniden oynama hakkını korur.',
                    studentPreferences.allowRetries,
                    (checked) => setStudentPreferences((prev) => ({ ...prev, allowRetries: checked })),
                  )}
                  {renderToggle(
                    'Profilim sınıfta görünsün',
                    'Başarıların ve görünümün sınıf içinde listelenebilir.',
                    studentPreferences.profileVisibleInClass,
                    (checked) => setStudentPreferences((prev) => ({ ...prev, profileVisibleInClass: checked })),
                  )}
                </div>
              </section>
            )}
          </div>

          <div style={{ display: 'grid', gap: '24px', alignContent: 'start' }}>
            <section style={cardStyle}>
              <div style={sectionTitleStyle}>
                <Lock size={20} /> Kaydetme Durumu
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Hesap bilgileri sunucuya kaydedilir. Bildirim, görünüm ve rol bazlı tercihler ise mevcut veri modeline uygun olarak bu cihazda saklanır.
              </p>
              <button type="button" style={buttonStyle} onClick={handleLocalSettingsSave} disabled={isSavingLocalSettings}>
                <CheckCircle2 size={16} /> {isSavingLocalSettings ? 'Kaydediliyor...' : 'Yerel Tercihleri Kaydet'}
              </button>
            </section>

            {currentUser?.role === 'student' && (
              <section style={cardStyle}>
                <div style={sectionTitleStyle}>
                  <School size={20} /> Sınıfa Katıl
                </div>
                <form onSubmit={handleJoinClassroom} style={{ display: 'grid', gap: '14px' }}>
                  <label style={fieldStyle}>
                    <span>Erişim Kodu</span>
                    <input
                      style={inputStyle}
                      value={classroomAccessCode}
                      onChange={(event) => setClassroomAccessCode(event.target.value)}
                      placeholder="Örn. AB12CD34"
                      maxLength={8}
                    />
                  </label>
                  <button type="submit" style={buttonStyle} disabled={isJoiningClassroom}>
                    <GraduationCap size={16} /> {isJoiningClassroom ? 'Katılınıyor...' : 'Sınıfa Katıl'}
                  </button>
                </form>
              </section>
            )}

            <section style={cardStyle}>
              <div style={sectionTitleStyle}>
                <Volume2 size={20} /> Bu Sayfanın Kapsamı
              </div>
              <div style={{ display: 'grid', gap: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>Genel: hesap, tema, dil, erişilebilirlik.</div>
                <div>Öğretmen: sınıf varsayılanları, moderasyon, raporlama, uyarılar.</div>
                <div>Öğrenci: oyun deneyimi, sınıf katılımı, görünürlük tercihleri.</div>
              </div>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => {
                  setUiPreferences(defaultUiPreferences);
                  setNotificationPreferences(defaultNotificationPreferences);
                  setTeacherPreferences(defaultTeacherPreferences);
                  setStudentPreferences(defaultStudentPreferences);
                  i18n.changeLanguage('tr');
                  window.localStorage.setItem('language', 'tr');
                  setTheme('dark');
                  setFeedback('Tercihler varsayılana çekildi. Kaydetmek için yerel tercihleri kaydet düğmesine basabilirsin.');
                  setError(null);
                }}
              >
                Varsayılanlara Dön
              </button>
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
