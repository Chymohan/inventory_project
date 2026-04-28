from rest_framework import serializers
from core.models import PurchaseOrder, PurchaseOrderItem, SaleOrder, SaleOrderItem


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'product', 'quantity_ordered', 'quantity_received', 'unit_cost']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, required=False, source='purchaseorderitem_set')

    class Meta:
        model = PurchaseOrder
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('purchaseorderitem_set', [])
        po = PurchaseOrder.objects.create(**validated_data)
        for item in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, **item)
        return po

    def update(self, instance, validated_data):
        validated_data.pop('purchaseorderitem_set', None)
        return super().update(instance, validated_data)


class SaleOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleOrderItem
        fields = ['id', 'product', 'quantity', 'unit_price']


class SaleOrderSerializer(serializers.ModelSerializer):
    items = SaleOrderItemSerializer(many=True, required=False, source='saleorderitem_set')

    class Meta:
        model = SaleOrder
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('saleorderitem_set', [])
        so = SaleOrder.objects.create(**validated_data)
        for item in items_data:
            SaleOrderItem.objects.create(sale_order=so, **item)
        return so

    def update(self, instance, validated_data):
        validated_data.pop('saleorderitem_set', None)
        return super().update(instance, validated_data)
