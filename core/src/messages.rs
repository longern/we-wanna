use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct LobbyMessage {
    pub players: u8,
}

#[derive(Serialize)]
pub struct SelectLevelMessage {
    pub levels: Vec<String>,
    pub selected_level: usize,
    pub confirmed: bool,
}

#[derive(Serialize)]
pub struct GameMessage {
    pub level: String,
}

#[derive(Serialize)]
#[allow(dead_code)]
pub enum GameScreenMessage {
    PlayMode,
    Lobby(LobbyMessage),
    SelectLevel(SelectLevelMessage),
    Game(GameMessage),
}

#[derive(Serialize)]
pub struct SyncMessage {
    pub screen: GameScreenMessage,
}

#[derive(Serialize)]
pub struct CoordMessage {
    pub player0x: f32,
    pub player0y: f32,
    pub player1x: f32,
    pub player1y: f32,
    pub animated_tiles: Vec<(usize, f32, f32)>,
}

#[derive(Serialize)]
pub struct JoinLobbyMessage {
    pub player_id: u8,
}

#[derive(Serialize)]
#[allow(dead_code)]
#[repr(u8)]
pub enum OutputMessage {
    Sync(SyncMessage),
    JoinLobby(JoinLobbyMessage),
    Coord(CoordMessage),
    Error(String) = 255,
}

#[derive(Deserialize)]
pub enum InputMessage {
    LevelList(String),
    Level(String),
    KeyDown(u32),
    KeyUp(u32),
}
