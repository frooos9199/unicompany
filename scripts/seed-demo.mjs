import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Timestamp, doc, getFirestore, setDoc } from 'firebase/firestore';

const envPath = resolve(process.cwd(), '.env.local');
const envLines = readFileSync(envPath, 'utf8').split('\n');

const env = Object.fromEntries(
  envLines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separatorIndex = line.indexOf('=');
      return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
    }),
);

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const dummyCompanies = [
  { companyName: 'TechVision Kuwait', industry: 'Technology', size: 'medium', commercialRegistration: 'CR-2024-001', city: 'Kuwait City', foundedYear: 2016 },
  { companyName: 'Gulf Builders Co.', industry: 'Construction', size: 'large', commercialRegistration: 'CR-2024-002', city: 'Hawalli', foundedYear: 2009 },
  { companyName: 'AlNoor Marketing', industry: 'Marketing', size: 'small', commercialRegistration: 'CR-2024-003', city: 'Salmiya', foundedYear: 2020 },
  { companyName: 'PetroChem Industries', industry: 'Oil & Gas', size: 'enterprise', commercialRegistration: 'CR-2024-004', city: 'Ahmadi', foundedYear: 2001 },
  { companyName: 'FinanceHub', industry: 'Finance', size: 'medium', commercialRegistration: 'CR-2024-005', city: 'Kuwait City', foundedYear: 2014 },
  { companyName: 'MediCare Group', industry: 'Healthcare', size: 'large', commercialRegistration: 'CR-2024-006', city: 'Jabriya', foundedYear: 2011 },
  { companyName: 'EduTech Solutions', industry: 'Education', size: 'small', commercialRegistration: 'CR-2024-007', city: 'Farwaniya', foundedYear: 2019 },
  { companyName: 'LogiTrans Shipping', industry: 'Logistics', size: 'medium', commercialRegistration: 'CR-2024-008', city: 'Shuwaikh', foundedYear: 2013 },
  { companyName: 'FoodMaster KW', industry: 'Food & Beverage', size: 'small', commercialRegistration: 'CR-2024-009', city: 'Fahaheel', foundedYear: 2018 },
  { companyName: 'CloudNet Systems', industry: 'Technology', size: 'medium', commercialRegistration: 'CR-2024-010', city: 'Sabah Al Salem', foundedYear: 2017 },
];

const dummyIndividuals = [
  { firstName: 'Ahmed', lastName: 'Al-Sabah', title: 'Senior Developer', specialization: 'Web Development', skills: ['React', 'Node.js', 'TypeScript'], experienceYears: 5, city: 'Kuwait City' },
  { firstName: 'Fatima', lastName: 'Hassan', title: 'UI/UX Designer', specialization: 'Design', skills: ['Figma', 'Adobe XD', 'CSS'], experienceYears: 3, city: 'Salmiya' },
  { firstName: 'Mohammed', lastName: 'Al-Rashid', title: 'Data Analyst', specialization: 'Data Science', skills: ['Python', 'SQL', 'Tableau'], experienceYears: 4, city: 'Hawalli' },
  { firstName: 'Sara', lastName: 'Al-Mutairi', title: 'Project Manager', specialization: 'Management', skills: ['Agile', 'Scrum', 'Jira'], experienceYears: 7, city: 'Jabriya' },
  { firstName: 'Omar', lastName: 'Khalid', title: 'DevOps Engineer', specialization: 'Cloud', skills: ['AWS', 'Docker', 'Kubernetes'], experienceYears: 6, city: 'Fintas' },
  { firstName: 'Noor', lastName: 'Al-Ahmad', title: 'Marketing Specialist', specialization: 'Digital Marketing', skills: ['SEO', 'Google Ads', 'Analytics'], experienceYears: 2, city: 'Farwaniya' },
  { firstName: 'Khalid', lastName: 'Mansour', title: 'Mobile Developer', specialization: 'Mobile Development', skills: ['Flutter', 'React Native', 'Swift'], experienceYears: 4, city: 'Mahboula' },
  { firstName: 'Layla', lastName: 'Ibrahim', title: 'Accountant', specialization: 'Finance', skills: ['Excel', 'SAP', 'QuickBooks'], experienceYears: 5, city: 'Mangaf' },
  { firstName: 'Yousef', lastName: 'Al-Enezi', title: 'Cybersecurity Analyst', specialization: 'Security', skills: ['Penetration Testing', 'SIEM', 'Firewalls'], experienceYears: 3, city: 'Shuwaikh' },
  { firstName: 'Maryam', lastName: 'Al-Dosari', title: 'HR Manager', specialization: 'Human Resources', skills: ['Recruitment', 'Training', 'Labor Law'], experienceYears: 8, city: 'Sabah Al Salem' },
];

