from rest_framework.decorators import api_view
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
        }
        for i in data
    ])


@api_view(['GET'])
def movement_history(request):
    qs = StockMovement.objects.all()

    return Response([
        {
            "product": m.product.name,
            "qty": m.quantity,
            "type": m.movement_type,
        }
        for m in qs
    ])


@api_view(['GET'])
def low_stock(request):
    data = []

    for p in Product.objects.all():
        total = sum(inv.quantity_on_hand for inv in p.inventory_set.all())

        if total <= p.reorder_level:
            data.append({"product": p.name, "stock": total})

    return Response(data)


@api_view(['GET'])
def inventory_value(request):
    total = 0

    for p in Product.objects.all():
        stock = sum(inv.quantity_on_hand for inv in p.inventory_set.all())
        total += stock * float(p.cost_price)

    return Response({"total_value": total})