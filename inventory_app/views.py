from rest_framework import viewsets
from core.models import Warehouse, Inventory, StockMovement
from .serializers import WarehouseSerializer, InventorySerializer, StockMovementSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.all().order_by('-moved_at')
    serializer_class = StockMovementSerializer