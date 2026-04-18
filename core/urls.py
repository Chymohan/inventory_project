from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'warehouses', WarehouseViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'stock-movements', StockMovementViewSet)

urlpatterns = router.urls