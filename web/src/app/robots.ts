import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {

  const baseUrl = "https://sencontact.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Pages privées utilisateur (ne pas indexer)
        "/dashboard/",
        "/pro/profil/",
        "/pro/verify/",

        // Pages d'édition et création (contenu dupliqué ou vide)
        "/annonces/modifier/",
        "/pro/annonces/nouveau/",

        // Routes API Next.js (si elles sont exposées)
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}