import json
from django.contrib import admin
from django.utils.html import format_html, mark_safe
from django.utils.translation import gettext_lazy as _
from .models import Payment, Subscription


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'provider_ref',
        'user',
        'montant_affiche',
        'status_badge',
        'created_at',
        'paid_at'
    )
    list_filter = ('status', 'provider', 'created_at')

    # Recherche par téléphone user ou par référence de transaction
    search_fields = ('user__phone', 'user__email', 'provider_ref')

    # Utilise l'autocomplétion pour le User (nécessite search_fields dans UserAdmin)
    autocomplete_fields = ['user']

    readonly_fields = ('created_at', 'paid_at', 'payload_pretty')

    # On exclue le champ payload brut pour afficher la version jolie
    exclude = ('payload',)

    fieldsets = (
        ("Détails Transaction", {
            "fields": ("provider_ref", "user", "provider", "status")
        }),
        ("Finances", {
            "fields": (("amount", "currency"), "paid_at")
        }),
        ("Technique (Debug)", {
            "fields": ("created_at", "payload_pretty"),
            "classes": ("collapse",),
        }),
    )

    actions = ['valider_paiement_manuellement']

    def montant_affiche(self, obj):
        return f"{obj.amount} {obj.currency}"

    montant_affiche.short_description = "Montant"

    def status_badge(self, obj):
        """Affiche le statut avec une couleur."""
        colors = {
            Payment.Status.PAID: 'green',
            Payment.Status.PENDING: 'orange',
            Payment.Status.FAILED: 'red',
            Payment.Status.CANCELED: 'gray',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )

    status_badge.short_description = "État"

    def payload_pretty(self, obj):
        """Affiche le JSON de manière lisible."""
        if not obj.payload:
            return "-"
        # Convertit le dict en JSON string indenté
        response = json.dumps(obj.payload, indent=2, sort_keys=True)
        # Affiche dans une balise <pre> pour garder le formatage
        return mark_safe(f'<pre style="font-size: 12px; background: #f5f5f5; padding: 10px;">{response}</pre>')

    payload_pretty.short_description = "Données brutes (Webhook)"

    @admin.action(description="Valider manuellement le paiement (Déclenche l'abonnement)")
    def valider_paiement_manuellement(self, request, queryset):
        """
        Action utile si le webhook n'est jamais arrivé.
        Force le statut à PAID et lance la logique d'abonnement.
        """
        count = 0
        for payment in queryset:
            if payment.status != Payment.Status.PAID:
                payment.mark_as_paid()
                count += 1

        if count > 0:
            self.message_user(request, f"{count} paiement(s) validé(s) et abonnement(s) activé(s).", level='SUCCESS')
        else:
            self.message_user(request, "Aucun paiement n'a nécessité de validation.", level='INFO')


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'status_badge',
        'start_at',
        'end_at',
        'is_active_display'
    )
    list_filter = ('status', 'end_at')
    search_fields = ('user__phone', 'user__email')
    autocomplete_fields = ['user', 'last_payment']

    readonly_fields = ('created_at', 'updated_at')

    def status_badge(self, obj):
        colors = {
            Subscription.Status.ACTIVE: 'green',
            Subscription.Status.EXPIRED: 'red',
            Subscription.Status.CANCELED: 'gray',
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )

    status_badge.short_description = "Statut"

    def is_active_display(self, obj):
        return obj.is_active()

    is_active_display.boolean = True
    is_active_display.short_description = "Actif ?"