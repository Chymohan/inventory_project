from rest_framework import viewsets
from .models import Supplier, Category
from .serializers import SupplierSerializer, CategorySerializer
from core.permissions import IsAdmin


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAdmin]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer