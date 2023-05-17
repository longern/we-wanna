mod game;
mod messages;

use std::convert::TryFrom;

use messages::OutputMessage;

const BUFFER_SIZE: usize = 16384;
static mut INPUT_BUFFER: [u8; BUFFER_SIZE] = [0; BUFFER_SIZE];
static mut GAME_STATE: game::GameState = game::GameState {
    screen: game::Screen::Lobby,
    connections: vec![],
    levels: vec![],
    selected_level: 0,
    confirmed: false,
    last_sync_tick: 0,
    last_update_tick: 0,
    map: None,
    map_json: String::new(),
    tick: 0,
};

extern "C" {
    fn recv(channel_id: i32, buffer: *mut u8, length: i32) -> i32;
    fn send(channel_id: i32, buffer: *const u8, length: i32) -> i32;
}

enum Message {
    LevelList,
    Level,
    KeyDown,
    KeyUp,
}

impl TryFrom<u8> for Message {
    type Error = ();

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Message::LevelList),
            1 => Ok(Message::Level),
            2 => Ok(Message::KeyDown),
            3 => Ok(Message::KeyUp),
            _ => Err(()),
        }
    }
}

#[no_mangle]
pub unsafe fn onmessage(channel_id: i32, length: i32) -> i32 {
    if length > BUFFER_SIZE as i32 {
        // Message too large
        return -1;
    }
    recv(channel_id, INPUT_BUFFER.as_mut_ptr(), BUFFER_SIZE as i32);

    let message = bincode::deserialize::<messages::InputMessage>(&INPUT_BUFFER[0..length as usize]);
    match message {
        Ok(message) => match message {
            messages::InputMessage::LevelList(levels) => {
                GAME_STATE.levels = match serde_json::from_str(&levels) {
                    Ok(levels) => levels,
                    Err(e) => {
                        let message =
                            bincode::serialize(&OutputMessage::Error(e.to_string())).unwrap();
                        send(channel_id, message.as_ptr(), message.len() as i32);
                        return -1;
                    }
                };
                assert!(GAME_STATE.last_update_tick < GAME_STATE.tick);
                GAME_STATE.last_update_tick = GAME_STATE.tick;
            }
            messages::InputMessage::Level(map_json) => {
                let parse_result = serde_json::from_str(map_json.as_str());
                match parse_result {
                    Ok(map) => {
                        GAME_STATE.map = Some(map);
                        GAME_STATE.map_json = map_json;
                        GAME_STATE.screen = game::Screen::Game;
                        assert!(GAME_STATE.last_update_tick < GAME_STATE.tick);
                        GAME_STATE.last_update_tick = GAME_STATE.tick;
                    }
                    Err(e) => {
                        let message =
                            bincode::serialize(&OutputMessage::Error(e.to_string())).unwrap();
                        send(channel_id, message.as_ptr(), message.len() as i32);
                    }
                }
            }
            messages::InputMessage::KeyDown(key) => {
                GAME_STATE.onkeydown(channel_id as usize - 1, key);
            }
            messages::InputMessage::KeyUp(key) => {
                GAME_STATE.onkeyup(channel_id as usize - 1, key);
            }
        },
        Err(_) => {
            return -1;
        }
    }
    return 0;
}

#[no_mangle]
pub unsafe fn ontick() {
    GAME_STATE.ontick();

    match GAME_STATE.screen {
        game::Screen::Lobby => {
            if GAME_STATE.last_sync_tick < GAME_STATE.last_update_tick {
                GAME_STATE.last_sync_tick = GAME_STATE.last_update_tick;
                let message = messages::OutputMessage::Sync(messages::SyncMessage {
                    screen: messages::GameScreenMessage::Lobby(messages::LobbyMessage {
                        players: GAME_STATE.connections.len() as u8 + 1,
                    }),
                });
                let ser_result = match bincode::serialize(&message) {
                    Ok(ser_result) => ser_result,
                    Err(e) => {
                        let message =
                            bincode::serialize(&OutputMessage::Error(e.to_string())).unwrap();
                        send(1, message.as_ptr(), message.len() as i32);
                        return;
                    }
                };
                for i in 1..3 {
                    send(i, ser_result.as_ptr(), ser_result.len() as i32);
                }
            }
        }

        game::Screen::SelectLevel => {
            if GAME_STATE.last_sync_tick < GAME_STATE.last_update_tick {
                GAME_STATE.last_sync_tick = GAME_STATE.last_update_tick;
                let message = messages::OutputMessage::Sync(messages::SyncMessage {
                    screen: messages::GameScreenMessage::SelectLevel(
                        messages::SelectLevelMessage {
                            levels: GAME_STATE.levels.clone(),
                            selected_level: GAME_STATE.selected_level,
                            confirmed: GAME_STATE.confirmed,
                        },
                    ),
                });
                let ser_result = match bincode::serialize(&message) {
                    Ok(ser_result) => ser_result,
                    Err(e) => {
                        let message =
                            bincode::serialize(&OutputMessage::Error(e.to_string())).unwrap();
                        send(1, message.as_ptr(), message.len() as i32);
                        return;
                    }
                };
                for i in 1..3 {
                    send(i, ser_result.as_ptr(), ser_result.len() as i32);
                }
            }
        }

        game::Screen::Game => {
            if GAME_STATE.last_sync_tick < GAME_STATE.last_update_tick {
                GAME_STATE.last_sync_tick = GAME_STATE.last_update_tick;
                let message = messages::OutputMessage::Sync(messages::SyncMessage {
                    screen: messages::GameScreenMessage::Game(messages::GameMessage {
                        level: GAME_STATE.map_json.clone(),
                    }),
                });
                let ser_result = match bincode::serialize(&message) {
                    Ok(ser_result) => ser_result,
                    Err(e) => {
                        let message =
                            bincode::serialize(&OutputMessage::Error(e.to_string())).unwrap();
                        send(1, message.as_ptr(), message.len() as i32);
                        return;
                    }
                };
                for i in 1..3 {
                    send(i, ser_result.as_ptr(), ser_result.len() as i32);
                }
            }

            let map = match GAME_STATE.map {
                Some(ref map) => map,
                None => return,
            };
            let message = match bincode::serialize(&OutputMessage::Coord(messages::CoordMessage {
                player0x: map.players[0].x,
                player0y: map.players[0].y,
                player1x: map.players[1].x,
                player1y: map.players[1].y,
                animated_tiles: map.tiles.iter().enumerate().fold(
                    vec![],
                    |mut acc, (index, tile)| {
                        if tile.animation.is_some() {
                            acc.push((index, tile.x, tile.y));
                        }
                        acc
                    },
                ),
            })) {
                Ok(message) => message,
                Err(e) => {
                    let message = bincode::serialize(&OutputMessage::Error(e.to_string())).unwrap();
                    send(1, message.as_ptr(), message.len() as i32);
                    return;
                }
            };

            for i in 1..3 {
                send(i, message.as_ptr(), message.len() as i32);
            }
        }
    }
}
