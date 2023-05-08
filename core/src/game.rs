use serde::Deserialize;

#[derive(Deserialize)]
pub struct Player {
    pub x: f32,
    pub y: f32,
    #[serde(default)]
    pub vx: f32,
    #[serde(default)]
    pub vy: f32,
}

#[derive(Deserialize)]
pub struct Tile {
    pub x: f32,
    pub y: f32,
    #[serde(default)]
    pub hidden_to: u32,
    #[serde(default)]
    pub disable_to: u32,
}

#[derive(Deserialize)]
pub struct Map {
    pub width: i32,
    pub height: i32,
    pub players: Vec<Player>,
    pub tiles: Vec<Tile>,
}

impl Map {
    pub fn from_json(map_json: &[u8]) -> Result<Map, serde_json::Error> {
        serde_json::from_slice(map_json)
    }
}

#[derive(Deserialize)]
pub struct GameState {
    pub map: Option<Map>,
}

impl GameState {
    pub fn onkeydown(&mut self, player_index: usize, key: u32) {
        if self.map.is_none() {
            return;
        }

        let map = self.map.as_mut().unwrap();
        let player = &mut map.players[player_index];
        let tiles = &map.tiles;
        if key == 37 {
            player.vx = -5.0;
        } else if key == 39 {
            player.vx = 5.0;
        } else if key == 32 {
            // Detect if the player is on the ground
            // and if so, set the velocity to jump
            for tile in tiles {
                if (tile.y - player.y + 1.).abs() < 0.001 && (tile.x - player.x).abs() < 1. {
                    player.vy = 20.;
                }
            }
        }
    }

    pub fn onkeyup(&mut self, player_index: usize, key: u32) {
        if self.map.is_none() {
            return;
        }

        let map = self.map.as_mut().unwrap();
        let player = &mut map.players[player_index];
        if key == 37 || key == 39 {
            player.vx = 0.;
        }
    }

    fn update_player(player: &mut Player, index: usize, tiles: &Vec<Tile>) {
        const TICK_RATE: f32 = 60.;
        player.vy -= 60. / TICK_RATE;

        // Check for collisions with tiles
        if player.vx > 0. {
            for tile in tiles {
                if (tile.y - player.y).abs() < 1.
                    && tile.x >= player.x + 1.
                    && tile.x <= player.x + player.vx / TICK_RATE + 1.
                    && tile.disable_to & (1 << index) == 0
                {
                    player.vx = 0.;
                    player.x = tile.x - 1.;
                }
            }
        } else if player.vx < 0. {
            for tile in tiles {
                if (tile.y - player.y).abs() < 1.
                    && tile.x <= player.x - 1.
                    && tile.x >= player.x + player.vx / TICK_RATE - 1.
                    && tile.disable_to & (1 << index) == 0
                {
                    player.vx = 0.;
                    player.x = tile.x + 1.;
                }
            }
        }

        if player.vy > 0. {
            for tile in tiles {
                if (tile.x - player.x).abs() < 1.
                    && tile.y >= player.y + 1.
                    && tile.y <= player.y + player.vy / TICK_RATE + 1.
                    && tile.disable_to & (1 << index) == 0
                {
                    player.vy = 0.;
                    player.y = tile.y - 1.;
                }
            }
        } else if player.vy < 0. {
            for tile in tiles {
                if (tile.x - player.x).abs() < 1.
                    && tile.y <= player.y - 1.
                    && tile.y >= player.y + player.vy / TICK_RATE - 1.
                    && tile.disable_to & (1 << index) == 0
                {
                    player.vy = 0.;
                    player.y = tile.y + 1.;
                }
            }
        }

        player.x += player.vx / 60.;
        player.y += player.vy / 60.;
    }

    // Update the game state
    pub fn ontick(&mut self) {
        let map = self.map.as_mut().unwrap();
        for i in 0..map.players.len() {
            let player = &mut map.players[i];
            GameState::update_player(player, i, &map.tiles);
        }
    }
}