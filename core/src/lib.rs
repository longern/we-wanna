const BUFFER_SIZE: usize = 1024;
static mut INPUT_BUFFER: [u8; BUFFER_SIZE] = [0; BUFFER_SIZE];

extern "C" {
    fn recv(channel_id: i32, buffer: *mut u8, length: i32) -> i32;
    fn send(channel_id: i32, buffer: *const u8, length: i32) -> i32;
}

#[no_mangle]
pub unsafe fn onmessage(channel_id: i32, length: i32) {
    recv(channel_id, INPUT_BUFFER.as_mut_ptr(), BUFFER_SIZE as i32);
}
