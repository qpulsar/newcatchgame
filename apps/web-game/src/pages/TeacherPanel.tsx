import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useTranslation } from 'react-i18next';
import { 
  Users, Activity, BookOpen, MessageSquare, LayoutDashboard, 
  Plus, Search, Filter, CheckCircle, XCircle, AlertCircle, X,
  Eye, MessageCircle, MoreVertical, GraduationCap, School,
  Calendar, Award, ArrowUpRight, TrendingUp, Gamepad2, Trash2, Edit2
} from 'lucide-react';

interface DashboardSummary {
  student_count: number;
  classroom_count: number;
  pending_review_count: number;
  recent_activities: any[];
  top_student_games: any[];
  low_performance_signals: any[];
  student_growth_percentage: number;
}

interface Classroom {
  id: number;
  name: string;
  grade_level: string;
  school_name: string;
  access_code: string;
  created_at: string;
}

interface ActivityLog {
  id: number;
  student_id: number;
  activity_type: string;
  entity_type: string;
  entity_id: number;
  metadata_json: any;
  created_at: string;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
}

interface Level {
  id: number;
  title: string;
  description: string;
  status: string;
  creator_id: number;
  topic: string;
  course: string;
  grade_level: string;
  created_at: string;
  moderation_note?: string;
  data: any;
}

