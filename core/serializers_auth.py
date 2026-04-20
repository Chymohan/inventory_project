from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # 👇 add custom claims
        token['username'] = user.username
        token['role'] = user.role

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # 👇 also return role in response body
        data['role'] = self.user.role
        data['username'] = self.user.username

        return data