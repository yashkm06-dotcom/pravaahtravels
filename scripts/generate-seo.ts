import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildRobotsTxt,
  buildSitemapEntries,
  buildSitemapXml,
  type SitemapBlogRecord,
  type SitemapPackageRecord,
} from '../src/utils/seoSitemap';

type BuildEnvironment = 'production' | 'staging';

const environment = process.argv[2] as BuildEnvironment;
if (environment !== 'production' && environment !== 'staging') {
  throw new Error('Usage: tsx scripts/generate-seo.ts <production|staging> [--output <directory>]');
}

loadEnv({ path: path.resolve(`.env.${environment}`), override: false });

const outputFlagIndex = process.argv.indexOf('--output');
const outputDirectory = outputFlagIndex >= 0 && process.argv[outputFlagIndex + 1]
  ? path.resolve(process.argv[outputFlagIndex + 1])
  : path.resolve('public');

const readPublicRecords = async () => {
  if (environment !== 'production') return { packages: [], blogs: [] };

  const projectId = String(process.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  const databaseId = String(process.env.VITE_FIREBASE_DATABASE_ID || '(default)').trim();
  const adminApp = initializeApp({ credential: applicationDefault(), projectId }, `pravaah-seo-${environment}`);

  try {
    const database = getFirestore(adminApp, databaseId);
    const [packageSnapshot, blogSnapshot] = await Promise.all([
      database.collection('packages').get(),
      database.collection('blogs').get(),
    ]);

    const packages: SitemapPackageRecord[] = packageSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<SitemapPackageRecord, 'id'>),
    }));
    const blogs: SitemapBlogRecord[] = blogSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<SitemapBlogRecord, 'id'>),
    }));

    return { packages, blogs };
  } finally {
    await deleteApp(adminApp);
  }
};

const main = async () => {
  const { packages, blogs } = await readPublicRecords();
  const entries = buildSitemapEntries({
    packages,
    blogs,
    includeContent: environment === 'production',
  });

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, 'sitemap.xml'), buildSitemapXml(entries));
  if (environment === 'production') {
    fs.writeFileSync(path.join(outputDirectory, 'robots.txt'), buildRobotsTxt());
  }

  console.log(`[SEO] Generated ${entries.length} sitemap URLs for ${environment} in ${outputDirectory}.`);
};

main().catch((error) => {
  console.error('[SEO] Failed to generate SEO files:', error);
  process.exitCode = 1;
});
