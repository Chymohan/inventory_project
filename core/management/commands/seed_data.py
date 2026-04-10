from django.core.management.base import BaseCommand
from core.models import Supplier, Category, Product, Warehouse

class Command(BaseCommand):
    help = 'Seed initial data'

    def handle(self, *args, **kwargs):
        # Suppliers
        supplier = Supplier.objects.create(name="ABC Supplier")

        # Categories
        category = Category.objects.create(name="Electronics")

        # Warehouse
        warehouse = Warehouse.objects.create(
            name="Main Warehouse",
            address="Kathmandu",
            manager_name="Ram"
        )

        # Products
        Product.objects.create(
            sku="P001",
            name="Laptop",
            category=category,
            supplier=supplier,
            unit_price=50000,
            cost_price=40000,
            unit_of_measure="pcs"
        )

        self.stdout.write(self.style.SUCCESS('Seed data added successfully'))