const dummyJobs = [
  { title: 'Senior React Developer', type: 'full-time', salary: '1500-2500 KWD', requirements: ['React', 'TypeScript', '3+ years'] },
  { title: 'Graphic Designer', type: 'remote', salary: '800-1200 KWD', requirements: ['Adobe Suite', 'Figma', 'Portfolio'] },
  { title: 'Data Engineer', type: 'full-time', salary: '2000-3000 KWD', requirements: ['Python', 'Spark', 'AWS'] },
  { title: 'Sales Manager', type: 'full-time', salary: '1200-1800 KWD', requirements: ['5+ years sales', 'Leadership', 'CRM'] },
  { title: 'Content Writer (Arabic)', type: 'freelance', salary: '500-900 KWD', requirements: ['Arabic native', 'SEO', 'Creative writing'] },
  { title: 'iOS Developer', type: 'contract', salary: '1800-2500 KWD', requirements: ['Swift', 'SwiftUI', '2+ years'] },
  { title: 'Network Administrator', type: 'full-time', salary: '1000-1500 KWD', requirements: ['CCNA', 'Linux', 'Firewall'] },
  { title: 'Digital Marketing Lead', type: 'remote', salary: '1300-2000 KWD', requirements: ['Google Ads', 'Meta Ads', 'Analytics'] },
  { title: 'Mechanical Engineer', type: 'full-time', salary: '1500-2200 KWD', requirements: ['AutoCAD', 'SolidWorks', '3+ years'] },
  { title: 'Customer Support Agent', type: 'part-time', salary: '400-700 KWD', requirements: ['English+Arabic', 'Communication', 'CRM'] },
];

const companyLogoPalettes = [
  ['#143A52', '#1F6E8C', '#EAF3F8'],
  ['#3D2C8D', '#916BBF', '#F7F3FF'],
  ['#0F766E', '#14B8A6', '#E6FFFA'],
  ['#7C2D12', '#EA580C', '#FFF7ED'],
  ['#1E3A8A', '#60A5FA', '#EFF6FF'],
];

const talentAvatarPalettes = [
  ['#244855', '#90AEAD', '#FBE9D0'],
  ['#6B2D5C', '#D17D98', '#FFF1F2'],
  ['#2E4057', '#66A5AD', '#F6F1D1'],
  ['#3F3D56', '#F2A154', '#FFF4E6'],
  ['#1F2937', '#34D399', '#ECFDF5'],
];

function createSvgDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createCompanyLogo(name, index) {
  const [bg, accent, text] = companyLogoPalettes[index % companyLogoPalettes.length];
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  return createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="36" fill="url(#g)" />
      <circle cx="128" cy="34" r="14" fill="${text}" opacity="0.22" />
      <path d="M26 112C44 83 73 68 111 66" stroke="${text}" stroke-width="10" stroke-linecap="round" opacity="0.18" />
      <text x="80" y="96" text-anchor="middle" font-size="52" font-family="Arial, sans-serif" font-weight="700" fill="${text}">${initials}</text>
    </svg>
  `);
}

function createTalentAvatar(name, index) {
  const [bg, accent, text] = talentAvatarPalettes[index % talentAvatarPalettes.length];
  const initial = name.charAt(0).toUpperCase();

  return createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <radialGradient id="g" cx="35%" cy="30%" r="90%">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${bg}" />
        </radialGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#g)" />
      <circle cx="80" cy="60" r="30" fill="${text}" opacity="0.28" />
      <path d="M34 138c10-24 28-38 46-38s36 14 46 38" fill="${text}" opacity="0.22" />
      <text x="80" y="96" text-anchor="middle" font-size="56" font-family="Arial, sans-serif" font-weight="700" fill="${text}">${initial}</text>
    </svg>
  `);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, 'admin@unicompany.com', '123456');
