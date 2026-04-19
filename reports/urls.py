from django.urls import path
from .views import stock_per_warehouse, movement_history, low_stock, inventory_value

urlpatterns = [
    path('stock/', stock_per_warehouse),
    path('movements/', movement_history),
    path('low-stock/', low_stock),
    path('value/', inventory_value),
]