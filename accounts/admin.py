from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, WhatsAppOTP


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    # Colonnes principales dans la liste (E2/E3)
    list_display = (
        "phone",
        "role",
        "whatsapp_verified",
        "is_active",
        "is_staff",
        "date_joined"
    )

    # Filtres latéraux pour la modération rapide
    list_filter = ("role", "whatsapp_verified", "is_active", "is_staff")

    # Recherche textuelle
    search_fields = ("phone", "email")

    # Organisation du formulaire de modification
    fieldsets = (
        ("Informations d'identification", {"fields": ("phone", "password")}),
        ("Profil & Rôles", {"fields": ("role", "email", "whatsapp_verified")}),
        ("Permissions & Statut", {"fields": ("is_active", "is_staff", "is_superuser")}),
        ("Dates importantes", {"fields": ("last_login", "date_joined")}),
    )

    readonly_fields = ("date_joined", "last_login")

    # Actions personnalisées (Support Client)
    actions = ["valider_whatsapp_manuellement"]

    @admin.action(description="✅ Valider manuellement le WhatsApp")
    def valider_whatsapp_manuellement(self, request, queryset):
        updated = queryset.update(whatsapp_verified=True)
        self.message_user(request, f"{updated} comptes ont été marqués comme vérifiés.")


@admin.register(WhatsAppOTP)
class WhatsAppOTPAdmin(admin.ModelAdmin):
    """Permet de surveiller les codes envoyés et les tentatives de blocage."""
    list_display = ("phone", "code", "attempts", "is_expired", "is_locked", "created_at")
    list_filter = ("created_at",)
    search_fields = ("phone",)
    readonly_fields = ("created_at", "expires_at", "locked_until")

    def is_expired(self, obj):
        return obj.is_expired()

    is_expired.boolean = True
    is_expired.short_description = "Expiré ?"

    def is_locked(self, obj):
        return obj.is_locked()

    is_locked.boolean = True
    is_locked.short_description = "Bloqué ?"