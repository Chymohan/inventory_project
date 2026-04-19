from rest_framework.routers import DefaultRouter, path
from .views import *

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'warehouses', WarehouseViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'stock-movements', StockMovementViewSet)

urlpatterns = router.urls

urlpatterns += [
    path('reports/stock/', stock_per_warehouse),
]

urlpatterns += [
    path('reports/movements/', movement_history),
]

urlpatterns += [
    path('reports/low-stock/', low_stock),
]

urlpatterns += [
    path('reports/value/', inventory_value),
]