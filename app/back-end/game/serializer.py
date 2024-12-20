import sys
from datetime import datetime

from django.db import transaction
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from authentication.models import User
from dashboards.serializer import MatchSerializer
from .models import (
    Tournaments,
    Tournamentsmatches,
    Match,
    GameTable,
    UserAchievements,
)
from rest_framework import serializers


class TournamentsmatchesSerializer(serializers.ModelSerializer):
    match = MatchSerializer()

    class Meta:
        model = Tournamentsmatches
        fields = "__all__"


class TournamentsSerializer(serializers.ModelSerializer):
    participantsJoined = serializers.SerializerMethodField()

    class Meta:
        model = Tournaments
        fields = "__all__"

    def get_participantsJoined(self, obj) -> int:
        matches = Match.objects.filter(
            match_id__in=Tournamentsmatches.objects.filter(tournament=obj).values_list(
                "match", flat=True
            )
        )
        participants = set(matches.values_list("user_one", "user_two").distinct())
        return len(participants)


class UserTournamentsSerializer(serializers.ModelSerializer):
    all_tournaments = serializers.SerializerMethodField()
    ongoing_tournaments = serializers.SerializerMethodField()
    completed_tournaments = serializers.SerializerMethodField()
    my_tournaments = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "first_name",
            "last_name",
            "all_tournaments",
            "ongoing_tournaments",
            "completed_tournaments",
            "my_tournaments",
        )

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_all_tournaments(self, obj) -> list:
        tournaments = Tournaments.objects.all()
        serializer = TournamentsSerializer(tournaments, many=True)
        return serializer.data

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_ongoing_tournaments(self, obj) -> list:
        tournaments = Tournaments.objects.filter(tournament_end__isnull=True)
        serializer = TournamentsSerializer(tournaments, many=True)
        return serializer.data

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_completed_tournaments(self, obj) -> list:
        tournaments = Tournaments.objects.filter(tournament_end__isnull=False)
        serializer = TournamentsSerializer(tournaments, many=True)
        return serializer.data

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_my_tournaments(self, obj) -> list:
        tournaments = Tournaments.objects.filter(crated_by_me=True)
        tournaments_user = Tournaments.objects.filter(crated_by_me=True)
        all_tournaments = tournaments.union(tournaments_user)
        serializer = TournamentsSerializer(all_tournaments, many=True)
        return serializer.data


class TournamentCreationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=30)
    tournament_name = serializers.CharField(max_length=30)
    game_difficulty = serializers.IntegerField()
    tournament_image = serializers.URLField(
        required=False, allow_blank=True, max_length=350
    )

    def validate_tournament_name(self, value):
        if Tournaments.objects.filter(tournament_name=value).exists():
            error = "Tournament with this name already exists."
            raise serializers.ValidationError(error)
        return value

    def validate_game_difficulty(self, value):
        if value not in [1, 2, 3]:
            error = "Game difficulty accept only [1, 2, 3] values."
            raise serializers.ValidationError(error)
        return value

    def create(self, validated_data):
        default_image = "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg?t=1639029468"
        tour_data = Tournaments.objects.create(
            tournament_name=validated_data["tournament_name"],
            image_url=validated_data.get("tournament_image", default_image),
            game_difficulty=validated_data["game_difficulty"],
            tournament_start=datetime.now(),
            crated_by_me=True,
        )
        return tour_data


class UserAchievementsSerializer(serializers.ModelSerializer):
    tournament = serializers.SerializerMethodField()
    match = serializers.SerializerMethodField()
    ai = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("username", "id", "tournament", "match", "ai")

    def get_achievement(self, obj, type: str, names: list) -> dict:
        achievements = {}
        for name in names:
            achievements[name] = UserAchievements.objects.filter(
                user=obj,
                achievement__achievement_type=type,
                achievement__achievement_name=name,
            ).exists()
        return achievements

    @extend_schema_field(serializers.DictField(child=serializers.BooleanField()))
    def get_tournament(self, obj) -> dict:
        return self.get_achievement(obj, "tournament", ["early", "triple", "front"])

    @extend_schema_field(serializers.DictField(child=serializers.BooleanField()))
    def get_match(self, obj) -> dict:
        return self.get_achievement(obj, "match", ["speedy", "last", "king"])

    @extend_schema_field(serializers.DictField(child=serializers.BooleanField()))
    def get_ai(self, obj) -> dict:
        return self.get_achievement(obj, "ai", ["challenger", "rivalry", "legend"])


class GameTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameTable
        fields = "__all__"


class GameSettingsSerializer(serializers.ModelSerializer):
    country = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    game_table = serializers.SerializerMethodField()
    email = serializers.EmailField(min_length=7, max_length=320, required=False)
    username = serializers.CharField(min_length=4, max_length=20, required=False)
    new_password = serializers.CharField(
        write_only=True, max_length=100, min_length=8, required=False, allow_blank=True
    )

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "username",
            "image_url",
            "email",
            "country",
            "city",
            "game_table",
            "is_local",
            "is_2fa_enabled",
            "new_password",
        )

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def validate_new_password(self, value):
        user = self.instance
        if User.objects.filter(id=user.id).first().password is not None and value == "":
            raise serializers.ValidationError("This field may not be blank.")
        return value

    @extend_schema_field(serializers.CharField())
    def get_city(self, obj) -> str:
        if obj.location:
            if "/" in obj.location:
                return obj.location.split("/")[1]
            else:
                return ""
        return ""

    @extend_schema_field(serializers.CharField())
    def get_country(self, obj) -> str:
        if obj.location:
            if "/" in obj.location:
                return obj.location.split("/")[0]
            else:
                return obj.location
        return ""

    @extend_schema_field(serializers.DictField())
    def get_game_table(self, obj) -> dict:
        game_table = GameTable.objects.filter(user=obj).first()
        if not game_table:
            with transaction.atomic():
                game_table = GameTable.objects.create(
                    user=obj,
                    table_color="#161625",
                    ball_color="#ffffff",
                    paddle_color="#ff4655",
                    game_difficulty=1,
                    table_position="6,8,0",
                )
        return GameTableSerializer(instance=game_table).data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        game_table_representation = representation.pop("game_table", {})
        if game_table_representation:
            for key, value in game_table_representation.items():
                representation[key] = value
        return representation
