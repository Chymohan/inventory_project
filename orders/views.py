from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import PurchaseOrder, SaleOrder
from .serializers import PurchaseOrderSerializer, SaleOrderSerializer
from inventory_app.services import update_inventory


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        po = self.get_object()
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

        return Response({"message": "Stock added"})


class SaleOrderViewSet(viewsets.ModelViewSet):
    queryset = SaleOrder.objects.all()
    serializer_class = SaleOrderSerializer

    @action(detail=True, methods=['post'])
    def fulfill(self, request, pk=None):
        so = self.get_object()
        warehouse_id = request.data.get('warehouse')

        for item in so.saleorderitem_set.all():
            update_inventory(
                product=item.product,
                warehouse_id=warehouse_id,
                qty_change=-item.quantity,
                reference=f"SO-{so.id}"
            )

        so.status = 'DELIVERED'
        so.save()

        return Response({"message": "Stock deducted"})