import { Metadata } from 'next';

// Dynamic metadata for gym sites
export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;

  // In production: fetch gym data from Supabase
  // For now, use domain as placeholder
  const gymName = domain.split('.')[0].replace(/-/g, ' ');

  return {
    title: `${gymName} | Martial Arts & Fitness`,
    description: `Train at ${gymName}. View our class schedule, membership plans, and start your fitness journey today.`,
    openGraph: {
      title: `${gymName} | Martial Arts & Fitness`,
      description: `Train at ${gymName}. View our class schedule, membership plans, and start your fitness journey today.`,
      type: 'website',
    },
  };
}

export default function GymSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
