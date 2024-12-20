# Standard library imports
import asyncio
import json
import random
import sys
from datetime import datetime

# Third-party imports
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone

# Local application/library specific imports
from .room import RoomObject
from .models import Match, GameTable

User = get_user_model()


def current_time():
    current_time = timezone.localtime(timezone.now())
    formatted_time = current_time.strftime("%H:%M:%S")
    return formatted_time


@database_sync_to_async
def get_user(user_id):
    try:
        user = User.objects.get(id=user_id)
        return user
    except User.DoesNotExist:
        return AnonymousUser()


@database_sync_to_async
def get_game_data(user):
    try:
        game_data = GameTable.objects.get(user=user.id)
        return game_data
    except GameTable.DoesNotExist:
        game_data = GameTable.objects.create(
            user=user,
            table_color="#161625",
            ball_color="#ffffff",
            paddle_color="#ff4655",
            game_difficulty=1,
            table_position="6,8,0",
        )
        return game_data


@database_sync_to_async
def add_match(
    user_one,
    user_two,
    score_user_one,
    score_user_two,
    match_start,
    match_end,
    tackle_user_one,
    tackle_user_two,
):
    Match.objects.create(
        user_one=user_one,
        user_two=user_two,
        score_user_one=score_user_one,
        score_user_two=score_user_two,
        match_start=match_start,
        match_end=match_end,
        tackle_user_one=tackle_user_one,
        tackle_user_two=tackle_user_two,
    )


Room_index = 0
Rooms = {}


def get_room(room_name):
    global Rooms
    try:
        return Rooms[room_name]
    except KeyError:
        print(f"Room {room_name} does not exist", file=sys.stderr)
    except Exception as e:
        print(f"An error occurred in get_room: {e}", file=sys.stderr)


def delete_room(room_name):
    global Rooms
    try:
        del Rooms[room_name]
    except KeyError:
        print(f"Room {room_name} does not exist", file=sys.stderr)
    except Exception as e:
        print(f"An error occurred in delete_room: {e}", file=sys.stderr)


def add_room(room_name, room):
    global Rooms
    try:
        Rooms[room_name] = room
    except Exception as e:
        print(f"An error occurred in add_room: {e}", file=sys.stderr)


def get_rooms_items():
    try:
        return Rooms.items()
    except Exception as e:
        print(f"An error occurred in iterate_rooms: {e}", file=sys.stderr)


def get_room_index():
    global Room_index
    try:
        return Room_index
    except Exception as e:
        print(f"An error occurred in get_room_index: {e}", file=sys.stderr)


def increment_room_index():
    global Room_index
    try:
        Room_index += 1
    except Exception as e:
        print(f"An error occurred in increment_room_index: {e}", file=sys.stderr)


