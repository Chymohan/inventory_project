from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, CategoryViewSet
from django.urls import path
from .views_auth import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = router.urls

urlpatterns  += [
    path('auth/login/', CustomTokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
]