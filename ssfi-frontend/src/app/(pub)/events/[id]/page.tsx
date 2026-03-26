import type { Metadata } from 'next';
import EventDetailClient from './EventDetailClient';
import { EventSchema, BreadcrumbSchema } from '@/components/seo/StructuredData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1';

interface Props {
  params: Promise<{ id: string }>;
}

async function getEvent(id: string) {
  try {
    const res = await fetch(`${API_URL}/events/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return { title: 'Event Not Found' };
  }

  const description = event.description
    || `${event.name} — ${event.eventLevel || ''} speed skating event at ${event.venue}, ${event.city}. Organized by SSFI.`;

  return {
    title: event.name,
    description,
    alternates: { canonical: `/events/${id}` },
    openGraph: {
      title: `${event.name} | SSFI Events`,
      description,
      url: `/events/${id}`,
      type: 'website',
      images: event.bannerImage ? [{ url: event.bannerImage, alt: event.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.name,
      description,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEvent(id);

  return (
    <>
      {event && (
        <>
          <EventSchema
            name={event.name}
            description={event.description}
            startDate={event.eventDate}
            endDate={event.eventEndDate}
            venue={event.venue}
            city={event.city}
            state={event.state?.name}
            eventId={event.id}
            entryFee={event.entryFee}
            status={event.status}
            maxParticipants={event.maxParticipants}
            image={event.bannerImage}
          />
          <BreadcrumbSchema
            items={[
              { name: 'Home', url: '/' },
              { name: 'Events', url: '/events' },
              { name: event.name, url: `/events/${id}` },
            ]}
          />
        </>
      )}
      <EventDetailClient />
    </>
  );
}
