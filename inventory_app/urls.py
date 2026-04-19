from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet, StockMovementViewSet

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet)
router.register(r'stock-movements', StockMovementViewSet)

urlpatterns = router.urls