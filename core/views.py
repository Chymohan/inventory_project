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


from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    @action(detail=True, methods=['post'], url_path='set-password')
    def set_password(self, request, pk=None):
        user = self.get_object()
        pwd = request.data.get('password', '')
        if not pwd:
            return Response({'detail': 'Password required'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(pwd)
        user.save()
        return Response({'message': 'Password updated'})