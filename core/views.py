# from django.shortcuts import render
# Create your views here.
from rest_framework import viewsets
from .models import Supplier, Category, Product, Warehouse, Inventory, PurchaseOrder, SaleOrder, StockMovement
from .serializers import (
    SupplierSerializer, CategorySerializer, ProductSerializer, WarehouseSerializer, InventorySerializer, PurchaseOrderSerializer, SaleOrderSerializer, StockMovementSerializer
)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .services import update_inventory

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        po = self.get_object()

        if po.status == 'RECEIVED':
            return Response({"error": "Already received"}, status=400)

        warehouse_id = request.data.get('warehouse')

        for item in po.purchaseorderitem_set.all():
            remaining = item.quantity_ordered - item.quantity_received

            update_inventory(
                product=item.product,
                warehouse_id=warehouse_id,
                qty_change=remaining,
                reference=f"PO-{po.id}"
            )

            item.quantity_received = item.quantity_ordered
            item.save()

        po.status = 'RECEIVED'
        po.save()

        return Response({"message": "Stock added successfully"})
    
    class SaleOrderViewSet(viewsets.ModelViewSet):
        queryset = SaleOrder.objects.all()
    serializer_class = SaleOrderSerializer

    @action(detail=True, methods=['post'])
    def fulfill(self, request, pk=None):
        so = self.get_object()

        if so.status == 'DELIVERED':
            return Response({"error": "Already delivered"}, status=400)

        for item in so.saleorderitem_set.all():

            update_inventory(
                product=item.product,
                warehouse_id=warehouse_id,
                qty_change= -item.quantity,
                reference=f"PO-{so.id}"
            )

        so.status = 'DELIVERED'
        so.save()

        return Response({"message": "Stock deducted successfully"})
    
class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.all().order_by('-moved_at')
    serializer_class = StockMovementSerializer