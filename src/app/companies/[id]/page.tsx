'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/lib/firebase';
import { AppUser, Job } from '@/types';
import { findOrCreateConversation } from '@/lib/chat';
import { FiBriefcase, FiClock, FiDollarSign, FiGlobe, FiGrid, FiImage, FiInfo, FiLayers, FiMapPin, FiMessageSquare } from 'react-icons/fi';
import { getLocalizedCompanyDescription, getLocalizedCompanyName, getLocalizedIndustry, getLocalizedJobDescription, getLocalizedJobTitle, getLocalizedProjectDescription, getLocalizedProjectTitle, getLocalizedServices } from '@/lib/i18n-content';

function normalizeTokens(...values: Array<string | undefined>) {
  return new Set(
    values
      .flatMap((value) => (value || '').toLowerCase().split(/[^\p{L}\p{N}]+/u))
      .map((token) => token.trim())
      .filter((token) => token.length > 2),
  );
}

function scoreCompanySimilarity(baseCompany: AppUser, candidate: AppUser) {
  let score = 0;

  if (baseCompany.industry && candidate.industry && baseCompany.industry === candidate.industry) {
    score += 4;
  }

  if (baseCompany.country && candidate.country && baseCompany.country === candidate.country) {
    score += 1;
  }

  if (baseCompany.size && candidate.size && baseCompany.size === candidate.size) {
    score += 1;
  }

  const baseServices = new Set(baseCompany.services ?? []);
  const sharedServices = (candidate.services ?? []).filter((service) => baseServices.has(service)).length;
  score += sharedServices * 2;

  const baseTokens = normalizeTokens(
    baseCompany.industry,
    baseCompany.description,
    ...(baseCompany.services ?? []),
    ...((baseCompany.projects ?? []).flatMap((project) => [project.title, project.description])),
  );
  const candidateTokens = normalizeTokens(
    candidate.industry,
    candidate.description,
    ...(candidate.services ?? []),
    ...((candidate.projects ?? []).flatMap((project) => [project.title, project.description])),
  );
  let textOverlap = 0;
  candidateTokens.forEach((token) => {
    if (baseTokens.has(token)) {
      textOverlap += 1;
    }
  });
  score += Math.min(textOverlap, 4);

  return score;
}

