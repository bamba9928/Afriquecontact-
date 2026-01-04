import { MetadataRoute } from "next";
import { getAllJobs } from "@/lib/catalog.api";

// L'URL de base de votre site
const BASE_URL = "https://sencontact.com";
// L'URL de l'API Backend (doit être accessible par le serveur Next.js)
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // 1. Pages Statiques
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/recherche",
    "/pro/register",
    "/pro/login",
    "/pub",
    "/annonces",
    "/about",
    "/privacy",
    "/terms",
    "/contacts",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  // 2. Données Dynamiques : Jobs (Métiers)
  // On utilise votre API existante (catalog.api.ts)
  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    const jobs = await getAllJobs();
    jobRoutes = jobs.map((job) => ({
      // Lien vers la page recherche filtrée par métier
      url: `${BASE_URL}/recherche?metier=${job.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Sitemap: Erreur lors du fetch des jobs", error);
  }

  // 3. Données Dynamiques : Pros
  // Note: On utilise fetch directement car pros.api.ts est "use client"
  let proRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/api/pros/recherche/?page_size=1000`, {
      next: { revalidate: 3600 } // Revalider toutes les heures
    });
    const data = await res.json();
    // Gestion si pagination (results) ou liste directe
    const pros = Array.isArray(data) ? data : (data.results || []);

    proRoutes = pros.map((pro: any) => ({
      url: `${BASE_URL}/pros/${pro.id}`,
      lastModified: new Date(pro.updated_at || new Date()),
      changeFrequency: "daily",
      priority: 0.9,
    }));
  } catch (error) {
    console.error("Sitemap: Erreur lors du fetch des pros", error);
  }

  // 4. Données Dynamiques : Annonces
  let annonceRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/api/annonces/?page_size=1000`, {
      next: { revalidate: 3600 }
    });
    const data = await res.json();
    const annonces = Array.isArray(data) ? data : (data.results || []);

    annonceRoutes = annonces.map((annonce: any) => ({
      url: `${BASE_URL}/annonces/${annonce.id}`,
      lastModified: new Date(annonce.created_at || new Date()),
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Sitemap: Erreur lors du fetch des annonces", error);
  }

  // Fusion de toutes les routes
  return [
    ...staticRoutes,
    ...jobRoutes,
    ...proRoutes,
    ...annonceRoutes,
  ];
}