await auth.authStateReady();

if (!auth.currentUser) {
  throw new Error('Admin user is not authenticated for Firestore writes.');
}

await auth.currentUser.getIdToken(true);

const now = Timestamp.now();
const cvFilePath = '/sample-cv.pdf';

for (let i = 0; i < dummyCompanies.length; i++) {
  const company = dummyCompanies[i];
  const id = `company_${i + 1}`;
  const avatar = createCompanyLogo(company.companyName, i);
  await setDoc(doc(db, 'users', id), {
    uid: id,
    email: `${company.companyName.toLowerCase().replace(/[\s.]+/g, '')}@example.com`,
    role: 'company',
    displayName: company.companyName,
    companyName: company.companyName,
    companyNameAr: `شركة ${company.companyName}`,
    avatar,
    commercialRegistration: company.commercialRegistration,
    industry: company.industry,
    industryAr: company.industry,
    size: company.size,
    description: `${company.companyName} is a leading ${company.industry} company in Kuwait.`,
    descriptionAr: `${company.companyName} شركة رائدة في مجال ${company.industry} داخل الكويت.`,
    services: [company.industry, 'Consulting', 'Strategy'],
    projects: [{ id: `${id}_project_1`, title: `${company.companyName} Flagship Project`, titleAr: `المشروع الرئيسي لـ ${company.companyName}`, description: `A featured ${company.industry} project delivered for enterprise clients.`, descriptionAr: `مشروع بارز في مجال ${company.industry} تم تنفيذه لعملاء من الشركات.`, year: 2024 }],
    teamMembers: [
      { id: `${id}_member_1`, name: 'Operations Lead', position: 'Operations Lead' },
      { id: `${id}_member_2`, name: 'Technical Manager', position: 'Technical Manager' },
    ],
    contactInfo: { email: `info@${company.companyName.toLowerCase().replace(/[\s.]+/g, '')}.com` },
    website: `https://${company.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.example.com`,
    foundedYear: company.foundedYear,
    country: 'Kuwait',
    city: company.city,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    language: 'en',
    emailVerified: true,
  });
}

for (let i = 0; i < dummyIndividuals.length; i++) {
  const individual = dummyIndividuals[i];
  const id = `individual_${i + 1}`;
  const displayName = `${individual.firstName} ${individual.lastName}`;
  await setDoc(doc(db, 'users', id), {
    uid: id,
    email: `${individual.firstName.toLowerCase()}.${individual.lastName.toLowerCase().replace('-', '')}@example.com`,
    role: 'individual',
    displayName,
    avatar: createTalentAvatar(displayName, i),
    firstName: individual.firstName,
    lastName: individual.lastName,
    title: individual.title,
    titleAr: individual.title,
    specialization: individual.specialization,
    specializationAr: individual.specialization,
    skills: individual.skills,
    experienceYears: individual.experienceYears,
    bio: `${individual.title} with ${individual.experienceYears} years of experience in ${individual.specialization}.`,
    bioAr: `${individual.title} بخبرة ${individual.experienceYears} سنوات في ${individual.specialization}.`,
    phone: `+965 9000${String(i + 1).padStart(4, '0')}`,
    cvVisibility: i < 2 ? 'public' : i < 7 ? 'request_only' : 'private',
    hasCv: true,
    country: 'Kuwait',
    city: individual.city,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    language: 'en',
    emailVerified: true,
  });

  await setDoc(doc(db, 'cvProfiles', id), {
    userId: id,
    cvVisibility: i < 2 ? 'public' : i < 7 ? 'request_only' : 'private',
    cvFile: cvFilePath,
    cvData: {
      education: [{ institution: 'Kuwait University', institutionAr: 'جامعة الكويت', degree: 'Bachelor', degreeAr: 'بكالوريوس', field: individual.specialization, fieldAr: individual.specialization, startDate: '2015', endDate: '2019', current: false }],
      experience: [{ company: dummyCompanies[i].companyName, companyAr: dummyCompanies[i].companyName, position: individual.title, positionAr: individual.title, description: `Worked as ${individual.title}`, descriptionAr: `عمل في منصب ${individual.title}`, startDate: '2020', current: true }],
      skills: individual.skills,
      languages: ['Arabic', 'English'],
      languagesAr: ['العربية', 'الإنجليزية'],
      certifications: ['Professional Certificate'],
      certificationsAr: ['شهادة مهنية'],
    },
    createdAt: now,
    updatedAt: now,
  });
}

