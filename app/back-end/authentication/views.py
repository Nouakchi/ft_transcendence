from drf_spectacular.utils import extend_schema_view, extend_schema
from django.conf import settings
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from requests.exceptions import HTTPError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from ft_transcendence.utils import *
from .models import User
from .serializer import (UsersSignUpSerializer,
                         UserSignInSerializer,
                         User2FASerializer,
                         SocialAuthSerializer)
from datetime import datetime, timezone
import urllib.parse
import requests
import pyotp
import sys


@extend_schema_view(
    post=extend_schema(summary="Verify Token", tags=["Authentication"])
)
class VerifyTokenView(APIView):
    serializer_class = None
    def post(self, request, *args, **kwargs):
        try:
            token = request.data.get('token')
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            if User.objects.filter(id=user_id).exists():
                return Response({'detail': 'Token is valid'}, status=status.HTTP_200_OK)
            else:
                return Response({'detail': 'User not found'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

@extend_schema_view(
    post=extend_schema(
        summary="Sign Up",
        request=UsersSignUpSerializer,
        responses={
            200: signup_response_schema,
            400: error_response_schema,
            401: error_response_schema,
        },
        tags=["Authentication"])
)
class SignUpView(APIView):
    serializer_class = UsersSignUpSerializer
    def post(self, request):
        if User.objects.filter(email=request.data['email']).exists():
            return Response({"error": {"Email already exists"}}, status=status.HTTP_409_CONFLICT)
        if User.objects.filter(username=request.data['username']).exists():
            return Response({"error": {"Username already exists"}}, status=status.HTTP_409_CONFLICT)
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = RefreshToken.for_user(user)
        data = serializer.data
        data["refresh"] = str(token)
        data["access"] = str(token.access_token)
        return Response(data, status=status.HTTP_201_CREATED)

@extend_schema_view(
    post=extend_schema(
        summary="Sign In",
        description="Endpoint to sign in a user. Returns user information and authentication tokens.",
        request=UserSignInSerializer,
        responses={
            200: signin_response_schema,
            400: error_response_schema,
            401: error_response_schema,
        },
        tags=["Authentication"])
)
class SignInView(APIView):
    serializer_class = UserSignInSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            response_data = {
                'email': str(data['user']),
                'is_2fa_enabled': str(data['user'].is_2fa_enabled),
            }
            if not data['user'].is_2fa_enabled:
                refresh = RefreshToken.for_user(data['user'])
                response_data['refresh'] = str(refresh)
                response_data['access'] = str(refresh.access_token)
            else :
                response_data['url_code'] = str(data['url_code'])
            return Response(response_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

@extend_schema_view(
    post=extend_schema(summary="Sign In 2FA", tags=["Authentication"])
)
class SignIn2Fa(APIView):
    serializer_class = User2FASerializer
    def post(self, request):
        """
        Post function
        """
        serializer = self.serializer_class(data = request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }, status = status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

@extend_schema_view(
    post=extend_schema(summary="Enable 2Fa", tags=["Settings"])
)
class Control2Fa(APIView):
    # serializer_class = User2FASerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        try:
            user_obj = User.objects.get(id = user.id)
            user_obj.two_fa_secret_key = pyotp.random_base32()
            user_obj.save()
            url_code = pyotp.totp.TOTP(user_obj.two_fa_secret_key).provisioning_uri(
                name = user_obj.email, issuer_name = "ft_transcendence")
            return Response({'url': url_code, 'email': user_obj.email}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': {'User does not exist'}}, status=status.HTTP_400_BAD_REQUEST)


        # serializer = self.serializer_class(data = request.data)
        # if serializer.is_valid():
        #     user = serializer.validated_data
        #     refresh = RefreshToken.for_user(user)
        #     return Response({
        #         'refresh': str(refresh),
        #         'access': str(refresh.access_token)
        #     }, status = status.HTTP_200_OK)
        # return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@extend_schema_view(
    post=extend_schema(summary="Sign Out", tags=["Authentication"])
)
class SignOutView(APIView):
    def post(self, request):
        """Post function for logging out"""
        refresh_token = request.data.get('refresh')

        if refresh_token is None:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'An unexpected error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema_view(
    get=extend_schema(summary="Social Auth Exchange", tags=["Authentication"])
)
class SocialAuthExchangeView(APIView):
    serializer_class = SocialAuthSerializer

    def get(self, request, platform):
        code = request.GET.get('code')
        platform = platform.lower()
        if not code :
            return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)
        if platform == 'github':
            data = {
                'client_id': settings.GITHUB_CLIENT_ID,
                'client_secret': settings.GITHUB_CLIENT_SECRET,
                'code': code,
                'redirect_uri': settings.GITHUB_REDIRECT_URI,
            }
            url = "https://github.com/login/oauth/access_token"
        elif platform == 'google':
            data = {
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'code': code,
                'redirect_uri': settings.GOOGLE_REDIRECT_URI,
                'response_type': 'code',
                'grant_type': 'authorization_code',
            }
            url = "https://oauth2.googleapis.com/token"
        elif platform == '42':
            data = {
                'grant_type': 'authorization_code',
                'client_id': settings.FORTYTWO_CLIENT_ID,
                'client_secret': settings.FORTYTWO_CLIENT_SECRET,
                'code': code,
                'redirect_uri': settings.FORTYTWO_REDIRECT_URI,
            }
            url = "https://api.intra.42.fr/oauth/token"
        headers = {'Accept': 'application/json'}
        try:
            response = requests.post(url, data=data, headers=headers, timeout=20000)
            response.raise_for_status()
        except HTTPError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        access_token = response.json().get('access_token')
        serializer = self.serializer_class(data=request.data, context={"platform": platform,
                                                                       "access_token": access_token})
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.objects.model.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        if user and user.is_active:
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            # response = HttpResponseRedirect(settings.FRONTEND_HOST)
            response = HttpResponseRedirect(settings.FRONTEND_HOST + "/dashboard")
            response.set_cookie('access', access_token)
            response.set_cookie('refresh', refresh)
            return response
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@extend_schema_view(
    get=extend_schema(summary="Social Auth Redirect", tags=["Authentication"])
)
class SocialAuthRedirectView(APIView):
    serializer_class = None

    def get(self, request, platform):
        platform = platform.lower()
        if platform == 'github':
            CLIENT_ID = settings.GITHUB_CLIENT_ID
            REDIRECT_URI = settings.GITHUB_REDIRECT_URI
            url = (
                f'https://github.com/login/oauth/authorize?client_id={CLIENT_ID}'
                f'&redirect_uri={REDIRECT_URI}&scope=user:email'
            )
            return redirect(url)
        elif platform == 'google':
            CLIENT_ID = settings.GOOGLE_CLIENT_ID
            REDIRECT_URI = settings.GOOGLE_REDIRECT_URI
            SCOPE = (
                "https://www.googleapis.com/auth/userinfo.profile"
                " https://www.googleapis.com/auth/userinfo.email"
            )
            url = (
                f'https://accounts.google.com/o/oauth2/v2/auth?client_id={CLIENT_ID}'
                f'&redirect_uri={REDIRECT_URI}&scope={urllib.parse.quote(SCOPE)}&response_type=code'
            )
            return redirect(url)
        elif platform == '42':
            CLIENT_ID = settings.FORTYTWO_CLIENT_ID
            REDIRECT_URI = settings.FORTYTWO_REDIRECT_URI
            SCOPE = "public"
            url = (
                f'https://api.intra.42.fr/oauth/authorize?client_id={CLIENT_ID}'
                f'&redirect_uri={REDIRECT_URI}&scope={SCOPE}&response_type=code'
            )
            return redirect(url)
        return None
