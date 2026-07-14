'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FiUpload, FiSave, FiUser, FiMapPin, FiBriefcase, FiPlus, FiX, FiCamera } from 'react-icons/fi';
import { deleteField, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { AppUser, CVData, Education, Experience, Project } from '@/types';
import { getCvProfile, saveCvProfile } from '@/lib/cvProfiles';

type EditableProfile = Partial<AppUser>;

const emptyEducation: Education = {
  institution: '',
  institutionAr: '',
  degree: '',
  degreeAr: '',
  field: '',
  fieldAr: '',
  startDate: '',
  endDate: '',
  current: false,
};

const emptyExperience: Experience = {
  company: '',
  companyAr: '',
  position: '',
  positionAr: '',
  description: '',
  descriptionAr: '',
  startDate: '',
  endDate: '',
  current: false,
};

const emptyProject: Project = {
  id: '',
  title: '',
  titleAr: '',
  description: '',
  descriptionAr: '',
  image: '',
  link: '',
  year: new Date().getFullYear(),
};

export default function ProfilePage() {
  const { locale, theme } = useAppStore();
  const { user, loading: authLoading, setUser } = useAuthStore();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditableProfile | null>(null);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/auth/login');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    const loadPrivateCvProfile = async () => {
      if (!user || user.role !== 'individual') {
        return;
      }

      const cvProfile = await getCvProfile(user.uid);
      if (!cvProfile) {
        return;
      }

      setFormData((current) => ({
        ...(current ?? user),
        cvVisibility: cvProfile.cvVisibility,
        cvFile: cvProfile.cvFile,
        cvData: cvProfile.cvData,
        hasCv: Boolean(cvProfile.cvFile),
      }));
    };

    void loadPrivateCvProfile();
  }, [user]);

  const activeFormData = formData ?? user;
  const profileSections = user?.role === 'company'
    ? [
        { id: 'profile-basic', label: isAr ? 'الأساسيات' : 'Basics' },
        { id: 'profile-company', label: isAr ? 'بيانات الشركة' : 'Company Info' },
        { id: 'profile-services', label: isAr ? 'الخدمات' : 'Services' },
        { id: 'profile-projects', label: isAr ? 'المشاريع' : 'Projects' },
      ]
    : [
        { id: 'profile-basic', label: isAr ? 'الأساسيات' : 'Basics' },
        { id: 'profile-professional', label: isAr ? 'المهني' : 'Professional' },
        { id: 'profile-skills', label: isAr ? 'المهارات' : 'Skills' },
        { id: 'profile-cv', label: isAr ? 'السيرة' : 'CV' },
        { id: 'profile-experience', label: isAr ? 'الخبرات' : 'Experience' },
        { id: 'profile-education', label: isAr ? 'التعليم' : 'Education' },
        { id: 'profile-languages', label: isAr ? 'اللغات' : 'Languages' },
      ];

  const ensureCvData = (): CVData => ({
    education: activeFormData?.cvData?.education ?? [],
    experience: activeFormData?.cvData?.experience ?? [],
    skills: activeFormData?.cvData?.skills ?? activeFormData?.skills ?? [],
    languages: activeFormData?.cvData?.languages ?? [],
    languagesAr: activeFormData?.cvData?.languagesAr ?? [],
    certifications: activeFormData?.cvData?.certifications ?? [],
    certificationsAr: activeFormData?.cvData?.certificationsAr ?? [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...activeFormData, [e.target.name]: e.target.value });
  };

  const updateCvData = (nextCvData: CVData) => {
    setFormData({
      ...activeFormData,
      cvData: nextCvData,
    });
  };

  const updateEducationField = (index: number, field: keyof Education, value: string | boolean) => {
    const cvData = ensureCvData();
    const education = [...cvData.education];
    education[index] = { ...education[index], [field]: value };
    updateCvData({ ...cvData, education });
  };

  const addEducation = () => {
    const cvData = ensureCvData();
    updateCvData({ ...cvData, education: [...cvData.education, { ...emptyEducation }] });
  };

  const removeEducation = (index: number) => {
    const cvData = ensureCvData();
    updateCvData({ ...cvData, education: cvData.education.filter((_, itemIndex) => itemIndex !== index) });
  };

  const updateExperienceField = (index: number, field: keyof Experience, value: string | boolean) => {
    const cvData = ensureCvData();
    const experience = [...cvData.experience];
    experience[index] = { ...experience[index], [field]: value };
    updateCvData({ ...cvData, experience });
  };

  const addExperience = () => {
    const cvData = ensureCvData();
    updateCvData({ ...cvData, experience: [...cvData.experience, { ...emptyExperience }] });
  };

  const removeExperience = (index: number) => {
    const cvData = ensureCvData();
    updateCvData({ ...cvData, experience: cvData.experience.filter((_, itemIndex) => itemIndex !== index) });
  };

  const updateCvList = (field: 'languages' | 'languagesAr' | 'certifications' | 'certificationsAr', value: string) => {
    const cvData = ensureCvData();
    updateCvData({
      ...cvData,
      [field]: value.split(',').map((item) => item.trim()).filter(Boolean),
    });
  };

  const updateServicesField = (field: 'services' | 'servicesAr', value: string) => {
    setFormData({
      ...activeFormData,
      [field]: value.split(',').map((item) => item.trim()).filter(Boolean),
    });
  };

  const updateProjectField = (index: number, field: keyof Project, value: string | number) => {
    const projects = [...(activeFormData?.projects ?? [])];
    projects[index] = { ...projects[index], [field]: value };
    setFormData({ ...activeFormData, projects });
  };

  const handleProjectImageUpload = async (projectIndex: number, file: File | null) => {
    if (!file || !user) {
      return;
    }

    const projects = [...(activeFormData?.projects ?? [])];
    const project = projects[projectIndex];
    if (!project) {
      return;
    }

    setUploadingProjectId(project.id || `project-${projectIndex}`);
    try {
      const storageRef = ref(storage, `project-images/${user.uid}/${project.id || `project-${projectIndex}`}-${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      projects[projectIndex] = { ...project, image: url };
      setFormData({ ...activeFormData, projects });
      toast.success(isAr ? 'تم رفع صورة المشروع' : 'Project image uploaded');
    } catch (error) {
      console.error('Project image upload failed:', error);
      toast.error(isAr ? 'تعذر رفع صورة المشروع' : 'Could not upload project image');
    } finally {
      setUploadingProjectId(null);
    }
  };

  const addProject = () => {
    const projects = [...(activeFormData?.projects ?? [])];
    const nextProject = {
      ...emptyProject,
      id: `project_${Date.now()}_${projects.length + 1}`,
    };
    setFormData({ ...activeFormData, projects: [...projects, nextProject] });
  };

  const removeProject = (index: number) => {
    const projects = (activeFormData?.projects ?? []).filter((_, itemIndex) => itemIndex !== index);
    setFormData({ ...activeFormData, projects });
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const storageRef = ref(storage, `cvs/${user.uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setFormData({ ...activeFormData, cvFile: url });
    toast.success(isAr ? 'تم رفع السيرة الذاتية' : 'CV uploaded successfully');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', user.uid), {
        avatar: url,
        updatedAt: serverTimestamp(),
      });

      setFormData({ ...activeFormData, avatar: url });
      setUser({ ...user, avatar: url });
      toast.success(isAr ? 'تم رفع الصورة الشخصية وحفظها مباشرة' : 'Profile photo uploaded and saved instantly');
    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast.error(isAr ? 'تعذر رفع الصورة الشخصية' : 'Could not upload profile photo');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const skills = activeFormData?.skills || [];
    setFormData({ ...activeFormData, skills: [...skills, newSkill.trim()] });
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    const skills = [...(activeFormData?.skills || [])];
    skills.splice(index, 1);
    setFormData({ ...activeFormData, skills });
  };

  const handleSave = async () => {
    if (!user || !activeFormData) return;
    setLoading(true);
    try {
      const data = { ...activeFormData };
      delete data.uid;

      if (user.role === 'individual') {
        const publicData = { ...data };
        const cvVisibility = publicData.cvVisibility || 'request_only';
        const cvFile = publicData.cvFile;
        const cvData = publicData.cvData;

        delete publicData.cvFile;
        delete publicData.cvData;

        await updateDoc(doc(db, 'users', user.uid), {
          ...publicData,
          hasCv: Boolean(cvFile),
          cvVisibility,
          cvFile: deleteField(),
          cvData: deleteField(),
          updatedAt: serverTimestamp(),
        });

        await saveCvProfile(user.uid, {
          cvVisibility,
          cvFile,
          cvData,
        });

        setUser({ ...user, ...publicData, cvVisibility, cvFile, cvData, hasCv: Boolean(cvFile) });
      } else {
        await updateDoc(doc(db, 'users', user.uid), { ...data, updatedAt: serverTimestamp() });
        setUser({ ...user, ...data });
      }

      toast.success(isAr ? 'تم حفظ التغييرات' : 'Changes saved');
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;
  if (!activeFormData) return null;

  return (
    <main>
      <Navbar />
      <Toaster position="top-center" />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">
            {isAr ? 'الملف الشخصي' : 'Profile'}
          </h1>

          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-1">
              {profileSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary-light)] hover:text-[var(--primary-light)] transition-colors"
                >
                  {section.label}
                </a>
              ))}
            </div>
          </div>

          {/* Avatar & Basic Info */}
          <Card hover={false} className="mb-6 p-4 sm:p-6 scroll-mt-28" onClick={undefined}>
            <div id="profile-basic" />
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                {activeFormData.avatar ? (
                  <img
                    src={activeFormData.avatar}
                    alt={activeFormData.displayName || 'Profile avatar'}
                    className="w-20 h-20 rounded-full object-cover border border-[var(--border)] bg-[var(--background-secondary)]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white text-2xl font-bold">
                    {activeFormData.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <label className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--primary-light)] transition-colors">
                  <FiCamera size={16} className="text-[var(--foreground-secondary)]" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{activeFormData.displayName}</h2>
                <p className="text-[var(--foreground-secondary)]">{activeFormData.email}</p>
                <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary-light)]">
                  {user.role === 'company' ? (isAr ? 'شركة' : 'Company') : (isAr ? 'فرد' : 'Individual')}
                </span>
                <p className="text-xs text-[var(--foreground-secondary)] mt-2">
                  {isAr ? 'اضغط على أيقونة الكاميرا لتحديث الصورة الشخصية، وسيتم حفظها مباشرة' : 'Use the camera icon to update your profile photo. It will save immediately.'}
                </p>
                {uploadingAvatar && (
                  <p className="text-xs text-[var(--primary-light)] mt-2">
                    {isAr ? 'جاري رفع الصورة...' : 'Uploading photo...'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={isAr ? 'الاسم' : 'Display Name'}
                name="displayName"
                value={activeFormData.displayName || ''}
                onChange={handleChange}
                icon={<FiUser />}
              />
              <Input
                label={isAr ? 'الدولة' : 'Country'}
                name="country"
                value={activeFormData.country || ''}
                onChange={handleChange}
                icon={<FiMapPin />}
              />
              <Input
                label={isAr ? 'المدينة' : 'City'}
                name="city"
                value={activeFormData.city || ''}
                onChange={handleChange}
                icon={<FiMapPin />}
              />
              <Input
                label={isAr ? 'الهاتف' : 'Phone'}
                name="phone"
                value={activeFormData.phone || ''}
                onChange={handleChange}
              />
            </div>
          </Card>

          {/* Individual-specific fields */}
          {user.role === 'individual' && (
            <>
              <Card hover={false} className="mb-6 p-4 sm:p-6 scroll-mt-28" onClick={undefined}>
                <div id="profile-professional" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  {isAr ? 'المعلومات المهنية' : 'Professional Info'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Specialization (English)"
                    name="specialization"
                    value={activeFormData.specialization || ''}
                    onChange={handleChange}
                    icon={<FiBriefcase />}
                  />
                  <Input
                    label={isAr ? 'التخصص بالعربي (اختياري)' : 'Specialization (Arabic, optional)'}
                    name="specializationAr"
                    value={activeFormData.specializationAr || ''}
                    onChange={handleChange}
                    icon={<FiBriefcase />}
                    dir="rtl"
                  />
                  <Input
                    label={isAr ? 'سنوات الخبرة' : 'Years of Experience'}
                    name="experienceYears"
                    type="number"
                    value={activeFormData.experienceYears || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label="Title (English)"
                    name="title"
                    value={activeFormData.title || ''}
                    onChange={handleChange}
                    icon={<FiBriefcase />}
                  />
                </div>
                <div className="mt-4">
                  <Input
                    label={isAr ? 'المسمى بالعربي (اختياري)' : 'Title (Arabic, optional)'}
                    name="titleAr"
                    value={activeFormData.titleAr || ''}
                    onChange={handleChange}
                    icon={<FiBriefcase />}
                    dir="rtl"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
                    About You (English)
                  </label>
                  <textarea
                    name="bio"
                    value={activeFormData.bio || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
                    {isAr ? 'نبذة عنك بالعربي (اختياري)' : 'About You (Arabic, optional)'}
                  </label>
                  <textarea
                    name="bioAr"
                    value={activeFormData.bioAr || ''}
                    onChange={handleChange}
                    rows={4}
                    dir="rtl"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none"
                  />
                </div>
              </Card>

              {/* Skills */}
              <Card hover={false} className="mb-6 p-4 sm:p-6 scroll-mt-28" onClick={undefined}>
                <div id="profile-skills" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  {isAr ? 'المهارات' : 'Skills'}
                </h3>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder={isAr ? 'أضف مهارة...' : 'Add a skill...'}
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button onClick={addSkill} variant="secondary">
                    <FiPlus />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(activeFormData.skills || []).map((skill, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary-light)] text-sm">
                      {skill}
                      <button onClick={() => removeSkill(i)} className="hover:text-[var(--error)]">
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </Card>

              {/* CV Upload */}
              <Card hover={false} className="mb-6 p-4 sm:p-6 scroll-mt-28" onClick={undefined}>
                <div id="profile-cv" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  {isAr ? 'السيرة الذاتية' : 'CV'}
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
                    {isAr ? 'طريقة عرض السيرة الذاتية' : 'CV visibility'}
                  </label>
                  <select
                    name="cvVisibility"
                    value={activeFormData.cvVisibility || 'request_only'}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
                  >
                    <option value="private">{isAr ? 'خاص بالكامل' : 'Private only'}</option>
                    <option value="request_only">{isAr ? 'بطلب وموافقة' : 'Request and approval'}</option>
                    <option value="public">{isAr ? 'عام لكل الشركات' : 'Public to companies'}</option>
                  </select>
                  <p className="text-xs text-[var(--foreground-secondary)] mt-2">
                    {isAr
                      ? 'الخاص: لا يظهر إلا لك. بطلب وموافقة: تحتاج الشركة إلى طلب ثم موافقتك. العام: يظهر رابط السيرة للشركات مباشرة.'
                      : 'Private: visible only to you. Request and approval: companies must request and wait for your approval. Public: companies can open the CV directly.'}
                  </p>
                </div>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--primary-light)] transition-colors">
                  <FiUpload size={32} className="text-[var(--foreground-secondary)] mb-2" />
                  <p className="text-[var(--foreground-secondary)]">
                    {activeFormData.cvFile
                      ? (isAr ? 'تم رفع السيرة الذاتية ✓' : 'CV Uploaded ✓')
                      : (isAr ? 'اضغط لرفع السيرة الذاتية (PDF)' : 'Click to upload CV (PDF)')}
                  </p>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleCVUpload} />
                </label>
                {activeFormData.cvFile && (
                  <a
                    href={activeFormData.cvFile}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center text-sm font-medium text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
                  >
                    {isAr ? 'فتح السيرة الحالية' : 'Open current CV'}
                  </a>
                )}
              </Card>

              <Card hover={false} className="mb-6 p-4 sm:p-6 scroll-mt-28" onClick={undefined}>
                <div id="profile-experience" />
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{isAr ? 'الخبرات العملية' : 'Work Experience'}</h3>
                  <Button variant="secondary" size="sm" onClick={addExperience}><FiPlus />{isAr ? 'إضافة' : 'Add'}</Button>
                </div>
                <div className="space-y-4">
                  {(activeFormData.cvData?.experience ?? []).map((item, index) => (
                    <div key={`experience-${index}`} className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--background-secondary)]/60">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-medium text-[var(--foreground)]">{isAr ? `خبرة ${index + 1}` : `Experience ${index + 1}`}</p>
                        <button type="button" onClick={() => removeExperience(index)} className="text-[var(--foreground-secondary)] hover:text-[var(--error)] transition-colors"><FiX size={16} /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Position (English)" value={item.position} onChange={(e) => updateExperienceField(index, 'position', e.target.value)} />
                        <Input label={isAr ? 'المسمى بالعربي (اختياري)' : 'Position (Arabic, optional)'} value={item.positionAr || ''} onChange={(e) => updateExperienceField(index, 'positionAr', e.target.value)} dir="rtl" />
                        <Input label="Company (English)" value={item.company} onChange={(e) => updateExperienceField(index, 'company', e.target.value)} />
                        <Input label={isAr ? 'اسم الشركة بالعربي (اختياري)' : 'Company (Arabic, optional)'} value={item.companyAr || ''} onChange={(e) => updateExperienceField(index, 'companyAr', e.target.value)} dir="rtl" />
                        <Input label={isAr ? 'تاريخ البداية' : 'Start Date'} value={item.startDate} onChange={(e) => updateExperienceField(index, 'startDate', e.target.value)} placeholder="2021" />
                        <Input label={isAr ? 'تاريخ النهاية' : 'End Date'} value={item.endDate || ''} onChange={(e) => updateExperienceField(index, 'endDate', e.target.value)} placeholder="2024" />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">Description (English)</label>
                        <textarea value={item.description} onChange={(e) => updateExperienceField(index, 'description', e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none" />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">{isAr ? 'الوصف بالعربي (اختياري)' : 'Description (Arabic, optional)'}</label>
                        <textarea value={item.descriptionAr || ''} onChange={(e) => updateExperienceField(index, 'descriptionAr', e.target.value)} rows={3} dir="rtl" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none" />
                      </div>
                    </div>
                  ))}
                  {(activeFormData.cvData?.experience ?? []).length === 0 && <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد خبرات مضافة بعد' : 'No experience entries yet'}</p>}
                </div>
              </Card>

              <Card hover={false} className="mb-6 p-4 sm:p-6 scroll-mt-28" onClick={undefined}>
                <div id="profile-education" />
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{isAr ? 'التعليم' : 'Education'}</h3>
                  <Button variant="secondary" size="sm" onClick={addEducation}><FiPlus />{isAr ? 'إضافة' : 'Add'}</Button>
                </div>
                <div className="space-y-4">
                  {(activeFormData.cvData?.education ?? []).map((item, index) => (
                    <div key={`education-${index}`} className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--background-secondary)]/60">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-medium text-[var(--foreground)]">{isAr ? `تعليم ${index + 1}` : `Education ${index + 1}`}</p>
                        <button type="button" onClick={() => removeEducation(index)} className="text-[var(--foreground-secondary)] hover:text-[var(--error)] transition-colors"><FiX size={16} /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Institution (English)" value={item.institution} onChange={(e) => updateEducationField(index, 'institution', e.target.value)} />
                        <Input label={isAr ? 'الجهة التعليمية بالعربي (اختياري)' : 'Institution (Arabic, optional)'} value={item.institutionAr || ''} onChange={(e) => updateEducationField(index, 'institutionAr', e.target.value)} dir="rtl" />
                        <Input label="Degree (English)" value={item.degree} onChange={(e) => updateEducationField(index, 'degree', e.target.value)} />
                        <Input label={isAr ? 'الدرجة بالعربي (اختياري)' : 'Degree (Arabic, optional)'} value={item.degreeAr || ''} onChange={(e) => updateEducationField(index, 'degreeAr', e.target.value)} dir="rtl" />
                        <Input label="Field (English)" value={item.field} onChange={(e) => updateEducationField(index, 'field', e.target.value)} />
                        <Input label={isAr ? 'التخصص بالعربي (اختياري)' : 'Field (Arabic, optional)'} value={item.fieldAr || ''} onChange={(e) => updateEducationField(index, 'fieldAr', e.target.value)} dir="rtl" />
                        <Input label={isAr ? 'تاريخ البداية' : 'Start Date'} value={item.startDate} onChange={(e) => updateEducationField(index, 'startDate', e.target.value)} placeholder="2015" />
                        <Input label={isAr ? 'تاريخ النهاية' : 'End Date'} value={item.endDate || ''} onChange={(e) => updateEducationField(index, 'endDate', e.target.value)} placeholder="2019" />
                      </div>
                    </div>
                  ))}
                  {(activeFormData.cvData?.education ?? []).length === 0 && <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد مؤهلات تعليمية مضافة بعد' : 'No education entries yet'}</p>}
                </div>
              </Card>

              <Card hover={false} className="mb-6 p-4 sm:p-6 scroll-mt-28" onClick={undefined}>
                <div id="profile-languages" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">{isAr ? 'اللغات والشهادات' : 'Languages and Certifications'}</h3>
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    label="Languages (English, comma separated)"
                    value={(activeFormData.cvData?.languages ?? []).join(', ')}
                    onChange={(e) => updateCvList('languages', e.target.value)}
                  />
                  <Input
                    label={isAr ? 'اللغات بالعربي (اختياري، مفصولة بفاصلة)' : 'Languages (Arabic, optional, comma separated)'}
                    value={(activeFormData.cvData?.languagesAr ?? []).join(', ')}
                    onChange={(e) => updateCvList('languagesAr', e.target.value)}
                    dir="rtl"
                  />
                  <Input
                    label="Certifications (English, comma separated)"
                    value={(activeFormData.cvData?.certifications ?? []).join(', ')}
                    onChange={(e) => updateCvList('certifications', e.target.value)}
                  />
                  <Input
                    label={isAr ? 'الشهادات بالعربي (اختياري، مفصولة بفاصلة)' : 'Certifications (Arabic, optional, comma separated)'}
                    value={(activeFormData.cvData?.certificationsAr ?? []).join(', ')}
                    onChange={(e) => updateCvList('certificationsAr', e.target.value)}
                    dir="rtl"
                  />
                </div>
              </Card>
            </>
          )}

          {/* Company-specific fields */}
          {user.role === 'company' && (
            <>
              <Card hover={false} className="mb-6 p-4 sm:p-6 scroll-mt-28" onClick={undefined}>
                <div id="profile-company" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  {isAr ? 'معلومات الشركة' : 'Company Info'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name (English)"
                    name="companyName"
                    value={activeFormData.companyName || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label={isAr ? 'اسم الشركة بالعربي (اختياري)' : 'Company Name (Arabic, optional)'}
                    name="companyNameAr"
                    value={activeFormData.companyNameAr || ''}
                    onChange={handleChange}
                    dir="rtl"
                  />
                  <Input
                    label="Industry (English)"
                    name="industry"
                    value={activeFormData.industry || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label={isAr ? 'المجال بالعربي (اختياري)' : 'Industry (Arabic, optional)'}
                    name="industryAr"
                    value={activeFormData.industryAr || ''}
                    onChange={handleChange}
                    dir="rtl"
                  />
                  <Input
                    label={isAr ? 'الموقع الإلكتروني' : 'Website'}
                    name="website"
                    value={activeFormData.website || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label={isAr ? 'سنة التأسيس' : 'Founded Year'}
                    name="foundedYear"
                    type="number"
                    value={activeFormData.foundedYear || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label={isAr ? 'السجل التجاري' : 'Commercial Registration'}
                    name="commercialRegistration"
                    value={activeFormData.commercialRegistration || ''}
                    onChange={handleChange}
                    disabled
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
                    Company Description (English)
                  </label>
                  <textarea
                    name="description"
                    value={activeFormData.description || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
                    {isAr ? 'وصف الشركة بالعربي (اختياري)' : 'Company Description (Arabic, optional)'}
                  </label>
                  <textarea
                    name="descriptionAr"
                    value={activeFormData.descriptionAr || ''}
                    onChange={handleChange}
                    rows={4}
                    dir="rtl"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none"
                  />
                </div>
              </Card>

              <Card hover={false} className="mb-6 p-4 sm:p-6 scroll-mt-28" onClick={undefined}>
                <div id="profile-services" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">{isAr ? 'الخدمات' : 'Services'}</h3>
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    label="Services (English, comma separated)"
                    value={(activeFormData.services ?? []).join(', ')}
                    onChange={(e) => updateServicesField('services', e.target.value)}
                  />
                  <Input
                    label={isAr ? 'الخدمات بالعربي (اختياري، مفصولة بفاصلة)' : 'Services (Arabic, optional, comma separated)'}
                    value={(activeFormData.servicesAr ?? []).join(', ')}
                    onChange={(e) => updateServicesField('servicesAr', e.target.value)}
                    dir="rtl"
                  />
                </div>
              </Card>

              <Card hover={false} className="mb-6 p-4 sm:p-6 scroll-mt-28" onClick={undefined}>
                <div id="profile-projects" />
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{isAr ? 'المشاريع' : 'Projects'}</h3>
                  <Button variant="secondary" size="sm" onClick={addProject}><FiPlus />{isAr ? 'إضافة' : 'Add'}</Button>
                </div>
                <div className="space-y-4">
                  {(activeFormData.projects ?? []).map((project, index) => (
                    <div key={project.id || `project-${index}`} className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--background-secondary)]/60">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-medium text-[var(--foreground)]">{isAr ? `مشروع ${index + 1}` : `Project ${index + 1}`}</p>
                        <button type="button" onClick={() => removeProject(index)} className="text-[var(--foreground-secondary)] hover:text-[var(--error)] transition-colors"><FiX size={16} /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Project Title (English)" value={project.title} onChange={(e) => updateProjectField(index, 'title', e.target.value)} />
                        <Input label={isAr ? 'عنوان المشروع بالعربي (اختياري)' : 'Project Title (Arabic, optional)'} value={project.titleAr || ''} onChange={(e) => updateProjectField(index, 'titleAr', e.target.value)} dir="rtl" />
                        <Input label={isAr ? 'السنة' : 'Year'} type="number" value={project.year || ''} onChange={(e) => updateProjectField(index, 'year', Number(e.target.value) || new Date().getFullYear())} />
                        <Input label={isAr ? 'الرابط (اختياري)' : 'Link (optional)'} value={project.link || ''} onChange={(e) => updateProjectField(index, 'link', e.target.value)} />
                        <Input label={isAr ? 'رابط الصورة (اختياري)' : 'Image URL (optional)'} value={project.image || ''} onChange={(e) => updateProjectField(index, 'image', e.target.value)} className="md:col-span-2" />
                      </div>
                      <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)]">{isAr ? 'رفع صورة للمشروع' : 'Upload project image'}</p>
                            <p className="text-xs text-[var(--foreground-secondary)] mt-1">{isAr ? 'يمكنك استخدام رابط مباشر أو رفع صورة من جهازك.' : 'You can use a direct URL or upload an image from your device.'}</p>
                          </div>
                          <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] cursor-pointer hover:border-[var(--primary-light)] hover:text-[var(--primary-light)] transition-colors">
                            <FiUpload size={16} />
                            {uploadingProjectId === (project.id || `project-${index}`) ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'اختيار صورة' : 'Choose image')}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                void handleProjectImageUpload(index, e.target.files?.[0] || null);
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                        </div>
                        {project.image && (
                          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] aspect-[16/9]">
                            <img src={project.image} alt={project.title || 'Project image'} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">Project Description (English)</label>
                        <textarea value={project.description} onChange={(e) => updateProjectField(index, 'description', e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none" />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">{isAr ? 'وصف المشروع بالعربي (اختياري)' : 'Project Description (Arabic, optional)'}</label>
                        <textarea value={project.descriptionAr || ''} onChange={(e) => updateProjectField(index, 'descriptionAr', e.target.value)} rows={3} dir="rtl" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none" />
                      </div>
                    </div>
                  ))}
                  {(activeFormData.projects ?? []).length === 0 && <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد مشاريع مضافة بعد' : 'No projects added yet'}</p>}
                </div>
              </Card>
            </>
          )}

          {/* Save Button */}
          <Button onClick={handleSave} loading={loading} size="lg" fullWidth>
            <FiSave />
            {isAr ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
