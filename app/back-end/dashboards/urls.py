from django.urls import path
from .views import (MainDashboardView,
                    ProfileView,
                    ProfileIdView,
                    FriendsView,
                    UserSearchView
                   )

urlpatterns = [
   path('dashboard', MainDashboardView.as_view(), name='dashboard'),
   path('profile', ProfileView.as_view(), name='profile'),
   path('profile/<str:username>', ProfileIdView.as_view(), name='profile_with_id'),
   path('friends', FriendsView.as_view(), name='friends'),
   path('user-search', UserSearchView.as_view(), name='user-search'),
   # path('friends-remove', RemoveFriendshipView.as_view(), name="friends-remove")
]
