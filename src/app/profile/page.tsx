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
import { FiUpload, FiSave, FiUser, FiMapPin, FiBriefcase, FiPlus, FiX } from 'react-icons/fi';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  const { locale, theme } = useAppStore();
  const { user, loading: authLoading, setUser } = useAuthStore();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
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
      return;
    }
    setFormData(user);
  }, [authLoading, router, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const storageRef = ref(storage, `cvs/${user.uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setFormData({ ...formData, cvFile: url });
    toast.success(isAr ? 'تم رفع السيرة الذاتية' : 'CV uploaded successfully');
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const skills = formData.skills || [];
    setFormData({ ...formData, skills: [...skills, newSkill.trim()] });
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    const skills = [...(formData.skills || [])];
    skills.splice(index, 1);
    setFormData({ ...formData, skills });
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { uid, ...data } = formData;
      await updateDoc(doc(db, 'users', user.uid), { ...data, updatedAt: new Date() });
      setUser({ ...user, ...data });
      toast.success(isAr ? 'تم حفظ التغييرات' : 'Changes saved');
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <main>
      <Navbar />
      <Toaster position="top-center" />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">
            {isAr ? 'الملف الشخصي' : 'Profile'}
          </h1>

          {/* Avatar & Basic Info */}
          <Card hover={false} className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white text-2xl font-bold">
                {formData.displayName?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{formData.displayName}</h2>
                <p className="text-[var(--foreground-secondary)]">{formData.email}</p>
                <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary-light)]">
                  {user.role === 'company' ? (isAr ? 'شركة' : 'Company') : (isAr ? 'فرد' : 'Individual')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={isAr ? 'الاسم' : 'Display Name'}
                name="displayName"
                value={formData.displayName || ''}
                onChange={handleChange}
                icon={<FiUser />}
              />
              <Input
                label={isAr ? 'الدولة' : 'Country'}
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                icon={<FiMapPin />}
              />
              <Input
                label={isAr ? 'المدينة' : 'City'}
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                icon={<FiMapPin />}
              />
              <Input
                label={isAr ? 'الهاتف' : 'Phone'}
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
              />
            </div>
          </Card>

          {/* Individual-specific fields */}
          {user.role === 'individual' && (
            <>
              <Card hover={false} className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  {isAr ? 'المعلومات المهنية' : 'Professional Info'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={isAr ? 'التخصص' : 'Specialization'}
                    name="specialization"
                    value={formData.specialization || ''}
                    onChange={handleChange}
                    icon={<FiBriefcase />}
                  />
                  <Input
                    label={isAr ? 'سنوات الخبرة' : 'Years of Experience'}
                    name="experienceYears"
                    type="number"
                    value={formData.experienceYears || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
                    {isAr ? 'نبذة عنك' : 'About You'}
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none"
                  />
                </div>
              </Card>

              {/* Skills */}
              <Card hover={false} className="mb-6">
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
                  {(formData.skills || []).map((skill: string, i: number) => (
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
              <Card hover={false} className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  {isAr ? 'السيرة الذاتية' : 'CV'}
                </h3>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--primary-light)] transition-colors">
                  <FiUpload size={32} className="text-[var(--foreground-secondary)] mb-2" />
                  <p className="text-[var(--foreground-secondary)]">
                    {formData.cvFile
                      ? (isAr ? 'تم رفع السيرة الذاتية ✓' : 'CV Uploaded ✓')
                      : (isAr ? 'اضغط لرفع السيرة الذاتية (PDF)' : 'Click to upload CV (PDF)')}
                  </p>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleCVUpload} />
                </label>
              </Card>
            </>
          )}

          {/* Company-specific fields */}
          {user.role === 'company' && (
            <Card hover={false} className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                {isAr ? 'معلومات الشركة' : 'Company Info'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={isAr ? 'المجال' : 'Industry'}
                  name="industry"
                  value={formData.industry || ''}
                  onChange={handleChange}
                />
                <Input
                  label={isAr ? 'الموقع الإلكتروني' : 'Website'}
                  name="website"
                  value={formData.website || ''}
                  onChange={handleChange}
                />
                <Input
                  label={isAr ? 'سنة التأسيس' : 'Founded Year'}
                  name="foundedYear"
                  type="number"
                  value={formData.foundedYear || ''}
                  onChange={handleChange}
                />
                <Input
                  label={isAr ? 'السجل التجاري' : 'Commercial Registration'}
                  name="commercialRegistration"
                  value={formData.commercialRegistration || ''}
                  onChange={handleChange}
                  disabled
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
                  {isAr ? 'وصف الشركة' : 'Company Description'}
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none"
                />
              </div>
            </Card>
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
