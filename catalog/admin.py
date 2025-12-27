from django.contrib import admin
from .models import Location, JobCategory, Job


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'parent', 'slug')
    list_filter = ('type',)

    # CRUCIAL : Ceci permet à l'autocomplétion de fonctionner dans l'admin des "Pros"
    search_fields = ('name',)

    # Génère automatiquement le slug quand on tape le nom
    prepopulated_fields = {'slug': ('name',)}

    # Permet de chercher le parent (ex: chercher "Dakar" pour le définir comme parent de "Plateau")
    # au lieu de charger une liste déroulante géante.
    autocomplete_fields = ['parent']

    ordering = ('type', 'name')


@admin.register(JobCategory)
class JobCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'slug')

    search_fields = ('name',)

    prepopulated_fields = {'slug': ('name',)}
    autocomplete_fields = ['parent']


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_featured', 'slug')
    list_filter = ('is_featured', 'category')

    # CRUCIAL : Ceci permet à l'autocomplétion de fonctionner pour le champ "Métier" dans les Pros
    search_fields = ('name', 'category__name')

    prepopulated_fields = {'slug': ('name',)}
    autocomplete_fields = ['category']