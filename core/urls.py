from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, CategoryViewSet, UserViewSet
from django.urls import path
from .views_auth import CustomTokenObtainPairView, forgot_password, reset_password
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'users', UserViewSet)

urlpatterns = router.urls

urlpatterns  += [
    path('auth/login/', CustomTokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/forgot-password/', forgot_password),
    path('auth/reset-password/', reset_password),
]