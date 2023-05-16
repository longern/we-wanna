mod game;

const BUFFER_SIZE: usize = 8192;
static mut INPUT_BUFFER: [u8; BUFFER_SIZE] = [0; BUFFER_SIZE];
static mut OUTPUT_BUFFER: [u8; BUFFER_SIZE] = [0; BUFFER_SIZE];
static mut GAME_STATE: game::GameState = game::GameState { map: None, tick: 0 };

extern "C" {
    fn recv(channel_id: i32, buffer: *mut u8, length: i32) -> i32;
    fn send(channel_id: i32, buffer: *const u8, length: i32) -> i32;
}

#[no_mangle]
pub unsafe fn onmessage(channel_id: i32, length: i32) -> i32 {
    if length > BUFFER_SIZE as i32 {
        // Message too large
        return -1;
    }
    recv(channel_id, INPUT_BUFFER.as_mut_ptr(), BUFFER_SIZE as i32);

    match INPUT_BUFFER[0] {
        0 => {
            // Map message
            let parse_result = game::Map::from_json(&INPUT_BUFFER[1..length as usize]);
            match parse_result {
                Ok(map) => {
                    GAME_STATE.map = Some(map);
                    let output: [u8; 1] = [0; 1];
                    send(channel_id, output.as_ptr(), 1);
                }
                Err(e) => {
                    let message = e.to_string();
                    let output = message.as_bytes();
                    send(channel_id, output.as_ptr(), message.len() as i32);
                }
            }
        }
        1 => {
            GAME_STATE.onkeydown(channel_id as usize - 1, INPUT_BUFFER[1] as u32);
        }
        2 => {
            GAME_STATE.onkeyup(channel_id as usize - 1, INPUT_BUFFER[1] as u32);
        }
        _ => {
            // Unknown message type
        }
    }
    return 0;
}

#[no_mangle]
pub unsafe fn ontick() {
    if GAME_STATE.map.is_none() {
        return;
    }
    GAME_STATE.ontick();

    let map = GAME_STATE.map.as_ref().unwrap();
    let players = &map.players;
    let coords = [players[0].x, players[0].y, players[1].x, players[1].y];
    OUTPUT_BUFFER[0] = 3 as u8;
    // Copy coords into output buffer
    for i in 0..4 {
        let bytes = coords[i].to_le_bytes();
        for j in 0..4 {
            OUTPUT_BUFFER[1 + i * 4 + j] = bytes[j];
        }
    }

    let mut index = 0;
    // Iterate over tiles with animation
    for (i, tile) in map.tiles.iter().enumerate() {
        if tile.animation.is_none() {
            continue;
        }
        let i_bytes = (i as i32).to_le_bytes();
        for i in 0..4 {
            OUTPUT_BUFFER[21 + index * 12 + i] = i_bytes[i];
        }
        let x_bytes = tile.x.to_le_bytes();
        for i in 0..4 {
            OUTPUT_BUFFER[21 + index * 12 + 4 + i] = x_bytes[i];
        }
        let y_bytes = tile.y.to_le_bytes();
        for i in 0..4 {
            OUTPUT_BUFFER[21 + index * 12 + 8 + i] = y_bytes[i];
        }
        index += 1;
    }

    let index_bytes = index.to_le_bytes();
    for i in 0..4 {
        OUTPUT_BUFFER[17 + i] = index_bytes[i];
    }

    for i in 1..3 {
        send(i, OUTPUT_BUFFER.as_ptr(), 21 + index as i32 * 12);
    }
}
