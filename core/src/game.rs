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
pub struct AnimationKeyframe {
    pub offset: f32,
    #[serde(default)]
    pub x: f32,
    #[serde(default)]
    pub y: f32,
}

#[derive(Deserialize)]
pub struct Animation {
    pub duration: f32,
    pub keyframes: Vec<AnimationKeyframe>,
    #[serde(default)]
    pub delay: f32,
}

#[derive(Deserialize)]
pub struct Tile {
    pub x: f32,
    pub y: f32,
    #[serde(default)]
    pub hidden_to: u32,
    #[serde(default)]
    pub disable_to: u32,
    pub animation: Option<Animation>,
}

#[derive(Deserialize)]
pub struct Goal {
    pub x: f32,
    pub y: f32,
}

#[derive(Deserialize)]
pub struct Map {
    pub width: i32,
    pub height: i32,
    pub players: Vec<Player>,
    pub tiles: Vec<Tile>,
    pub goal: Goal,
}

#[repr(u8)]
pub enum Screen {
    Lobby,
    SelectLevel,
    Game,
}

pub struct GameState {
    pub tick: u32,
    pub screen: Screen,
    pub connections: Vec<u32>,
    pub last_update_tick: u32,
    pub last_sync_tick: u32,

    pub levels: Vec<String>,
    pub selected_level: usize,
    pub confirmed: bool,

    pub map: Option<Map>,
    pub map_json: String,
}

impl GameState {
    pub fn onkeydown(&mut self, player_index: usize, key: u32) {
        match self.screen {
            Screen::Lobby => {
                if key == 13 {
                    self.screen = Screen::SelectLevel;
                    self.last_update_tick = self.tick;
                }
            }

            Screen::SelectLevel => {
                if key == 37 {
                    if self.selected_level > 0 && !self.confirmed {
                        self.selected_level -= 1;
                        self.last_update_tick = self.tick;
                    }
                } else if key == 39 {
                    if self.selected_level + 1 < self.levels.len() && !self.confirmed {
                        self.selected_level += 1;
                        self.last_update_tick = self.tick;
                    }
                } else if key == 13 {
                    self.confirmed = true;
                    self.last_update_tick = self.tick;
                }
            }

            Screen::Game => {
                let map = match self.map {
                    Some(ref mut map) => map,
                    None => return,
                };
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
                    let mut on_ground = false;
                    for tile in tiles {
                        if (tile.y - player.y + 1.).abs() < 0.001 && (tile.x - player.x).abs() < 1.
                        {
                            on_ground = true;
                        }
                    }
                    if player.y.abs() < 0.001 {
                        on_ground = true;
                    }
                    if on_ground {
                        player.vy = 20.;
                    }
                }
            }
        }
    }

    pub fn onkeyup(&mut self, player_index: usize, key: u32) {
        let map = match self.map {
            Some(ref mut map) => map,
            None => return,
        };
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
            if player.y + player.vy / TICK_RATE <= 0. {
                player.vy = 0.;
                player.y = 0.;
            }
        }

        player.x += player.vx / 60.;
        player.y += player.vy / 60.;
    }

    // Update the game state
    pub fn ontick(&mut self) {
        self.tick += 1;

        if !matches!(self.screen, Screen::Game) {
            return;
        }
        let map = match self.map {
            Some(ref mut map) => map,
            None => return,
        };

        for tile in &mut map.tiles {
            let animation = match tile.animation {
                Some(ref mut animation) => animation,
                None => continue,
            };
            let elapsed = self.tick as f32 / 60.;
            let mut offset = (elapsed - animation.delay) / animation.duration;
            offset %= 1.;
            let mut keyframe_index = 0;
            for i in 0..animation.keyframes.len() {
                if animation.keyframes[i].offset > offset {
                    break;
                }
                keyframe_index = i;
            }
            let keyframe = &animation.keyframes[keyframe_index];
            let next_keyframe =
                &animation.keyframes[(keyframe_index + 1) % animation.keyframes.len()];
            // Linear interpolation
            let t = (offset - keyframe.offset) / (next_keyframe.offset - keyframe.offset);
            tile.x = keyframe.x + (next_keyframe.x - keyframe.x) * t;
            tile.y = keyframe.y + (next_keyframe.y - keyframe.y) * t;
        }

        for i in 0..map.players.len() {
            let player = &mut map.players[i];
            GameState::update_player(player, i, &map.tiles);
        }
    }
}
