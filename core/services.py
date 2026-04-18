from .models import Inventory, Warehouse, StockMovement

def update_inventory(product, warehouse_id, qty_change, reference=""):
    warehouse = Warehouse.objects.get(id=warehouse_id)

    inventory, created = Inventory.objects.get_or_create(
        product=product,
        warehouse=warehouse,
        defaults={'quantity_on_hand': 0}
    )

    new_qty = inventory.quantity_on_hand + qty_change

    if new_qty < 0:
        raise ValueError("Not enough stock!")

    inventory.quantity_on_hand = new_qty
    inventory.quantity_available = new_qty - inventory.quantity_reserved
    inventory.save()

    movement_type = 'IN' if qty_change > 0 else 'OUT'

    StockMovement.objects.create(
        product=product,
        warehouse=warehouse,
        movement_type=movement_type,
        quantity=abs(qty_change),
        reference=reference
    )

    return inventory

