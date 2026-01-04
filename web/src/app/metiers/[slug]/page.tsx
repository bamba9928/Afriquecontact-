import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllJobs, getJobBySlug } from "@/lib/catalog.api";
import { rechercherPros } from "@/lib/pros.api";
import { mediaUrl } from "@/lib/media-url"; // ✅ Import nécessaire pour le SEO
import ProCard from "@/components/ProCard";
import { JsonLd } from "@/components/seo/JsonLd"; // ✅ Import du composant SEO
import { ChevronRight, Search, Briefcase } from "lucide-react";

type Props = {
  params: { slug: string };
};

// 1. GÉNÉRATION STATIQUE (SSG)
export async function generateStaticParams() {
  const jobs = await getAllJobs();
  return jobs.map((job) => ({
    slug: job.slug || job.name.toLowerCase().replace(/\s+/g, "-"),
  }));
}

// 2. SEO DYNAMIQUE
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug);
  const job = await getJobBySlug(decodedSlug);

  if (!job) return {};

  const currentYear = new Date().getFullYear();

  return {
    title: `Meilleurs ${job.name}s au Sénégal (${currentYear}) - Vérifiés & Avis`,
    description: `Trouvez les meilleurs ${job.name}s au Sénégal. Comparez les avis clients, les prix et contactez-les directement (Téléphone/WhatsApp).`,
    openGraph: {
      title: `Top ${job.name}s au Sénégal - Liste Vérifiée`,
      description: `Besoin d'un ${job.name} ? Voici la liste des professionnels recommandés et disponibles tout de suite.`,
      type: "website",
    },
  };
}

// 3. COMPOSANT DE PAGE (Server Component)
export default async function MetierPage({ params }: Props) {
  const decodedSlug = decodeURIComponent(params.slug);
  const job = await getJobBySlug(decodedSlug);

  if (!job) {
    notFound();
  }

  // Récupération des pros
  const prosData = await rechercherPros({
    metier: job.id,
    page_size: 24,
    sort: "distance"
  });

  const pros = prosData.results || [];
  const count = prosData.count || pros.length;

  // ✅ 4. CONSTRUCTION DU SCHEMA.ORG (ItemList)
  // Cela dit à Google : "Ceci est une liste de 24 Plombiers"
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": pros.map((pro, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://senegalcontacts.com/pros/${pro.slug || pro.id}`,
      "item": {
        "@type": "LocalBusiness", // Ou ProfessionalService
        "name": pro.nom_entreprise,
        "image": pro.avatar ? mediaUrl(pro.avatar) : undefined,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": pro.zone_name,
          "addressCountry": "SN"
        },
        "telephone": pro.telephone_appel
      }
    }))
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20">

      {/* ✅ Injection des données structurées */}
      <JsonLd data={jsonLdData} />

      <div className="mx-auto max-w-7xl px-4">

        {/* FIL D'ARIANE */}
        <nav className="flex items-center text-sm text-zinc-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">Accueil</Link>
          <ChevronRight size={14} className="mx-2 shrink-0" />
          <Link href="/recherche" className="hover:text-emerald-400 transition-colors">Tous les métiers</Link>
          <ChevronRight size={14} className="mx-2 shrink-0" />
          <span className="text-zinc-200 font-medium capitalize">{job.name}</span>
        </nav>

        {/* EN-TÊTE SEO */}
        <header className="mb-12 border-b border-white/10 pb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 mb-6">
            <Briefcase size={14} />
            Service Vérifié
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Trouvez un <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF00] to-emerald-500">{job.name}</span> au Sénégal
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl leading-relaxed">
            {count > 0
              ? `Consultez la liste de ${count} ${job.name}${count > 1 ? 's' : ''} qualifiés, notés par la communauté et disponibles près de chez vous. Contact direct et sans frais.`
              : `Soyez le premier ${job.name} à rejoindre notre réseau d'excellence au Sénégal.`
            }
          </p>
        </header>

        {/* GRILLE DES PROFESSIONNELS */}
        {pros.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pros.map((pro) => (
              <div key={pro.id} className="h-full">
                <ProCard pro={pro} />
              </div>
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center max-w-2xl mx-auto">
             <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 border border-white/10 mb-6 shadow-xl shadow-black/50">
               <Search className="text-zinc-500 h-8 w-8" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-3">Aucun {job.name} trouvé</h3>
             <p className="text-zinc-400 mb-8 leading-relaxed">
               Il n'y a pas encore de professionnel inscrit dans cette catégorie.
               Vous exercez ce métier ?
             </p>
             <Link
               href="/pro/register"
               className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-8 text-base font-bold text-white transition-all hover:bg-emerald-500 hover:scale-105 shadow-lg shadow-emerald-900/20"
             >
               Inscrire mon activité gratuitement
             </Link>
          </div>
        )}

        {/* MAILLAGE INTERNE (VILLES) */}
        {pros.length > 0 && (
          <div className="mt-24 pt-10 border-t border-white/10">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Search size={18} className="text-zinc-500" />
              Recherches fréquentes pour {job.name}
            </h2>
            <div className="flex flex-wrap gap-3">
              {["Dakar", "Thiès", "Saint-Louis", "Touba", "Mbour", "Ziguinchor"].map((city) => (
                <Link
                  key={city}
                  href={`/recherche?metier=${job.id}&q=${city}`}
                  className="rounded-full border border-white/10 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-400 hover:border-emerald-500/50 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  {job.name} à {city}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}