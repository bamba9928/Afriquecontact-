class MessageTemplates:
    # Espace Pro
    PRO_HORS_SERVICE = (
        "Bonjour ! Votre compte est actuellement inactif. "
        "Pour débloquer de nouvelles opportunités et être visible sur le marché, "
        "procédez à votre mise à jour de 1 000 F."
    )

    PRO_EN_LIGNE = (
        "Bonjour ! Vous êtes visible et pouvez recevoir des missions. "
        "Activez votre géolocalisation pour découvrir les opportunités près de chez vous !"
    )

    # Relance Paiement (Admin)
    RELANCE_PAIEMENT = (
        "Bonjour cher partenaire,\n"
        "Pour être contacté par des potentiels clients sur notre plateforme, "
        "nous vous invitons à mettre à jour votre paiement (1000 F seulement).\n"
        "Même sans emploi actuel, vous pouvez déposer gratuitement une annonce "
        "dans la rubrique 'Demander un emploi'. Merci."
    )

    # Partage Profil
    @staticmethod
    def partage_profil(nom_pro, metier):
        return (
            f"Vous êtes à la recherche d’un {metier} ? "
            f"Découvrez {nom_pro} sur ContactAfrique ! "
            "Contactez-nous vite."
        )

    # Contact via WhatsApp
    @staticmethod
    def contact_pro(titre_annonce="votre annonce"):
        return f"Bonjour, je vous contacte par rapport à {titre_annonce} sur SENEGAL CONTACT."