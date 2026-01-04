import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import ProDetailView from "@/components/pros/ProDetailView";
import { mediaUrl } from "@/lib/media-url";

// Helper de fetch sécurisé (Server-side)
async function getPro(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  try {
    const res = await fetch(`${apiUrl}/api/pros/public/${slug}/`, {
      next: { revalidate: 60 }, // Revalidate chaque minute (ISR)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

type Props = {
  params: { slug: string };
};

// 1. Génération dynamique des métadonnées SEO
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const pro = await getPro(params.slug);

  if (!pro) {
    return { title: "Professionnel Introuvable | SénégalContact" };
  }

  const previousImages = (await parent).openGraph?.images || [];
  const proImage = pro.avatar ? mediaUrl(pro.avatar) : "/og-default.jpg";

  return {
    title: `${pro.nom_entreprise} - ${pro.metier_name} à ${pro.zone_name} | SénégalContact`,
    description: pro.description
      ? pro.description.substring(0, 160)
      : `Contactez ${pro.nom_entreprise}, expert en ${pro.metier_name} situé à ${pro.zone_name}. Numéro vérifié et avis clients.`,
    openGraph: {
      title: pro.nom_entreprise,
      description: `Trouvez ${pro.nom_entreprise} sur SénégalContact.`,
      images: [proImage, ...previousImages],
      locale: "fr_SN",
      type: "profile",
    },
  };
}

// 2. Le Composant Serveur
export default async function ProPage({ params }: Props) {
  const pro = await getPro(params.slug);

  if (!pro) {
    notFound();
  }

  // 3. Construction du JSON-LD (LocalBusiness)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness", // Ou 'ProfessionalService'
    "name": pro.nom_entreprise,
    "image": pro.avatar ? mediaUrl(pro.avatar) : undefined,
    "telephone": pro.telephone_appel, // Même si masqué visuellement, Google le veut si possible
    "address": {
      "@type": "PostalAddress",
      "addressLocality": pro.zone_name,
      "addressCountry": "SN"
    },
    "description": pro.description,
    "url": `https://senegalcontact.com/pros/${pro.slug}`,
    "priceRange": "F CFA", // Requis par Google pour LocalBusiness parfois
  };

  return (
    <>
      {/* Injection du JSON-LD pour Google Maps/Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Rendu du composant Client interactif */}
      <ProDetailView initialPro={pro} />
    </>
  );
}