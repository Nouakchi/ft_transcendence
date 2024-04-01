from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from .serializer import *
from .models import User
from social_django.utils import load_strategy, load_backend
from social_core.exceptions import MissingBackend
from django.conf import settings
from django.shortcuts import redirect
from requests.exceptions import HTTPError
import requests
import os
import urllib.parse
from django.http import HttpResponseRedirect


class SignUpView(APIView):
    serializer_class = UsersSignUpSerializer
    def post(self, request):
        if User.objects.filter(email=request.data['email']).exists():
            return Response({"error": "Email already exists"}, status=status.HTTP_409_CONFLICT)
        if User.objects.filter(username=request.data['username']).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_409_CONFLICT)
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = RefreshToken.for_user(user)
        data = serializer.data
        data["tokens"] = {"refresh": str(token), "access": str(token.access_token)}
        return Response(data, status=status.HTTP_201_CREATED)

class SignInView(APIView):
    serializer_class = UserSignInSerializer
    def post(self, request, *args, **kwargs):
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

class SignIn2Fa(APIView):
    serializer_class = User2FASerializer
    def post(self, request):
        serializer = self.serializer_class(data = request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }, status = status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


class SignOutView(APIView):
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token is None:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message:', 'Successfully logged out'}, status=status.HTTP_200_OK)


# send the access token to the front-end
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
            response = requests.post(url, data=data, headers=headers)
            response.raise_for_status()
        except HTTPError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        access_token = response.json().get('access_token')
        serializer = self.serializer_class(data=request.data, context={"platform": platform, "access_token": access_token})
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        if user and user.is_active:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            response = HttpResponseRedirect(settings.FRONTEND_HOST)
            response.set_cookie('access_token', access_token, httponly=True, samesite='Lax', secure=True)
            response.set_cookie('refresh_token', refresh, httponly=True, samesite='Lax', secure=True)
            return response
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        
        

class SocialAuthRedirectView(APIView):
    def get(self, request, platform):
        platform = platform.lower()
        if platform == 'github':
            CLIENT_ID = settings.GITHUB_CLIENT_ID
            REDIRECT_URI = settings.GITHUB_REDIRECT_URI
            return redirect(f'https://github.com/login/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=user:email')
        elif platform == 'google':
            CLIENT_ID = settings.GOOGLE_CLIENT_ID
            REDIRECT_URI = settings.GOOGLE_REDIRECT_URI
            SCOPE = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
            return redirect(f'https://accounts.google.com/o/oauth2/v2/auth?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope={urllib.parse.quote(SCOPE)}&response_type=code')
        elif platform == '42':
            CLIENT_ID = settings.FORTYTWO_CLIENT_ID
            REDIRECT_URI = settings.FORTYTWO_REDIRECT_URI
            SCOPE = "public"
            return redirect(f'https://api.intra.42.fr/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope={SCOPE}&response_type=code')