from rest_framework.routers import DefaultRouter
from .views import PurchaseOrderViewSet, SaleOrderViewSet

router = DefaultRouter()
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'sale-orders', SaleOrderViewSet)

urlpatterns = router.urls