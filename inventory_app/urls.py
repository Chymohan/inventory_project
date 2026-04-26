from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet, StockMovementViewSet, WarehouseViewSet

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet)
router.register(r'stock-movements', StockMovementViewSet)
router.register(r'warehouses', WarehouseViewSet)

urlpatterns = router.urls