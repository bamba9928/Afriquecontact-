from django.contrib import admin
from .models import Publicite

@admin.register(Publicite)
class PubliciteAdmin(admin.ModelAdmin):
    list_display = ("titre", "duree_jours", "date_debut", "date_fin", "est_active")
    list_filter = ("est_active", "duree_jours")
    search_fields = ("titre", "telephone_appel")