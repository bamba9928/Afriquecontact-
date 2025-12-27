from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import User, WhatsAppOTP


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Administration personnalisée pour le modèle User basé sur le téléphone.
    """
    # Configuration de l'affichage en liste
    list_display = ('phone', 'role_badge', 'whatsapp_verified', 'is_active', 'date_joined')
    list_display_links = ('phone',)
    list_filter = ('role', 'whatsapp_verified', 'is_active', 'is_staff')
    search_fields = ('phone', 'email')
    ordering = ('phone',)

    # Configuration du formulaire d'édition
    fieldsets = (
        (None, {'fields': ('phone', 'password')}),
        (_('Informations personnelles'), {'fields': ('email', 'role', 'whatsapp_verified')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Dates importantes'), {'fields': ('last_login', 'date_joined')}),
    )

    # Configuration du formulaire d'ajout (add_form)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'role'),
        }),
    )

    # Pour s'assurer que l'admin utilise bien 'phone' comme identifiant
    ordering = ['phone']

    def role_badge(self, obj):
        """
        Affiche le rôle avec un code couleur pour une distinction rapide.
        """
        colors = {
            User.Role.ADMIN: 'red',
            User.Role.PRO: 'blue',
            User.Role.CLIENT: 'green',
        }
        color = colors.get(obj.role, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_role_display()
        )

    role_badge.short_description = "Rôle"


@admin.register(WhatsAppOTP)
class WhatsAppOTPAdmin(admin.ModelAdmin):
    """
    Interface pour visualiser les codes OTP (utile pour le débogage et le support).
    """
    list_display = ('phone', 'code', 'attempts', 'is_expired_display', 'is_locked_display', 'created_at')
    list_filter = ('created_at', 'expires_at')
    search_fields = ('phone',)

    # On met la plupart des champs en lecture seule pour éviter la triche manuelle par un admin
    readonly_fields = ('phone', 'code', 'created_at', 'expires_at', 'locked_until')

    def is_expired_display(self, obj):
        return obj.is_expired()

    is_expired_display.boolean = True
    is_expired_display.short_description = "Expiré ?"

    def is_locked_display(self, obj):
        return obj.is_locked()

    is_locked_display.boolean = True
    is_locked_display.short_description = "Verrouillé ?"

    # Désactiver l'ajout manuel d'OTP depuis l'admin pour forcer l'usage de l'API/App
    def has_add_permission(self, request):
        return False