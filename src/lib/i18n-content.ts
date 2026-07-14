import { AppUser, Education, Experience, Project } from '@/types';

export function getLocalizedValue(primary: string | undefined, alternate: string | undefined, locale: 'ar' | 'en') {
  if (locale === 'ar') {
    return alternate || primary || '';
  }

  return primary || alternate || '';
}

export function getLocalizedArray(primary: string[] | undefined, alternate: string[] | undefined, locale: 'ar' | 'en') {
  const preferred = locale === 'ar' ? alternate : primary;
  const fallback = locale === 'ar' ? primary : alternate;
  return (preferred && preferred.length > 0 ? preferred : fallback) || [];
}

export function getLocalizedUserTitle(user: Partial<AppUser>, locale: 'ar' | 'en') {
  return getLocalizedValue(user.title, user.titleAr, locale);
}

export function getLocalizedSpecialization(user: Partial<AppUser>, locale: 'ar' | 'en') {
  return getLocalizedValue(user.specialization, user.specializationAr, locale);
}

export function getLocalizedBio(user: Partial<AppUser>, locale: 'ar' | 'en') {
  return getLocalizedValue(user.bio, user.bioAr, locale);
}

export function getLocalizedCompanyName(user: Partial<AppUser>, locale: 'ar' | 'en') {
  return getLocalizedValue(user.companyName, user.companyNameAr, locale);
}

export function getLocalizedCompanyDescription(user: Partial<AppUser>, locale: 'ar' | 'en') {
  return getLocalizedValue(user.description, user.descriptionAr, locale);
}

export function getLocalizedIndustry(user: Partial<AppUser>, locale: 'ar' | 'en') {
  return getLocalizedValue(user.industry, user.industryAr, locale);
}

export function getLocalizedServices(user: Partial<AppUser>, locale: 'ar' | 'en') {
  return getLocalizedArray(user.services, user.servicesAr, locale);
}

export function getLocalizedProjectTitle(project: Project, locale: 'ar' | 'en') {
  return getLocalizedValue(project.title, project.titleAr, locale);
}

export function getLocalizedProjectDescription(project: Project, locale: 'ar' | 'en') {
  return getLocalizedValue(project.description, project.descriptionAr, locale);
}

export function getLocalizedJobTitle(job: { title?: string; titleAr?: string }, locale: 'ar' | 'en') {
  return getLocalizedValue(job.title, job.titleAr, locale);
}

export function getLocalizedJobDescription(job: { description?: string; descriptionAr?: string }, locale: 'ar' | 'en') {
  return getLocalizedValue(job.description, job.descriptionAr, locale);
}

export function getLocalizedEducationInstitution(item: Education, locale: 'ar' | 'en') {
  return getLocalizedValue(item.institution, item.institutionAr, locale);
}

export function getLocalizedEducationDegree(item: Education, locale: 'ar' | 'en') {
  return getLocalizedValue(item.degree, item.degreeAr, locale);
}

export function getLocalizedEducationField(item: Education, locale: 'ar' | 'en') {
  return getLocalizedValue(item.field, item.fieldAr, locale);
}

export function getLocalizedExperienceCompany(item: Experience, locale: 'ar' | 'en') {
  return getLocalizedValue(item.company, item.companyAr, locale);
}

export function getLocalizedExperiencePosition(item: Experience, locale: 'ar' | 'en') {
  return getLocalizedValue(item.position, item.positionAr, locale);
}

export function getLocalizedExperienceDescription(item: Experience, locale: 'ar' | 'en') {
  return getLocalizedValue(item.description, item.descriptionAr, locale);
}