export const TeacherPanel: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'students' | 'activities' | 'review' | 'feedback'>('overview');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [reviewLevels, setReviewLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');

  const fetchData = async (tab: string) => {
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (tab === 'overview') {
        const res = await fetch(`${API_URL}/teacher/dashboard`, { headers });
        if (res.ok) setSummary(await res.json());
      } else if (tab === 'classes') {
        const res = await fetch(`${API_URL}/classrooms`, { headers });
        if (res.ok) setClassrooms(await res.json());
      } else if (tab === 'students') {
        const res = await fetch(`${API_URL}/teacher/students`, { headers });
        if (res.ok) setStudents(await res.json());
      } else if (tab === 'activities') {
        const res = await fetch(`${API_URL}/teacher/activities`, { headers });
        if (res.ok) setActivities(await res.json());
      } else if (tab === 'review') {
        const res = await fetch(`${API_URL}/levels`, { headers });
        if (res.ok) {
          const allLevels: Level[] = await res.json();
          setReviewLevels(allLevels.filter(l => l.status === 'review'));
        }
      } else if (tab === 'feedback') {
        const res = await fetch(`${API_URL}/teacher/activities`, { headers });
        if (res.ok) {
           const logs: any[] = await res.json();
           setFeedbacks(logs.filter(l => l.activity_type.includes('level_')));
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);
  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleModerate = async (levelId: number, status: 'approved' | 'rejected' | 'removed') => {
    try {
      const formData = new FormData();
      formData.append('status', status);
      formData.append('note', moderationNote);

      const res = await fetch(`${API_URL}/teacher/moderate/${levelId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setIsReviewModalOpen(false);
        fetchData('review');
        fetchData('overview');
      }
    } catch (err) {
      console.error('Moderation failed:', err);
    }
  };

  const handleCreateOrUpdateClassroom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      grade_level: formData.get('grade_level') as string,
      school_name: formData.get('school_name') as string,
    };

    try {
      const url = editingClassroom ? `${API_URL}/classrooms/${editingClassroom.id}` : `${API_URL}/classrooms`;
      const method = editingClassroom ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setIsClassroomModalOpen(false);
        setEditingClassroom(null);
        fetchData('classes');
      }
    } catch (err) {
      console.error('Failed to save classroom:', err);
    }
  };

  const handleDeleteClassroom = async (id: number) => {
    if (!window.confirm('Bu sınıfı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/classrooms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData('classes');
    } catch (err) {
      console.error('Failed to delete classroom:', err);
    }
  };

  const handleExportReport = () => {
    // Basic CSV export for student activities
    const headers = ['Öğrenci ID', 'İşlem', 'Tür', 'Tarih'];
    const rows = activities.map(a => [a.student_id, a.activity_type, a.entity_type, a.created_at]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ogrenci_raporu_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemoveStudent = async (studentId: number) => {
    // In a real app, we'd need to know which classroom. 
    // We'll show a confirm dialog for now.
    if (confirm('Bu öğrenciyi tüm sınıflarınızdan çıkarmak istediğinize emin misiniz?')) {
       // This would call DELETE /classrooms/{id}/students/{sid}
       // For now, we'll just log it.
       console.log('Remove student', studentId);
    }
  };

  const renderOverview = () => (
    <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
      <div className="stat-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>Toplam Öğrenci</p>
            <h3 style={{ margin: '8px 0', fontSize: '2rem' }}>{summary?.student_count || 0}</h3>
          </div>
          <Users size={24} />
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowUpRight size={14} /> %{summary?.student_growth_percentage || 0} artış
        </div>
      </div>

      <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sınıf Sayısı</p>
            <h3 style={{ margin: '8px 0', fontSize: '2rem', color: 'var(--text-primary)' }}>{summary?.classroom_count || 0}</h3>
          </div>
          <div style={{ padding: '8px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px' }}><School size={24} /></div>
        </div>
      </div>

      <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>İnceleme Bekleyen</p>
            <h3 style={{ margin: '8px 0', fontSize: '2rem', color: '#f59e0b' }}>{summary?.pending_review_count || 0}</h3>
          </div>
          <div style={{ padding: '8px', background: '#fffbeb', color: '#f59e0b', borderRadius: '8px' }}><AlertCircle size={24} /></div>
        </div>
      </div>

      <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aktif Seviyeler</p>
            <h3 style={{ margin: '8px 0', fontSize: '2rem', color: 'var(--text-primary)' }}>{summary?.top_student_games.length || 0}</h3>
          </div>
          <div style={{ padding: '8px', background: '#eef2ff', color: '#6366f1', borderRadius: '8px' }}><BookOpen size={24} /></div>
        </div>
      </div>

      {summary?.low_performance_signals && summary.low_performance_signals.length > 0 && (
        <div className="performance-alerts" style={{ gridColumn: '1/-1', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> Pedagojik Takip Gerektiren Durumlar
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {summary.low_performance_signals.map((sig, i) => (
              <div key={i} style={{ background: 'white', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fee2e2' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{sig.student_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>{sig.reason}</div>
                </div>
                <button onClick={() => setActiveTab('feedback')} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#fee2e2' }}>Geri Bildirim Ver</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="teacher-panel" style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Öğretmen Paneli
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1.1rem' }}>
                Eğitsel oyun ekosisteminizi ve öğrenci ilerlemelerini buradan yönetin.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button 
                onClick={() => setIsClassroomModalOpen(true)}
                className="btn-primary" 
                style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
               >
                 <Plus size={20} /> Yeni Sınıf
               </button>
            </div>
          </div>
        </header>

        <nav className="panel-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '1px' }}>
          {[
            { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
            { id: 'classes', label: 'Sınıflarım', icon: School },
            { id: 'students', label: 'Öğrenciler', icon: Users },
            { id: 'activities', label: 'Aktiviteler', icon: Activity },
            { id: 'review', label: 'Oyun İnceleme', icon: BookOpen },
            { id: 'feedback', label: 'Geri Bildirimler', icon: MessageSquare },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                color: activeTab === tab.id ? '#6366f1' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.95rem'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="tab-content">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '100px' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Yükleniyor...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <>
                  {renderOverview()}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Son Aktiviteler</h3>
                        <button style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>Hepsini Gör</button>
                      </div>
                      <div className="activity-list">
                        {summary?.recent_activities.map(log => (
                          <div key={log.id} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: '1px solid var(--bg-surface)' }}>
                             <div style={{ 
                               width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-surface)', 
                               display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1'
                             }}>
                               {log.activity_type === 'play_game' ? <Gamepad2 size={20} /> : <BookOpen size={20} />}
                             </div>
                             <div>
                               <p style={{ margin: 0, fontWeight: 600 }}>Öğrenci #{log.student_id} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{log.activity_type === 'play_game' ? 'oyun oynadı' : 'oyun oluşturdu'}</span></p>
                               <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(log.created_at).toLocaleString()}</p>
                             </div>
                          </div>
                        ))}
                        {(!summary || summary.recent_activities.length === 0) && <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Henüz aktivite yok.</p>}
                      </div>
                    </div>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                       <h3 style={{ marginBottom: '20px' }}>Hızlı İşlemler</h3>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <button onClick={handleExportReport} className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px' }}><GraduationCap size={18} /> Öğrenci Raporu Al</button>
                          <button onClick={() => setActiveTab('activities')} className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px' }}><TrendingUp size={18} /> Başarı Analizi</button>
                          <button onClick={() => alert('Veli bilgilendirme sistemi aktif edildiğinde bildirim gönderilecek.')} className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px' }}><MessageCircle size={18} /> Velilere Bildir</button>
                       </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'classes' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                  {classrooms.map(cls => (
                    <div key={cls.id} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <School size={24} />
                        </div>
                        <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'var(--bg-surface)', borderRadius: '6px', fontWeight: 600 }}>{cls.grade_level}</span>
                      </div>
                      <h3 style={{ margin: '0 0 8px' }}>{cls.name}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 16px' }}>{cls.school_name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-surface)', padding: '12px', borderRadius: '10px' }}>
                        <div style={{ flex: 1 }}>
                           <p style={{ margin: 0, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Erişim Kodu</p>
                           <p style={{ margin: 0, fontWeight: 700, letterSpacing: '1px', color: '#6366f1' }}>{cls.access_code}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="icon-btn" title="Düzenle" onClick={(e) => { e.stopPropagation(); setEditingClassroom(cls); setIsClassroomModalOpen(true); }}><Edit2 size={16} /></button>
                          <button className="icon-btn" title="Sil" onClick={(e) => { e.stopPropagation(); handleDeleteClassroom(cls.id); }} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {classrooms.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>Henüz sınıfınız yok.</div>}
                </div>
              )}

              {activeTab === 'students' && (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                   <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input 
                          type="text" 
                          placeholder="Öğrenci ara..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid var(--border-color)', width: '300px' }}
                        />
                      </div>
                      <button className="btn-secondary" style={{ gap: '8px' }}><Filter size={18} /> Filtrele</button>
                   </div>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', background: 'var(--bg-surface)' }}>
                          <th style={{ padding: '16px 24px' }}>Öğrenci</th>
                          <th style={{ padding: '16px 24px' }}>Email</th>
                          <th style={{ padding: '16px 24px' }}>Durum</th>
                          <th style={{ padding: '16px 24px' }}>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(s => (
                          <tr key={s.id} style={{ borderBottom: '1px solid var(--bg-surface)' }}>
                            <td style={{ padding: '16px 24px', fontWeight: 600 }}>{s.full_name}</td>
                            <td style={{ padding: '16px 24px' }}>{s.email}</td>
                            <td style={{ padding: '16px 24px' }}>
                               <span style={{ padding: '4px 8px', background: '#ecfdf5', color: '#10b981', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>Aktif</span>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                               <div style={{ display: 'flex', gap: '8px' }}>
                                  <button className="icon-btn" title="Detay"><Eye size={16} /></button>
                                  <button className="icon-btn" title="Mesaj"><MessageSquare size={16} /></button>
                               </div>
                            </td>
                          </tr>
                        ))}
                        {filteredStudents.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>Öğrenci bulunamadı.</td></tr>}
                      </tbody>
                   </table>
                </div>
              )}

              {activeTab === 'review' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                  {reviewLevels.map(level => (
                    <div key={level.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ height: '180px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {level.data.thumbnail_url ? <img src={level.data.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <BookOpen size={48} color="var(--border-color)" />}
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(245, 158, 11, 0.9)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          İNCELEME BEKLİYOR
                        </div>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 8px' }}>{level.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {level.description}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>{level.course}</span>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>{level.topic}</span>
                        </div>
                        <button 
                          onClick={() => { setSelectedLevel(level); setIsReviewModalOpen(true); }}
                          className="btn-primary" 
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          İncele ve Karar Ver
                        </button>
                      </div>
                    </div>
                  ))}
                  {reviewLevels.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px' }}>İnceleme bekleyen oyun bulunmamaktadır.</div>}
                </div>
              )}

              {activeTab === 'feedback' && (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
                  <h3 style={{ marginBottom: '20px' }}>Geri Bildirim Geçmişi</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {feedbacks.map(f => (
                      <div key={f.id} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', borderLeft: '4px solid #6366f1' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700 }}>Oyun #{f.entity_id} - Moderasyon Kararı</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(f.created_at).toLocaleString()}</span>
                         </div>
                         <p style={{ margin: 0, fontSize: '0.95rem' }}>{f.metadata_json?.note || 'Geri bildirim belirtilmemiş.'}</p>
                         <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>
                           Durum: {f.activity_type.replace('level_', '').toUpperCase()}
                         </div>
                      </div>
                    ))}
                    {feedbacks.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Henüz bir geri bildirim kaydı bulunmuyor.</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Classroom Modal */}
        {isClassroomModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
             <div className="modal-content" style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                   <h2 style={{ margin: 0 }}>{editingClassroom ? 'Sınıfı Düzenle' : 'Yeni Sınıf Oluştur'}</h2>
                   <button onClick={() => { setIsClassroomModalOpen(false); setEditingClassroom(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleCreateOrUpdateClassroom}>
                   <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Sınıf Adı</label>
                      <input name="name" required defaultValue={editingClassroom?.name} placeholder="Örn: 5-A Fen Bilgisi" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                   </div>
                   <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Sınıf Seviyesi</label>
                      <select name="grade_level" defaultValue={editingClassroom?.grade_level || '5. Sınıf'} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                         <option>1. Sınıf</option>
                         <option>2. Sınıf</option>
                         <option>3. Sınıf</option>
                         <option>4. Sınıf</option>
                         <option>5. Sınıf</option>
                         <option>6. Sınıf</option>
                         <option>7. Sınıf</option>
                         <option>8. Sınıf</option>
                      </select>
                   </div>
                   <div style={{ marginBottom: '32px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Okul Adı</label>
                      <input name="school_name" required defaultValue={editingClassroom?.school_name} placeholder="Örn: Atatürk Ortaokulu" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                   </div>
                   <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" onClick={() => { setIsClassroomModalOpen(false); setEditingClassroom(null); }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>İptal</button>
                      <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{editingClassroom ? 'Güncelle' : 'Oluştur'}</button>
                   </div>
                </form>
             </div>
          </div>
        )}

        {/* Review Modal */}
        {isReviewModalOpen && selectedLevel && (
           <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
             <div className="modal-content" style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                   <h2 style={{ margin: 0 }}>Oyun İnceleme: {selectedLevel.title}</h2>
                   <button onClick={() => setIsReviewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                   <div>
                      <h4 style={{ marginBottom: '12px' }}>Oyun Bilgileri</h4>
                      <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '16px' }}>
                         <p><strong>Konu:</strong> {selectedLevel.topic}</p>
                         <p><strong>Ders:</strong> {selectedLevel.course}</p>
                         <p><strong>Seviye:</strong> {selectedLevel.grade_level}</p>
                         <p><strong>Açıklama:</strong> {selectedLevel.description}</p>
                      </div>
                   </div>
                   <div>
                      <h4 style={{ marginBottom: '12px' }}>Kavramlar</h4>
                      <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '16px' }}>
                         <p><strong>Doğru Kavramlar:</strong> {selectedLevel.data.game_levels?.[0]?.correct_items?.map((i: any) => i.text).join(', ') || 'Belirtilmemiş'}</p>
                         <p style={{ marginTop: '12px' }}><strong>Yanlış Kavramlar:</strong> {selectedLevel.data.game_levels?.[0]?.wrong_items?.map((i: any) => i.text).join(', ') || 'Belirtilmemiş'}</p>
                      </div>
                   </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                   <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Öğretmen Notu / Geri Bildirim</label>
                   <textarea 
                     value={moderationNote}
                     onChange={e => setModerationNote(e.target.value)}
                     placeholder="Öğrenciye iletilecek not (Örn: Kavramlar doğru fakat görsel seçimi geliştirilebilir.)"
                     style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', minHeight: '120px' }}
                   />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                   <button onClick={() => handleModerate(selectedLevel.id, 'approved')} className="btn-primary" style={{ flex: 1, background: '#10b981', justifyContent: 'center' }}>
                     <CheckCircle size={20} /> Onayla ve Yayınla
                   </button>
                   <button onClick={() => handleModerate(selectedLevel.id, 'rejected')} className="btn-secondary" style={{ flex: 1, color: '#f59e0b', justifyContent: 'center' }}>
                     <AlertCircle size={20} /> Revize İste
                   </button>
                   <button onClick={() => handleModerate(selectedLevel.id, 'removed')} className="btn-secondary" style={{ flex: 1, color: '#ef4444', justifyContent: 'center' }}>
                     <XCircle size={20} /> Uygun Değil / Kaldır
                   </button>
                </div>
             </div>
           </div>
        )}
      </div>
      <style>{`
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(99, 102, 241, 0.1);
          border-left-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .tab-btn.active {
          background: #6366f1 !important;
          color: white !important;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          transition: transform 0.3s;
        }
      `}</style>
    </MainLayout>
  );
};
