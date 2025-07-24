
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from django.contrib import admin

admin.site.site_header = "Scan2Heal Admin"
admin.site.site_title = "Scan2Heal Admin Portal"
admin.site.index_title = "Welcome to Scan2Heal Dashboard"


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'username', 'role', 'speciality']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role', 'speciality', 'age', 'gender', 'phone')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'speciality', 'age', 'gender', 'phone')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