class GameConsumer(AsyncWebsocketConsumer):
    # -----------------------> 0. send_direct_message <-----------------------
    async def send_winner_message(self):
        try:
            room = get_room(self.room_name)
            winner = room.get_winner()
            data = {"type": "w_message", "winner": winner}
            await self.channel_layer.group_send(self.room_name, data)
        except Exception as e:
            print(f"An error occurred in send_direct_message: {e}", file=sys.stderr)

    async def w_message(self, event):
        try:
            status = "winner" if event["winner"] == self.user.email else "loser"
            message = {
                "message": {
                    "action": "end_game",
                    "status": status,
                    "winner": event["winner"],
                },
                "time": current_time(),
            }
            await self.send(text_data=json.dumps(message))
        except Exception as e:
            print(f"An error occurred in message: {e}", file=sys.stderr)

    # -----------------------> 1. broadcast_message <-----------------------
    async def broadcast_message(self, message):
        try:
            data = {"type": "message", "message": message}
            await self.channel_layer.group_send(self.room_name, data)
        except Exception as e:
            print(f"An error occurred in broadcast_message: {e}", file=sys.stderr)

    # -----------------------> 2. message <-----------------------
    async def message(self, event):
        try:
            message = event["message"]
            data = {"message": message, "time": current_time()}
            await self.send(text_data=json.dumps(data))
        except Exception as e:
            print(f"An error occurred in message: {e}", file=sys.stderr)

    # -----------------------> 3. connect <-----------------------
    async def connction_ack(self):
        try:
            game_data = await get_game_data(self.user)
            print(f"game_data: {game_data.table_position}", file=sys.stderr)
            index = self.room.get_user_index(self.user.email)
            message = {
                "action": "connection_ack",
                "index": index,
                "User": self.user.email,
                "image_url": self.user.image_url,
                "username": self.user.username,
                "Room_name": self.room_name,
                "table_color": game_data.table_color,
                "ball_color": game_data.ball_color,
                "paddle_color": game_data.paddle_color,
                "table_position": game_data.table_position,
            }
            await self.message({"message": message})
        except Exception as e:
            print(f"An error occurred in connction_ack: {e}", file=sys.stderr)

    async def connect(self):
        try:
            if self.scope["user"].is_authenticated:
                await self.accept()
                self.user = await get_user(user_id=self.scope["user"].id)
                self.room_name, self.room = await self.find_or_create_room(self.user)
                await self.channel_layer.group_add(self.room_name, self.channel_name)
                await self.connction_ack()
                if self.room.is_ready() and self.room.is_started() == False:
                    asyncio.ensure_future(self.start_game())
            else:
                await self.close()
        except Exception as e:
            print(f"An error occurred in connect: {e}", file=sys.stderr)

    # -----------------------> 4. disconnect <-----------------------
    async def disconnect(self, close_code):
        try:
            room = get_room(self.room_name)
            room.set_reconect(self.user.email)
            if room.get_user2_stat():
                room.end_game()
            # await self.channel_layer.group_discard(self.room_name, self.channel_name)
            pass
        except Exception as e:
            print(f"An error occurred in disconnect: {e}", file=sys.stderr)

    # -----------------------> 5. receive <-----------------------
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            action = text_data_json.get("action")
            room = get_room(self.room_name)
            if action:
                if action == "paddle_move":
                    paddle = text_data_json["paddle"]
                    speed = text_data_json["speed"]
                    room.set_paddle_speed(paddle, speed)
                elif action == "paddle_stop":
                    paddle = text_data_json["paddle"]
                    room.set_paddle_speed(paddle, 0)
                elif action == "pause":
                    if room.get_user_pause(self.user.email) < 2:
                        if room.is_paused() != True:
                            room.set_user_pause(self.user.email)
                            room.set_game_pause()
                else:
                    print(f"Invalid action received: {action}", file=sys.stderr)
            else:
                print(f"Received message has no 'action' attribute", file=sys.stderr)
        except Exception as e:
            print(f"An error occurred in receive: {e}", file=sys.stderr)

    # -----------------------> 6. start_game <-----------------------
    async def opponents(self):
        try:
            user1, user1_data, user2, user2_data = self.room.get_original_users()
            message = {
                "action": "opponents",
                "user1": user1,
                "user1_image_url": user1_data["user_img"],
                "user1_username": user1_data["username"],
                "user2": user2,
                "user2_image_url": user2_data["user_img"],
                "user2_username": user2_data["username"],
            }
            await self.broadcast_message(message)
        except Exception as e:
            print(f"An error occurred in opponents: {e}", file=sys.stderr)

    async def update_ball_possiton(self):
        try:
            room = get_room(self.room_name)
            ball_position, ball_velocity = room.get_updated_ball()
            message = {
                "action": "update",
                "ball_position_x": ball_position["x"],
                "ball_position_z": ball_position["z"],
                "ball_velocity_x": ball_velocity["velocity_x"],
                "ball_velocity_z": ball_velocity["velocity_z"],
            }
            await self.broadcast_message(message)
        except Exception as e:
            print(f"An error occurred in update_ball_possiton: {e}", file=sys.stderr)

    async def send_score(self):
        try:
            room = get_room(self.room_name)
            message = {
                "action": "score",
                "user1score": room.getScores()["user1"],
                "user2score": room.getScores()["user2"],
            }
            await self.broadcast_message(message)
        except Exception as e:
            print(f"An error occurred in send_score: {e}", file=sys.stderr)

    async def send_padle_position(self):
        try:
            room = get_room(self.room_name)
            if room.is_paddle_move(1):
                message = {
                    "action": "paddle_update",
                    "paddle": 1,
                    "paddle_position_z": room.paddle1_position["z"],
                }
                await self.broadcast_message(message)
            if room.is_paddle_move(2):
                message = {
                    "action": "paddle_update",
                    "paddle": 2,
                    "paddle_position_z": room.paddle2_position["z"],
                }
                await self.broadcast_message(message)
        except Exception as e:
            print(f"An error occurred in send_padle_position: {e}", file=sys.stderr)

    async def add_game_to_db(self):
        try:
            room = get_room(self.room_name)
            await add_match(
                room.get_user_id(1),
                room.get_user_id(2),
                room.getScores()["user1"],
                room.getScores()["user2"],
                room.get_start_date(),
                datetime.now(),
                room.get_tackles(1),
                room.get_tackles(2),
            )
        except Exception as e:
            print(f"An error occurred in add_game_to_db: {e}", file=sys.stderr)

    async def start_game(self):
        try:
            await self.opponents()
            await asyncio.sleep(5)
            await self.broadcast_message({"action": "load_game"})
            await asyncio.sleep(5)
            await self.broadcast_message({"action": "start_game"})
            await asyncio.sleep(2)
            await self.init_pos()
            room = get_room(self.room_name)
            while True:
                if room.is_reconecting():
                    i = 0
                    while room.is_reconecting():
                        if room.is_both_offline():
                            room.end_game()
                            return
                        await asyncio.sleep(1)
                        message = {"action": "reconnecting"}
                        await self.broadcast_message(message)
                        message = {"action": "countdown", "count": 20 - i}
                        await self.broadcast_message(message)
                        if (i := i + 1) > 20:
                            room.end_game()
                            room.make_user_winner(room.get_online_user())
                            await self.send_score()
                            await self.add_game_to_db()
                            await self.send_winner_message()
                            # delete_room(self.room_name)
                            return
                    await self.opponents()
                    await self.broadcast_message({"action": "start_game"})
                    await self.send_score()
                    await asyncio.sleep(1)
                    await self.update_ball_possiton()
                    await asyncio.sleep(5)
                if room.is_paused():
                    await self.broadcast_message({"action": "pause"})
                    for i in range(20, 0, -1):
                        message = {"action": "countdown", "count": i}
                        await self.broadcast_message(message)
                        await asyncio.sleep(1)
                    room.set_game_resume()
                    # await self.opponents()
                    await self.broadcast_message({"action": "start_game"})
                    await self.update_ball_possiton()
                    await asyncio.sleep(5)
                room.ball_update()
                room.ball_intersect()
                room.paddle_update()
                await self.send_padle_position()
                if room.is_out_of_bounds():
                    room.update_score()
                    await self.send_score()
                    if room.is_winner():
                        room.end_game()
                        await self.add_game_to_db()
                        await self.send_winner_message()
                        # delete_room(self.room_name)
                        break
                    room.paddle_reset()
                    await self.reset()
                    await asyncio.sleep(1)
                else:
                    await self.update_ball_possiton()
                await asyncio.sleep(1 / 60)
        except Exception as e:
            print(f"An error occurred in connect: {e}", file=sys.stderr)

    # -----------------------> 7. init_pos <-----------------------
    async def init_pos(self):
        try:
            room = get_room(self.room_name)
            ball_position_z = random.uniform(-2.2, 2.2)
            ball_velocity_x = 0.05 * random.choice([-1, 1])
            ball_velocity_z = 0.05 * random.choice([-1, 1])
            room.set_ball_position(0, ball_position_z)
            room.set_ball_velocity(ball_velocity_x, ball_velocity_z)
            room.start_game()
            return ball_position_z, ball_velocity_x, ball_velocity_z
        except Exception as e:
            print(f"An error occurred in init_pos: {e}", file=sys.stderr)

    # -----------------------> 8. reset <-----------------------
    async def reset(self):
        try:
            room = get_room(self.room_name)
            ball_position_z = random.uniform(-2.2, 2.2)
            if room.ball_position["x"] < 0:
                ball_velocity_x = 0.05
            else:
                ball_velocity_x = -0.05
            ball_velocity_z = 0.05 * random.choice([-1, 1])
            room.set_ball_position(0, ball_position_z)
            room.set_ball_velocity(ball_velocity_x, ball_velocity_z)
            message = {
                "action": "reset",
                "ball_position_x": 0,
                "ball_position_z": ball_position_z,
                "ball_velocity_x": ball_velocity_x,
                "ball_velocity_z": ball_velocity_z,
            }
            await self.broadcast_message(message)
        except Exception as e:
            print(f"An error occurred in reset: {e}", file=sys.stderr)

    # -----------------------> 5. find_or_create_room <-----------------------
    async def find_or_create_room(self, user):
        try:
            rooms_items = get_rooms_items()
            for room_name, room in rooms_items:
                if not room.is_ended():
                    if room.is_user_joined(user.email):
                        room.reconecting_user(self.channel_name, user.email)
                        await self.message({"message": {"action": "reconnected"}})
                        return room_name, room
                    elif not room.is_ready() and not room.is_user_joined(user.email):
                        room.add_user(self.channel_name, user.email, user)
                        await self.message({"message": {"action": "joined"}})
                        return room_name, room
            increment_room_index()
            new_room = RoomObject()
            new_room_name = f"room_{get_room_index()}"
            add_room(new_room_name, new_room)
            new_room.add_user(self.channel_name, user.email, user)
            await self.message({"message": {"action": "created"}})
            return new_room_name, new_room
        except Exception as e:
            print(f"An error occurred in zfind_or_create_room: {e}", file=sys.stderr)
