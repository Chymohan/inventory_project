from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers_auth import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import User, PasswordResetToken

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    username = request.data.get('username', '').strip()
    if not username:
        return Response({'detail': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        # Return success anyway to avoid user enumeration
        return Response({'detail': 'If that username exists, a reset token has been generated.'})

    # Invalidate old tokens
    PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
    token = PasswordResetToken.objects.create(user=user)

    return Response({
        'detail': 'Reset token generated.',
        'token': str(token.token),       # In production, email this instead
        'username': user.username,
        'expires_in': '60 minutes',
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    token_str = request.data.get('token', '').strip()
    new_password = request.data.get('password', '')

    if not token_str or not new_password:
        return Response({'detail': 'Token and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 6:
        return Response({'detail': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        import uuid
        reset_obj = PasswordResetToken.objects.get(token=uuid.UUID(token_str))
    except (PasswordResetToken.DoesNotExist, ValueError):
        return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

    if not reset_obj.is_valid():
        return Response({'detail': 'Token has expired or already been used.'}, status=status.HTTP_400_BAD_REQUEST)

    reset_obj.user.set_password(new_password)
    reset_obj.user.save()
    reset_obj.used = True
    reset_obj.save()

    return Response({'detail': 'Password reset successfully. You can now log in.'})
