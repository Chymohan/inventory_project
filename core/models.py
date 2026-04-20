from email.mime import image

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    groups = models.ManyToManyField(
        "auth.Group",
        related_name="core_user_set",  # <-- rename reverse relation
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="core_user_permissions_set",  # <-- rename reverse relation
        blank=True,
    )

    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Category(models.Model):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(null=True, blank=True)

class Product(models.Model):
    sku = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    reorder_level = models.IntegerField(default=0)
    reorder_qty = models.IntegerField(default=0)
    unit_of_measure = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Warehouse(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    manager_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    quantity_on_hand = models.IntegerField(default=0)
    quantity_reserved = models.IntegerField(default=0)
    quantity_available = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'warehouse')

# Purchase Order
class PurchaseOrder(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent'),
        ('RECEIVED', 'Received'),
    )

    po_number = models.CharField(max_length=100, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    order_date = models.DateField()
    expected_date = models.DateField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity_ordered = models.IntegerField()
    quantity_received = models.IntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)

# Sale Order
class SaleOrder(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
    )

    order_number = models.CharField(max_length=100, unique=True)
    customer_name = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    order_date = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)


class SaleOrderItem(models.Model):
    sale_order = models.ForeignKey(SaleOrder, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

class StockMovement(models.Model):
    MOVEMENT_TYPES = (
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    movement_type = models.CharField(max_length=10, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    reference = models.CharField(max_length=100, null=True, blank=True)
    moved_at = models.DateTimeField(auto_now_add=True)