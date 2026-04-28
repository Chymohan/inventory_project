from rest_framework import viewsets, status
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

        if not warehouse_id:
            return Response({"error": "warehouse is required"}, status=status.HTTP_400_BAD_REQUEST)

        if po.status == 'RECEIVED':
            return Response({"error": "This PO has already been received"}, status=status.HTTP_400_BAD_REQUEST)

        items = po.purchaseorderitem_set.all()
        if not items.exists():
            return Response({"error": "This PO has no items to receive"}, status=status.HTTP_400_BAD_REQUEST)

        received_count = 0
        for item in items:
            remaining = item.quantity_ordered - item.quantity_received
            if remaining <= 0:
                continue  # already received — skip, no zero-qty movement
            try:
                update_inventory(
                    product=item.product,
                    warehouse_id=warehouse_id,
                    qty_change=remaining,
                    reference=f"PO-{po.po_number}"
                )
                item.quantity_received = item.quantity_ordered
                item.save()
                received_count += 1
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        po.status = 'RECEIVED'
        po.save()

        return Response({"message": f"Stock received — {received_count} item(s) added to inventory"})


class SaleOrderViewSet(viewsets.ModelViewSet):
    queryset = SaleOrder.objects.all()
    serializer_class = SaleOrderSerializer

    @action(detail=True, methods=['post'])
    def fulfill(self, request, pk=None):
        so = self.get_object()
        warehouse_id = request.data.get('warehouse')

        if not warehouse_id:
            return Response({"error": "warehouse is required"}, status=status.HTTP_400_BAD_REQUEST)

        if so.status == 'DELIVERED':
            return Response({"error": "This order has already been fulfilled"}, status=status.HTTP_400_BAD_REQUEST)

        items = so.saleorderitem_set.all()
        if not items.exists():
            return Response({"error": "This order has no items to fulfill"}, status=status.HTTP_400_BAD_REQUEST)

        for item in items:
            try:
                update_inventory(
                    product=item.product,
                    warehouse_id=warehouse_id,
                    qty_change=-item.quantity,
                    reference=f"SO-{so.order_number}"
                )
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        so.status = 'DELIVERED'
        so.save()

        return Response({"message": "Stock deducted — order fulfilled"})
