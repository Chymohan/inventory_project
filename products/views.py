from rest_framework import viewsets
from core.models import Product
from core.permissions import IsManager
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsManager]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context