for (let i = 0; i < dummyJobs.length; i++) {
  const job = dummyJobs[i];
  const id = `job_${i + 1}`;
  await setDoc(doc(db, 'jobs', id), {
    id,
    title: job.title,
    description: `We are looking for a ${job.title} to join our team.`,
    companyId: `company_${i + 1}`,
    companyName: dummyCompanies[i].companyName,
    companyAvatar: createCompanyLogo(dummyCompanies[i].companyName, i),
    country: 'Kuwait',
    city: 'Kuwait City',
    type: job.type,
    salary: job.salary,
    requirements: job.requirements,
    status: 'active',
    createdAt: now,
  });
}

console.log('Seeded companies, individuals, and jobs.');

for (let i = 0; i < 10; i++) {
  console.log(`Seeding application ${i + 1}`);
  await setDoc(doc(db, 'applications', `application_${i + 1}`), {
    id: `application_${i + 1}`,
    jobId: `job_${i + 1}`,
    companyId: `company_${i + 1}`,
    applicantId: `individual_${i + 1}`,
    applicantName: `${dummyIndividuals[i].firstName} ${dummyIndividuals[i].lastName}`,
    message: 'I am interested in this position.',
    status: i < 2 ? 'accepted' : 'pending',
    createdAt: now,
  });

  console.log(`Seeding CV request ${i + 1}`);
  const requestId = `company_${i + 1}_individual_${i + 1}`;
  await setDoc(doc(db, 'cvRequests', requestId), {
    id: requestId,
    companyId: `company_${i + 1}`,
    companyName: dummyCompanies[i].companyName,
    individualId: `individual_${i + 1}`,
    individualName: `${dummyIndividuals[i].firstName} ${dummyIndividuals[i].lastName}`,
    status: i < 2 ? 'approved' : i < 4 ? 'pending' : 'rejected',
    message: `${dummyCompanies[i].companyName} would like to view your CV.`,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Seeding conversation ${i + 1}`);
  await setDoc(doc(db, 'conversations', `conversation_${i + 1}`), {
    participants: [`company_${i + 1}`, `individual_${i + 1}`],
    participantNames: [dummyCompanies[i].companyName, `${dummyIndividuals[i].firstName} ${dummyIndividuals[i].lastName}`],
    lastMessage: `Hello ${dummyIndividuals[i].firstName}, we reviewed your profile.`,
    lastMessageAt: now,
    createdAt: now,
  });

  console.log(`Seeding first message ${i + 1}`);
  await setDoc(doc(db, 'messages', `message_${i + 1}_1`), {
    conversationId: `conversation_${i + 1}`,
    senderId: `company_${i + 1}`,
    content: `Hello ${dummyIndividuals[i].firstName}, we reviewed your profile and CV.`,
    createdAt: now,
    read: true,
  });

  console.log(`Seeding second message ${i + 1}`);
  await setDoc(doc(db, 'messages', `message_${i + 1}_2`), {
    conversationId: `conversation_${i + 1}`,
    senderId: `individual_${i + 1}`,
    content: 'Thank you, I would love to discuss the opportunity further.',
    createdAt: now,
    read: false,
  });

  console.log(`Seeding notification ${i + 1}`);
  await setDoc(doc(db, 'notifications', `notification_${i + 1}`), {
    userId: `individual_${i + 1}`,
    type: 'new_message',
    title: 'New message from company',
    message: `${dummyCompanies[i].companyName} sent a new message about your profile.`,
    read: false,
    createdAt: now,
    data: { conversationId: `conversation_${i + 1}` },
  });
}

console.log('Seed complete for companies, talents, jobs, applications, CV requests, conversations, messages, and notifications.');