export default function CompanyDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, theme } = useAppStore();
  const { user } = useAuthStore();
  const isAr = locale === 'ar';
  const [company, setCompany] = useState<AppUser | null>(null);
  const [similarCompanies, setSimilarCompanies] = useState<AppUser[]>([]);
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'users', params.id));
        if (snapshot.exists()) {
          const companyProfile = { uid: snapshot.id, ...snapshot.data() } as AppUser;
          setCompany(companyProfile);

          const similarQuery = query(
            collection(db, 'users'),
            where('role', '==', 'company'),
            where('isActive', '==', true),
            limit(12),
          );
          const similarSnapshot = await getDocs(similarQuery);
          const related = similarSnapshot.docs
            .map((docSnapshot) => ({ uid: docSnapshot.id, ...docSnapshot.data() } as AppUser))
            .filter((item) => item.uid !== params.id)
            .map((item) => ({ item, score: scoreCompanySimilarity(companyProfile, item) }))
            .filter(({ score }) => score > 0)
            .sort((left, right) => right.score - left.score)
            .map(({ item }) => item)
            .slice(0, 3);

          setSimilarCompanies(related);

          const jobsQuery = query(collection(db, 'jobs'), where('companyId', '==', params.id), limit(6));
          const jobsSnapshot = await getDocs(jobsQuery);
          const roles = jobsSnapshot.docs
            .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Job))
            .filter((job) => job.status !== 'closed');

          setCompanyJobs(roles);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadCompany();
  }, [params.id]);

  const handleDirectContact = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!company) return;

    try {
      const conversationId = await findOrCreateConversation(user, company);
      router.push(`/chat?conversation=${conversationId}`);
    } catch {
      toast.error(isAr ? 'تعذر فتح المحادثة' : 'Could not open conversation');
    }
  };

  const companyProjects = company?.projects ?? [];
  const companyServices = getLocalizedServices(company ?? {}, locale);
  const localizedCompanyName = getLocalizedCompanyName(company ?? {}, locale);
  const localizedCompanyDescription = getLocalizedCompanyDescription(company ?? {}, locale);
  const localizedIndustry = getLocalizedIndustry(company ?? {}, locale);
  const companyGallery = [company?.avatar, ...companyProjects.map((project) => project.image)].filter(Boolean) as string[];
  const sectionLinks = [
    { id: 'company-overview', label: isAr ? 'الدسكربشن' : 'Description', icon: FiInfo },
    { id: 'company-services', label: isAr ? 'السيرفس' : 'Services', icon: FiLayers },
    { id: 'company-gallery', label: isAr ? 'صور الشركة' : 'Company Images', icon: FiImage },
    { id: 'company-details', label: isAr ? 'التفاصيل' : 'Details', icon: FiGrid },
    ...(companyProjects.length > 0 ? [{ id: 'company-projects', label: isAr ? 'المشاريع' : 'Projects', icon: FiBriefcase }] : []),
    ...(companyJobs.length > 0 ? [{ id: 'company-jobs', label: isAr ? 'الوظائف' : 'Jobs', icon: FiClock }] : []),
    ...(similarCompanies.length > 0 ? [{ id: 'company-similar', label: isAr ? 'شركات مشابهة' : 'Similar', icon: FiGlobe }] : []),
  ];

  let pageContent: React.ReactNode;

  if (loading) {
    pageContent = <div className="h-64 rounded-2xl bg-[var(--background-secondary)] animate-pulse" />;
  } else if (!company) {
    pageContent = (
      <div className="text-center py-16 text-[var(--foreground-secondary)]">
        {isAr ? 'لم يتم العثور على الشركة' : 'Company not found'}
      </div>
    );
  } else {
    pageContent = (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)] gap-6 xl:gap-8">
          <aside className="hidden xl:block xl:sticky xl:top-24 h-fit">
            <Card hover={false} className="p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary-light)] font-semibold mb-2">
                  {isAr ? 'أقسام الصفحة' : 'Page Sections'}
                </p>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{isAr ? 'تنقل سريع' : 'Quick Navigation'}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-1 gap-2">
                {sectionLinks.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-3 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary-light)] hover:text-[var(--primary-light)] transition-colors"
                    >
                      <Icon size={16} />
                      <span>{section.label}</span>
                    </a>
                  );
                })}
              </div>
            </Card>
          </aside>

          <div className="space-y-8">
            <div className="xl:hidden -mx-1 overflow-x-auto pb-1">
              <div className="flex gap-2 min-w-max px-1">
                {sectionLinks.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-sm hover:border-[var(--primary-light)] hover:text-[var(--primary-light)] transition-colors"
                    >
                      <Icon size={15} />
                      <span>{section.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            <Card hover={false} className="overflow-hidden">
              <div className="rounded-3xl bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--accent)]/10 p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4 sm:gap-5">
                    {company.avatar ? (
                      <img
                        src={company.avatar}
                        alt={company.companyName || 'Company logo'}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border border-[var(--border)] bg-[var(--background-secondary)]"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white text-3xl font-bold">
                        {company.companyName?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <span className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary-light)] mb-3">
                        {isAr ? 'كرت شركة' : 'Company Card'}
                      </span>
                      <h1 className="text-3xl font-bold text-[var(--foreground)]">{localizedCompanyName || company.companyName}</h1>
                      <p className="text-[var(--foreground-secondary)] mt-1">{localizedIndustry || (isAr ? 'بدون مجال محدد' : 'No industry specified')}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--foreground-secondary)]">
                        {company.country && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-secondary)] px-3 py-1.5">
                            <FiMapPin size={14} /> {company.country}{company.city ? `, ${company.city}` : ''}
                          </span>
                        )}
                        {company.website && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-secondary)] px-3 py-1.5">
                            <FiGlobe size={14} /> {company.website}
                          </span>
                        )}
                        {company.size && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-secondary)] px-3 py-1.5">
                            <FiBriefcase size={14} /> {company.size}
                          </span>
                        )}
                      </div>
                      {user && user.uid !== company.uid && user.role === 'individual' && (
                        <div className="mt-5">
                          <Button variant="secondary" onClick={handleDirectContact}>
                            <FiMessageSquare size={16} />
                            {isAr ? 'تواصل مع الشركة' : 'Contact Company'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                      <p className="text-xs text-[var(--foreground-secondary)] mb-1">{isAr ? 'الخدمات' : 'Services'}</p>
                      <p className="text-2xl font-semibold text-[var(--foreground)]">{company.services?.length || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                      <p className="text-xs text-[var(--foreground-secondary)] mb-1">{isAr ? 'المشاريع' : 'Projects'}</p>
                      <p className="text-2xl font-semibold text-[var(--foreground)]">{company.projects?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div id="company-overview" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 scroll-mt-28">
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                      {isAr ? 'المعلومات الرئيسية' : 'Main Information'}
                    </h2>
                    <p className="text-[var(--foreground-secondary)] leading-7">
                      {localizedCompanyDescription || (isAr ? 'هذه البطاقة تعرض ملخصًا سريعًا عن الشركة وخدماتها الأساسية وطبيعة نشاطها.' : 'This card provides a quick overview of the company, its core services, and business direction.')}
                    </p>
                  </div>

                  <div id="company-services" className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6 scroll-mt-28">
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                      {isAr ? 'الخدمات الرئيسية' : 'Primary Services'}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {companyServices.length > 0 ? companyServices.map((service) => (
                        <span key={service} className="px-3 py-1 rounded-full text-sm bg-[var(--accent)]/10 text-[var(--accent)]">
                          {service}
                        </span>
                      )) : (
                        <p className="text-[var(--foreground-secondary)] text-sm">{isAr ? 'لا توجد خدمات مضافة بعد' : 'No services added yet'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div id="company-gallery" className="mt-6 scroll-mt-28">
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">{isAr ? 'صور الشركة' : 'Company Images'}</h2>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                          {isAr ? 'نظرة بصرية سريعة على صورة الشركة والصور المرفقة بالمشاريع' : 'A visual glance at the company avatar and any attached project images'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {companyGallery.length > 0 ? companyGallery.map((image, index) => (
                        <div key={`${image}-${index}`} className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] aspect-[4/3]">
                          <img src={image} alt={company.companyName || 'Company image'} className="w-full h-full object-cover" />
                        </div>
                      )) : (
                        <div className="sm:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--background-secondary)] p-8 text-center text-[var(--foreground-secondary)]">
                          {isAr ? 'لا توجد صور إضافية للشركة حتى الآن' : 'No extra company images yet'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div id="company-details" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 scroll-mt-28">
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{isAr ? 'بيانات العمل' : 'Business Details'}</h2>
                    <div className="space-y-3 text-sm text-[var(--foreground-secondary)]">
                      <p><span className="text-[var(--foreground)] font-medium">{isAr ? 'السجل التجاري:' : 'Registration:'}</span> {company.commercialRegistration || '-'}</p>
                      <p><span className="text-[var(--foreground)] font-medium">{isAr ? 'سنة التأسيس:' : 'Founded:'}</span> {company.foundedYear || '-'}</p>
                      <p><span className="text-[var(--foreground)] font-medium">{isAr ? 'الحجم:' : 'Size:'}</span> {company.size || '-'}</p>
                      <p><span className="text-[var(--foreground)] font-medium">{isAr ? 'المجال:' : 'Industry:'}</span> {company.industry || '-'}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6 md:col-span-2">
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{isAr ? 'التواصل والقنوات' : 'Contact and Channels'}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[var(--foreground-secondary)]">
                      <div className="rounded-2xl bg-[var(--background-secondary)] px-4 py-3">
                        <p className="text-xs mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</p>
                        <p className="text-[var(--foreground)] break-all">{company.contactInfo?.email || company.email}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--background-secondary)] px-4 py-3">
                        <p className="text-xs mb-1">{isAr ? 'الموقع' : 'Website'}</p>
                        <p className="text-[var(--foreground)] break-all">{company.website || company.contactInfo?.website || '-'}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--background-secondary)] px-4 py-3">
                        <p className="text-xs mb-1">{isAr ? 'الهاتف' : 'Phone'}</p>
                        <p className="text-[var(--foreground)]">{company.contactInfo?.phone || company.phone || '-'}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--background-secondary)] px-4 py-3">
                        <p className="text-xs mb-1">{isAr ? 'العنوان' : 'Address'}</p>
                        <p className="text-[var(--foreground)]">{company.contactInfo?.address || `${company.country || ''}${company.city ? `, ${company.city}` : ''}` || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {companyProjects.length > 0 && (
              <section id="company-projects" className="scroll-mt-28">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'مشاريع الشركة' : 'Company Projects'}</h2>
                  <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                    {isAr ? 'استعراض سريع لأهم المشاريع المرتبطة بالشركة' : 'A quick overview of the company’s listed work and projects'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {companyProjects.map((project) => (
                    <Card key={project.id} className="h-full flex flex-col">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <h3 className="font-semibold text-[var(--foreground)]">{getLocalizedProjectTitle(project, locale)}</h3>
                        <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary-light)]">{project.year}</span>
                      </div>
                      <p className="text-sm text-[var(--foreground-secondary)] flex-1">{getLocalizedProjectDescription(project, locale)}</p>
                      {project.link && (
                        <a href={project.link} target="_blank" rel="noreferrer" className="mt-4 text-sm font-medium text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">
                          {isAr ? 'فتح الرابط' : 'Open Link'}
                        </a>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {companyJobs.length > 0 && (
              <section id="company-jobs" className="scroll-mt-28">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'وظائف الشركة' : 'Company Jobs'}</h2>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                      {isAr ? 'الوظائف المرتبطة بهذه الشركة داخل نفس صفحة الكرت' : 'Open roles connected to this company within the same card page'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                  {companyJobs.map((job, index) => (
                    <motion.div key={job.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Link href={`/jobs/${job.id}`} className="block h-full">
                        <Card className="h-full flex flex-col group">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--primary-light)] transition-colors">{getLocalizedJobTitle(job, locale)}</h3>
                              <p className="text-sm text-[var(--foreground-secondary)] mt-1 line-clamp-2">{getLocalizedJobDescription(job, locale)}</p>
                            </div>
                            <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                              {job.status === 'active' ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'مغلقة' : 'Closed')}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--foreground-secondary)]">
                            <span className="inline-flex items-center gap-1.5">
                              <FiMapPin size={14} /> {job.country}{job.city ? `, ${job.city}` : ''}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <FiClock size={14} /> {job.type}
                            </span>
                            {job.salary && (
                              <span className="inline-flex items-center gap-1.5">
                                <FiDollarSign size={14} /> {job.salary}
                              </span>
                            )}
                          </div>

                          {job.requirements?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {job.requirements.slice(0, 4).map((requirement) => (
                                <span key={requirement} className="px-2.5 py-1 rounded-full text-xs bg-[var(--primary-light)]/10 text-[var(--primary-light)]">
                                  {requirement}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-4 text-sm font-medium text-[var(--primary-light)] group-hover:text-[var(--primary)] transition-colors">
                            {isAr ? 'عرض كرت الوظيفة' : 'Open Job Card'}
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {similarCompanies.length > 0 && (
              <section id="company-similar" className="scroll-mt-28">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'شركات مشابهة' : 'Similar Companies'}</h2>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                      {isAr ? 'ترشيحات مبنية على المجال والخدمات والموقع وحجم الشركة' : 'Recommendations ranked by industry, services, location, and company size'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {similarCompanies.map((item, index) => (
                    <motion.div key={item.uid} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Link href={`/companies/${item.uid}`}>
                        <Card className="h-full flex flex-col group">
                          <div className="flex items-center gap-3 mb-4">
                            {item.avatar ? (
                              <img src={item.avatar} alt={item.companyName || 'Company logo'} className="w-14 h-14 rounded-2xl object-cover border border-[var(--border)]" />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold text-lg">
                                {item.companyName?.charAt(0) || 'C'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-semibold text-[var(--foreground)] truncate">{item.companyName}</h3>
                              <p className="text-sm text-[var(--primary-light)] truncate">{item.industry || (isAr ? 'شركة' : 'Company')}</p>
                            </div>
                          </div>
                          <p className="text-sm text-[var(--foreground-secondary)] mb-4 line-clamp-3 flex-1">
                            {item.description || (isAr ? 'بطاقة مختصرة للشركة مع أهم المعلومات الرئيسية.' : 'A short company card with its most important core details.')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(item.services ?? []).slice(0, 3).map((service) => (
                              <span key={service} className="px-2.5 py-1 rounded-full text-xs bg-[var(--accent)]/10 text-[var(--accent)]">{service}</span>
                            ))}
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {pageContent}
      </div>
      <Footer />
    </main>
  );
}