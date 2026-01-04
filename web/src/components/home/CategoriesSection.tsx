import Link from "next/link";
import {
  Briefcase,
  Wrench,       // Plomberie
  Zap,          // Électricité
  Paintbrush,   // Peinture
  Hammer,       // Menuiserie
  Truck,        // Transport/Déménagement
  Scissors,     // Couture/Coiffure
  Thermometer,  // Froid/Clim
  ChefHat,      // Restauration
  Monitor,      // Informatique
  ArrowRight,
  Car,          // Mécanique
  BrickWall,    // Maçonnerie
  Sparkles,     // Ménage/Nettoyage
  Shield,       // Sécurité/Gardiennage
  Sun,          // Énergie Solaire
  Smartphone,   // Réparation téléphone
  GraduationCap,// Enseignement/Cours
  Shovel,       // Jardinage/Agriculture
  Baby,         // Nounou/Garderie
  Camera        // Photo/Vidéo
} from "lucide-react";
import type { Job } from "@/lib/catalog.api";

// --- MAPPING INTELLIGENT DES MÉTIERS ---
const getIconForJob = (name: string) => {
  const n = name.toLowerCase();

  // Bâtiment & Travaux
  if (n.includes("plomb")) return Wrench;
  if (n.includes("électric") || n.includes("electric")) return Zap;
  if (n.includes("peint") || n.includes("décor")) return Paintbrush;
  if (n.includes("menuis") || n.includes("bois") || n.includes("charpent")) return Hammer;
  if (n.includes("maçon") || n.includes("construct") || n.includes("btp")) return BrickWall;
  if (n.includes("solaire") || n.includes("panneau") || n.includes("énergie")) return Sun;
  if (n.includes("froid") || n.includes("clim")) return Thermometer;
  if (n.includes("jardin") || n.includes("paysag")) return Shovel;

  // Auto & Transport
  if (n.includes("mécan") || n.includes("auto") || n.includes("garage")) return Car;
  if (n.includes("transport") || n.includes("livrai") || n.includes("chauffeur")) return Truck;

  // Services
  if (n.includes("ménage") || n.includes("nettoy") || n.includes("propreté")) return Sparkles;
  if (n.includes("sécurité") || n.includes("gardien") || n.includes("surveill")) return Shield;
  if (n.includes("enfant") || n.includes("nounou") || n.includes("bébé")) return Baby;
  if (n.includes("cour") || n.includes("enseign") || n.includes("prof")) return GraduationCap;
  if (n.includes("photo") || n.includes("vidéo") || n.includes("event")) return Camera;

  // Style & Vie
  if (n.includes("couture") || n.includes("tailleur") || n.includes("coiff") || n.includes("esthét")) return Scissors;
  if (n.includes("trait") || n.includes("cuisin") || n.includes("restau") || n.includes("gâteau")) return ChefHat;

  // Tech
  if (n.includes("téléph") || n.includes("gsm") || n.includes("mobile")) return Smartphone;
  if (n.includes("informatique") || n.includes("web") || n.includes("dev") || n.includes("réseau")) return Monitor;

  // Par défaut
  return Briefcase;
};

interface CategoriesSectionProps {
  promise: Promise<Job[]>;
}

export async function CategoriesSection({ promise }: CategoriesSectionProps) {
  const jobs = await promise;
  const displayJobs = jobs.slice(0, 12);

  return (
    <section className="relative py-20 overflow-hidden" aria-labelledby="categories-title">

      {/* Background Decor */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* --- EN-TÊTE --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4 max-w-2xl">
            <h2
              id="categories-title"
              className="text-3xl md:text-4xl font-black tracking-tight text-white"
            >
              Quel expert <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF00] to-emerald-400">
                recherchez-vous ?
              </span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Explorez les catégories les plus demandées au Sénégal.
            </p>
          </div>

          <Link
            href="/recherche"
            className="group flex items-center gap-2 text-sm font-bold text-white transition-colors hover:text-[#00FF00]"
          >
            Voir tout le catalogue
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* --- GRILLE --- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayJobs.map((j) => {
            const Icon = getIconForJob(j.name);

            return (
              <Link
                key={j.id}
                href={`/recherche?metier=${j.id}`}
                className="group relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#00FF00]/20 hover:bg-zinc-900/80 hover:shadow-[0_10px_40px_-10px_rgba(0,255,0,0.1)]"
              >
                {/* Icône avec cercle lumineux */}
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-400 transition-all duration-300 group-hover:bg-[#00FF00] group-hover:text-black group-hover:scale-110 shadow-inner border border-white/5 group-hover:border-transparent">
                  <Icon size={24} strokeWidth={1.5} />
                </div>

                {/* Nom du métier */}
                <span className="text-sm font-semibold text-zinc-300 transition-colors group-hover:text-white truncate w-full">
                  {j.name}
                </span>

                {/* Indicateur visuel discret au hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-gradient-to-r from-transparent via-[#00FF00] to-transparent transition-transform duration-300 group-hover:scale-x-50 opacity-50" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}