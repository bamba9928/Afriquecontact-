from django.core.management.base import BaseCommand
from django.utils import timezone
from billing.models import Subscription
from accounts.models import User


class Command(BaseCommand):
    help = "Vérifie les abonnements expirés et désactive la visibilité des pros"

    def handle(self, *args, **options):
        now = timezone.now()

        # 1. Identifier les abonnements actifs qui viennent d'expirer
        expired_subs = Subscription.objects.filter(
            status=Subscription.Status.ACTIVE,
            end_at__lt=now
        )

        count = 0
        for sub in expired_subs:
            # Mettre à jour le statut de l'abonnement
            sub.status = Subscription.Status.EXPIRED
            sub.save(update_fields=["status"])

            # Désactiver la visibilité du profil pro
            if hasattr(sub.user, 'pro_profile'):
                pro = sub.user.pro_profile
                pro.est_publie = False
                pro.save(update_fields=["est_publie"])

                # Ici, on pourrait déclencher l'envoi du message WhatsApp via l'API
                msg = (
                    "Bonjour cher partenaire,\n"
                    "Pour être contacté par des potentiels clients sur notre plateforme, "
                    "nous vous invitons à mettre à jour votre paiement (1000 F seulement). "
                    "[Lien paiement]"
                )
                self.stdout.write(f"Relance à envoyer à {sub.user.phone} : {msg}")

            count += 1

        self.stdout.write(self.style.SUCCESS(f"{count} abonnements expirés traités."))