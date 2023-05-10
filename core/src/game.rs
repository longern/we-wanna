use serde::Deserialize;

#[derive(Deserialize)]
pub struct Player {
    pub x: f32,
    pub y: f32,
    #[serde(skip)]
    pub vx: f32,
    #[serde(skip)]
    pub vy: f32,
    #[serde(skip)]
    pub ax: f32,
    #[serde(skip)]
    pub ay: f32,
    #[serde(skip)]
    pub left_pressed: bool,
    #[serde(skip)]
    pub right_pressed: bool,
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
            player.left_pressed = true;
            player.ax = -30.0;
        } else if key == 39 {
            player.right_pressed = true;
            player.ax = 30.0;
        } else if key == 13 {
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
        if key == 37 {
            player.left_pressed = false;
        } else if key == 39 {
            player.right_pressed = false;
        }
        if (!player.left_pressed && !player.right_pressed)
            || (player.left_pressed && player.right_pressed)
        {
            player.ax = 0.;
            player.vx = 0.;
        } else if player.left_pressed {
            player.ax = -30.;
        } else {
            player.ax = 30.;
        }
    }

    fn update_player(player: &mut Player, index: usize, tiles: &Vec<Tile>) {
        const TICK_RATE: f32 = 60.;
        player.vy -= 60. / TICK_RATE;
        player.vx += player.ax / TICK_RATE;
        if player.vx.abs() > 8. {
            player.vx = 8. * player.vx.signum();
        }
        if player.vy.abs() > 40. {
            player.vy = 40. * player.vy.signum();
        }

        // Check for collisions with tiles
        if player.vx > 0. {
            for tile in tiles {
                if (player.y - tile.y).abs() < 1.
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
                if (player.x + player.vx / TICK_RATE - tile.x).abs() < 1.
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
                if (player.x + player.vx / TICK_RATE - tile.x).abs() < 1.
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
