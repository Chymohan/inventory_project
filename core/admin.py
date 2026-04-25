from django.contrib import admin
from .models import Supplier, Product, Category, Product, Warehouse, Inventory

admin.site.register(Supplier)
admin.site.register(Product)
admin.site.register(Category)
admin.site.register(Warehouse)
admin.site.register(Inventory)

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = ("username", "email", "role", "is_staff", "is_active")

    fieldsets = UserAdmin.fieldsets + (
        ("Role Info", {"fields": ("role",)}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Role Info", {"fields": ("role",)}),
    )