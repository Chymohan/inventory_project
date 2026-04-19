from rest_framework import serializers
from core.models import PurchaseOrder, SaleOrder


class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = '__all__'


class SaleOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleOrder
        fields = '__all__'