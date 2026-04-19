from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = router.urls