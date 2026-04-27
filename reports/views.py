from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from core.models import Product, Inventory, StockMovement


@api_view(['GET'])
def stock_per_warehouse(request):
    data = Inventory.objects.select_related('product', 'warehouse')
    return Response([
        {
            "product": i.product.name,
            "warehouse": i.warehouse.name,
            "on_hand": i.quantity_on_hand,
            "reserved": i.quantity_reserved,
            "available": i.quantity_available,
        }
        for i in data
    ])


@api_view(['GET'])
def movement_history(request):
    qs = StockMovement.objects.select_related('product', 'warehouse').order_by('-moved_at')
    return Response([
        {
            "product": m.product.name,
            "warehouse": m.warehouse.name,
            "qty": m.quantity,
            "type": m.movement_type,
            "reference": m.reference or "—",
            "moved_at": m.moved_at,
        }
        for m in qs
    ])


@api_view(['GET'])
def low_stock(request):
    data = []
    for p in Product.objects.all():
        total = sum(inv.quantity_on_hand for inv in p.inventory_set.all())
        if total <= p.reorder_level:
            data.append({
                "product": p.name,
                "sku": p.sku,
                "stock": total,
                "reorder_level": p.reorder_level,
            })
    return Response(data)


@api_view(['GET'])
def inventory_value(request):
    total = 0
    for p in Product.objects.all():
        stock = sum(inv.quantity_on_hand for inv in p.inventory_set.all())
        total += stock * float(p.cost_price)
    return Response({"total_value": round(total, 2)})
