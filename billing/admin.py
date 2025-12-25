from django.contrib import admin
from .models import Payment, Subscription


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    # Affiche l'ID de transaction, l'utilisateur, le montant et le statut (Payé/Échoué)
    list_display = ("provider_ref", "user", "amount", "currency", "status", "created_at", "paid_at")

    # Filtres latéraux pour trier rapidement
    list_filter = ("status", "provider", "created_at")

    # Recherche par ID de transaction ou par numéro de téléphone du client
    search_fields = ("provider_ref", "user__phone", "user__first_name", "user__last_name")

    # Empêche la modification accidentelle des dates automatiques
    readonly_fields = ("created_at", "paid_at", "payload")

    # Action personnalisée pour valider un paiement manuellement
    actions = ["mark_as_paid_action"]

    @admin.action(description="✅ Valider le paiement manuellement (Active l'abo)")
    def mark_as_paid_action(self, request, queryset):
        count = 0
        for payment in queryset:
            if payment.status != Payment.Status.PAID:
                payment.mark_as_paid()  # Déclenche aussi l'activation de l'abonnement
                count += 1
        self.message_user(request, f"{count} paiement(s) validé(s) et abonnement(s) activé(s).")


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "start_at", "end_at", "is_active_display")
    list_filter = ("status", "end_at")
    search_fields = ("user__phone", "user__first_name")
    readonly_fields = ("created_at", "updated_at")

    # Affiche une icône (✅/❌) dans la liste au lieu de True/False
    def is_active_display(self, obj):
        return obj.is_active()

    is_active_display.boolean = True
    is_active_display.short_description = "Est actif ?"