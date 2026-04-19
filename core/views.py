# from django.shortcuts import render
# Create your views here.
from rest_framework import viewsets
from .models import Supplier, Category, Product, Warehouse, Inventory, PurchaseOrder, SaleOrder, StockMovement, Inventory
from .serializers import (
    SupplierSerializer, CategorySerializer, ProductSerializer, WarehouseSerializer, InventorySerializer, PurchaseOrderSerializer, SaleOrderSerializer, StockMovementSerializer
)
from rest_framework.decorators import action, api_view
from rest_framework.response import Response, Response
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

@api_view(['GET'])
def stock_per_warehouse(request):
    data = Inventory.objects.select_related('product', 'warehouse')

    result = []
    for item in data:
        result.append({
            "product": item.product.name,
            "warehouse": item.warehouse.name,
            "on_hand": item.quantity_on_hand,
            "available": item.quantity_available,
        })

    return Response(result)

@api_view(['GET'])
def movement_history(request):
    start = request.GET.get('start')
    end = request.GET.get('end')

    qs = StockMovement.objects.all()

    if start and end:
        qs = qs.filter(moved_at__range=[start, end])

    data = []
    for m in qs:
        data.append({
            "product": m.product.name,
            "type": m.movement_type,
            "qty": m.quantity,
            "date": m.moved_at,
            "ref": m.reference
        })

    return Response(data)

@api_view(['GET'])
def low_stock(request):
    products = Product.objects.all()

    data = []
    for p in products:
        total_stock = sum(inv.quantity_on_hand for inv in p.inventory_set.all())

        if total_stock <= p.reorder_level:
            data.append({
                "product": p.name,
                "stock": total_stock,
                "reorder_level": p.reorder_level
            })

    return Response(data)

@api_view(['GET'])
def inventory_value(request):
    products = Product.objects.all()

    total_value = 0

    for p in products:
        total_stock = sum(inv.quantity_on_hand for inv in p.inventory_set.all())
        total_value += total_stock * float(p.cost_price)

    return Response({
        "total_inventory_value": total_value
    })